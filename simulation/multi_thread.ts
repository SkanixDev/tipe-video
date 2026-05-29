import seedrandom from "seedrandom";
import fs from "fs";
import os from "os";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { Catalog, VideoAsset } from "./graph/video.js";
import { randomIntBetween } from "./utils/utils.js";
import { CacheNode, OriginNode } from "./graph/graph.js";
import { SimulationEngine } from "./engine.js";

// ==========================================
// CODE COMMUN (Exécuté par le Master ET les Workers)
// ==========================================

seedrandom("generationFilm", { global: true });

const capacitiesFog = [
  50_000_000, 100_000_000, 150_000_000, 300_000_000, 500_000_000,
];
const lambdaVariation = [0.1, 0.5, 0.7, 1, 2, 5];
const technologies: ("LRU" | "Prefetching")[] = ["LRU", "Prefetching"];
const topologies = Array.from({ length: 50 }, (_, index) => index + 1); // [1, 2, 3, ..., 50]
const BEST_ITERATION = 1_000_000;
const exportfile = "export_data.csv";

// Initialisation du catalogue (Chaque thread aura sa propre copie isolée en RAM)
const catalogue = new Catalog();
for (let i = 1; i <= 100; i++) {
  const movie = new VideoAsset(
    i,
    "Film " + i,
    randomIntBetween(20_000_000, 100_000_000),
  );
  catalogue.addCatalog(movie);
}
catalogue.calculateProbability();

function campagne(
  technologie: "LRU" | "Prefetching",
  capacite_fog: number,
  nombre_fogs: number,
  latence: number,
  bande_passante: number,
  catalog: Catalog,
  iteration: number,
  lambda: number,
  seed: string,
): string {
  seedrandom(seed, { global: true });

  const simulation = new SimulationEngine(iteration);
  simulation.techChoice = technologie;
  catalog.zipf_parameter = lambda;
  catalog.calculateProbability();
  simulation.catalog = catalog;

  const originServer = new OriginNode("ORIGIN", "ORIGIN");

  const cdnServer = new CacheNode(
    "CDN",
    "CDN",
    500_000_000,
    { bandwidthToParent: 500_000_000, latencyToParent: 5 },
    originServer,
  );

  for (let indexFog = 0; indexFog < nombre_fogs; indexFog++) {
    const newFog = new CacheNode(
      `FOG_${indexFog}`,
      "FOG",
      capacite_fog,
      {
        bandwidthToParent: bande_passante,
        latencyToParent: latence,
      },
      cdnServer,
    );
    simulation.registerFogNode(newFog);
  }

  simulation.scheduleEvent(0, "USER_ARRIVAL", { lastIndexUser: 0 });
  simulation.run();

  const qttOfUser = simulation.userNode.length;
  const cacheHit = simulation.stats.cacheHits;
  const cacheMiss = simulation.stats.cacheMiss;
  const hitRate = cacheHit / (cacheHit + cacheMiss || 1);

  let totalOctetRequestByAllUser = 0;
  const allLatencies: number[] = [];

  for (let index = 0; index < qttOfUser; index++) {
    const user = simulation.userNode[index];
    totalOctetRequestByAllUser += user.octetDemand;

    for (const stream of user.activeStream) {
      stream.chunks.forEach((value) => {
        allLatencies.push(value.endTime! - value.creationTime!);
      });
    }
  }

  allLatencies.sort((a, b) => a - b);

  // si aucune requête n'a réussi
  if (allLatencies.length === 0) {
    return `${technologie},${iteration},${capacite_fog},${lambda},${nombre_fogs},${hitRate},0,0,0,0\n`;
  }

  const p50 = Math.floor(allLatencies.length * 0.5);
  const p90 = Math.floor(allLatencies.length * 0.9);
  const p99 = Math.floor(allLatencies.length * 0.99);

  const ratioOfOriginAndUser =
    totalOctetRequestByAllUser > 0
      ? (originServer.octetSend / totalOctetRequestByAllUser) * 100
      : 0;

  // On retourne la ligne brute formatée plutôt que d'écrire directement dans le fichier
  return `${technologie},${iteration},${capacite_fog},${lambda},${nombre_fogs},${hitRate},${ratioOfOriginAndUser},${allLatencies[p50]},${allLatencies[p90]},${allLatencies[p99]}\n`;
}

// ==========================================
// LOGIQUE DU THREAD PRINCIPAL (Master)
// ==========================================
if (isMainThread) {
  console.log("=== POOL DE MULTI-THREADING INITIALISÉ ===");

  // Écriture de l'en-tête du fichier de données s'il n'existe pas
  if (!fs.existsSync(exportfile)) {
    fs.writeFileSync(
      exportfile,
      "Technologie,itération,Capacité,zipf_parameter,Nombre de Fogs, Hit rate, Ratio OriginUser,Latence_P50,Latence_P90,Latence_P99\n",
    );
  }

  // 1. Génération de la liste plate de toutes les tâches à accomplir
  const tasks: any[] = [];
  for (const lambda of lambdaVariation) {
    for (const tech of technologies) {
      for (const topo of topologies) {
        for (const capacity of capacitiesFog) {
          for (let i = 0; i < 5; i++) {
            tasks.push({ lambda, tech, topo, capacity, i });
          }
        }
      }
    }
  }

  const totalTasks = tasks.length;
  console.log(`Nombre total de simulations planifiées : ${totalTasks}`);

  // Détection automatique du nombre de cœurs logiques disponibles sur ta machine
  const numCPUs = os.availableParallelism();
  console.log(`Détection du processeur : ${numCPUs} cœurs disponibles.`);

  let taskIndex = 0;
  let activeWorkers = 0;
  let completedTasks = 0;

  // Fonction récursive de gestion du cycle de vie des Workers
  const launchNextWorker = () => {
    if (taskIndex >= totalTasks) {
      if (activeWorkers === 0) {
        console.log("\n=============================================");
        console.log("SUCCÈS : Toutes les simulations sont terminées !");
        console.log("=============================================");
      }
      return;
    }

    const currentTask = tasks[taskIndex++];
    activeWorkers++;

    // Instanciation du Worker en lui passant la tâche dans workerData
    const worker = new Worker(new URL(import.meta.url), {
      workerData: currentTask,
    });

    // Écoute du résultat envoyé par le Worker
    worker.on("message", (csvLine: string) => {
      fs.appendFileSync(exportfile, csvLine);
      completedTasks++;
      activeWorkers--;

      // Affichage d'une barre de progression dynamique
      process.stdout.write(
        `\rProgression : [${completedTasks}/${totalTasks}] (${((completedTasks / totalTasks) * 100).toFixed(2)}%) - Cœurs actifs : ${activeWorkers}`,
      );

      // On relance immédiatement un calcul sur ce cœur libéré
      launchNextWorker();
    });

    worker.on("error", (err) => {
      console.error(`\nErreur critique sur un Worker :`, err);
      activeWorkers--;
      launchNextWorker();
    });
  };

  // Lancement initial de la grappe de Workers (un par cœur disponible)
  console.log(`Déploiement initial des Workers...`);
  for (let i = 0; i < Math.min(numCPUs, totalTasks); i++) {
    launchNextWorker();
  }
}
// ==========================================
// LOGIQUE DES THREADS ENFANTS (Workers)
// ==========================================
else {
  const task = workerData;

  // Exécution isolée de la simulation
  const resultLine = campagne(
    task.tech,
    task.capacity,
    task.topo,
    15,
    12_500,
    catalogue,
    BEST_ITERATION,
    task.lambda,
    "random" + task.i,
  );

  // Renvoi de la chaîne CSV au thread principal
  parentPort?.postMessage(resultLine);
}

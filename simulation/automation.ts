import seedrandom from "seedrandom";
import fs from "fs";
import { Catalog, VideoAsset } from "./graph/video.js";
import { randomIntBetween } from "./utils/utils.js";
import { CacheNode, OriginNode } from "./graph/graph.js";
import { SimulationEngine } from "./engine.js";

seedrandom("generationFilm", { global: true });

const capacitiesFog = [
  50_000_000, 100_000_000, 150_000_000, 300_000_000, 500_000_000,
];
const lambdaVariation = [0.1, 0.5, 0.7, 1, 2, 5];
const technologies: ("LRU" | "Prefetching")[] = ["LRU", "Prefetching"];
const topologies = Array.from({ length: 50 }, (_, index) => index + 1); // [1, 2, 3, ..., 50]
const BEST_ITERATION = 1_000_000;
const iterations = [100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000];
const exportfile = "export_data.csv";

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
) {
  seedrandom(seed, { global: true });
  // Initilisation de la simualtion
  const simulation = new SimulationEngine(iteration);
  simulation.techChoice = technologie;
  catalog.zipf_parameter = lambda;
  catalog.calculateProbability();
  simulation.catalog = catalog;

  // Construction de l'architecture
  // => Serveur d'origine
  const originServer = new OriginNode("ORIGIN", "ORIGIN");

  // => Serveur CDN
  const cdnServer = new CacheNode(
    "CDN",
    "CDN",
    500_000_000,
    { bandwidthToParent: 500_000_000, latencyToParent: 5 },
    originServer,
  );

  // => Serveur Fog
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

  // Lancement de la simualtion
  console.log("==========================");
  console.log("Lancement de la simulation");
  console.log("==========================");
  simulation.scheduleEvent(0, "USER_ARRIVAL", { lastIndexUser: 0 });
  simulation.run();
  console.log("Simualtion terminé");
  console.log("=> Calcul des statistiques");

  // Récupération des métriques
  //
  const qttOfUser = simulation.userNode.length;
  const qttOfFog = simulation.fogNodes.length;
  const cacheHit = simulation.stats.cacheHits;
  const cacheMiss = simulation.stats.cacheMiss;
  const totalRequest = cacheHit + cacheMiss;
  const hitRate = cacheHit / (cacheHit + cacheMiss);

  let totalOctetRequestByAllUser = 0;
  let totalChunksDelivered = 0;
  const allLatencies: number[] = [];

  for (let index = 0; index < qttOfUser; index++) {
    const user = simulation.userNode[index];
    totalOctetRequestByAllUser += user.octetDemand;

    for (const stream of user.activeStream) {
      totalChunksDelivered += stream.chunks.length;
      stream.chunks.map((value) => {
        allLatencies.push(value.endTime! - value.creationTime!);
      });
    }
  }

  // Tri
  allLatencies.sort((a, b) => a - b);
  // récupération des positions
  const p50 = Math.floor(allLatencies.length * 0.5);
  const p90 = Math.floor(allLatencies.length * 0.9);
  const p99 = Math.floor(allLatencies.length * 0.99);

  const ratioOfOriginAndUser =
    totalOctetRequestByAllUser > 0
      ? (originServer.octetSend / totalOctetRequestByAllUser) * 100
      : 0;

  //
  console.log("=====");
  console.log("STATS");
  console.log("=====");
  console.log(" - Nombre d'utilisateur:", qttOfUser);
  console.log(" - Nombre de Fogs:", qttOfFog);
  console.log(" - Nombre de requete:", totalRequest);
  console.log(" - Cache Hits:", cacheHit);
  console.log(" - Cache Miss:", cacheMiss);
  console.log(" - Hits rate:", hitRate);

  //
  console.log(
    " - Octets dmd par les utilisateurs:",
    totalOctetRequestByAllUser,
  );
  console.log(
    " - Octets envoyé par le serveur origin:",
    originServer.octetSend,
  );
  console.log(" - Ratio User/Origin:", ratioOfOriginAndUser);
  console.log(" - Chunk envoyé par l'origin:", totalChunksDelivered);

  if (!fs.existsSync(exportfile)) {
    fs.writeFileSync(
      exportfile,
      "Technologie,itération,Capacité,zipf_parameter,Nombre de Fogs, Hit rate, Ratio OriginUser,Latence_P50,Latence_P90,Latence_P99\n",
    );
  }

  fs.appendFileSync(
    exportfile,
    `${technologie},${iteration},${capacite_fog},${lambda},${nombre_fogs},${hitRate},${ratioOfOriginAndUser},${allLatencies[p50]},${allLatencies[p90]},${allLatencies[p99]}\n`,
  );
}

function main() {
  for (const lambda of lambdaVariation) {
    for (const tech of technologies) {
      for (const topo of topologies) {
        for (const capacity of capacitiesFog) {
          for (let i = 0; i < 5; i++) {
            console.log("PARAMETRE SIMULATION");
            console.log(
              `Lambda: ${lambda} , Tech: ${tech}, Topologie: ${topo}, Capacity: ${capacity}, Itération Multiple: ${i}`,
            );
            campagne(
              tech,
              capacity,
              topo,
              15,
              12_500,
              catalogue,
              BEST_ITERATION,
              lambda,
              "random" + i,
            );
          }
        }
      }
    }
  }
}

// =====================================
// TEST DU MEILLEURS NOMBRE D'ITERAITON
// =====================================

// function main() {
//   for (const ite of iterations) {
//     for (let i = 0; i < 6; i++) {
//       campagne(
//         "Prefetching",
//         150_000_000,
//         2,
//         15,
//         12_500,
//         catalogue,
//         ite,
//         "random" + ite + i,
//       );
//     }
//   }
// }

main();

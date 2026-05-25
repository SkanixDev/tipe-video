// Création du catalogue de film

import { SimulationEngine } from "./engine.js";
import { CacheNode, OriginNode, UserNode } from "./graph/graph.js";
import { Chunk, Stream } from "./graph/packet.js";
import { Catalog, VideoAsset } from "./graph/video.js";
import { randomIntBetween } from "./utils/utils.js";

const catalogue = new Catalog();

for (let i = 1; i < 2; i++) {
  const movie6 = new VideoAsset(
    i,
    "Film " + i,
    randomIntBetween(1_000_000_000, 10_000_000_000),
  );
  catalogue.addCatalog(movie6);
}
catalogue.calculateProbability();

const testCount = new Array(catalogue.catalog.length).fill(0);
for (let i = 0; i < 1000000; i++) {
  const cal = catalogue.selectRandomValue();
  testCount[cal?.id! - 1]++;
}
console.log(testCount);
// Création de la ville
const originServer = new OriginNode("ORIGIN_1", "ORIGIN");

const cdn1 = new CacheNode(
  "CDN_1",
  "CDN",
  10_000_000_000,
  { latencyToParent: 50, bandwidthToParent: 125_000 },
  originServer,
);

const fog1 = new CacheNode(
  "FOG_1",
  "FOG",
  1_000_000_000,
  { latencyToParent: 15, bandwidthToParent: 12_500 },
  cdn1,
);
const fog2 = new CacheNode(
  "FOG_2",
  "FOG",
  1_000_000_000,
  { latencyToParent: 15, bandwidthToParent: 12_500 },
  cdn1,
);

// Création de la simulation
const simulation = new SimulationEngine(10000);
simulation.catalog = catalogue;
simulation.registerFogNode(fog1);
simulation.registerFogNode(fog2);

// Lancement du premier packet USER ARRIVAL
simulation.scheduleEvent(0, "USER_ARRIVAL", {
  lastIndexUser: 0,
});
simulation.run();

// AFFICHAGE DES STATISTIQUES
//
// Comptage par utilisateur

//
console.log("------STATS-------");
console.log("Nombre d'utilisateur:", simulation.userNode.length);
console.log("Nombre de Fogs:", simulation.fogNodes.length);
console.log("Cache Hits:", simulation.stats.cacheHits);
console.log("Cache Miss:", simulation.stats.cacheMiss);
console.log(
  "Hit Rate:",
  (simulation.stats.cacheHits /
    (simulation.stats.cacheHits + simulation.stats.cacheMiss)) *
    100,
);
console.log("------------------");
let userDmd = 0;
for (let i = 0; i < simulation.userNode.length; i++) {
  const element = simulation.userNode[i];
  console.log(
    `[USER_STATS] - ${element.id} à demandé ${element.octetDemand} octets`,
  );
  userDmd += element.octetDemand;
}
console.log(
  `[ORIGIN_STATS] - ${originServer.id} à donné ${originServer.octetSend} octets`,
);
console.log(
  "======> Soit un rapport de: ",
  ((originServer.octetSend / userDmd) * 100).toFixed(4),
);
console.log("------------------");

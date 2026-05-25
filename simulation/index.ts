// Création du catalogue de film

import { SimulationEngine } from "./engine.js";
import { CacheNode, OriginNode, UserNode } from "./graph/graph.js";
import { Chunk, Stream } from "./graph/packet.js";
import { Catalog, VideoAsset } from "./graph/video.js";

const catalogue = new Catalog();

// On crée 5 films avec des IDs uniques de 1 à 5
const movie1 = new VideoAsset(1, "Star wars", 321);
const movie2 = new VideoAsset(2, "Tron 1", 3_170_153_452);
const movie3 = new VideoAsset(3, "Tron 2", 3_170_153_452);
const movie4 = new VideoAsset(4, "Tron 3", 3_170_153_452);
const movie5 = new VideoAsset(5, "Tron 4", 3_170_153_452);

// Ajoutés dans l'ordre strict des rangs de popularité (du plus populaire au moins populaire)
catalogue.addCatalog(movie1); // Rang 1
catalogue.addCatalog(movie2); // Rang 2
catalogue.addCatalog(movie3); // Rang 3
catalogue.addCatalog(movie4); // Rang 4
catalogue.addCatalog(movie5); // Rang 5

for (let i = 6; i < 101; i++) {
  const movie6 = new VideoAsset(i, "Tron 4" + i, 3_170_153_452);
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
const simulation = new SimulationEngine(100);
simulation.catalog = catalogue;
simulation.registerFogNode(fog1);
simulation.registerFogNode(fog2);

// Lancement du premier packet USER ARRIVAL
simulation.scheduleEvent(0, "USER_ARRIVAL", {
  lastIndexUser: 0,
});
simulation.run();

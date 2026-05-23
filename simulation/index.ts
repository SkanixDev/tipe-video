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

// Utilisateur
const user1 = new UserNode("USER_1", "USER", fog1, {
  latencyToParent: 10,
  bandwidthToParent: 2500,
});
const user2 = new UserNode("USER_2", "USER", fog1, {
  latencyToParent: 10,
  bandwidthToParent: 2500,
});

// Création de la simulation
const simulation = new SimulationEngine();
simulation.catalog = catalogue;

// User 1 veut voir tron 1:
const stream1 = new Stream("STREAM_USER_1_VID_1", movie1, user1);
user1.activeStream.push(stream1);

// on init le premier package
const chunkDMD = new Chunk(0, 0, stream1.assetVideo.id, user1);
chunkDMD.history.push(user1);

// on programme l'envoie
simulation.scheduleEvent(
  user1.parent?.config.latencyToParent!,
  "PACKET_ARRIVAL",
  {
    targetNode: fog1,
    packet: chunkDMD,
  },
);

simulation.run();

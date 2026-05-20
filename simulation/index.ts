// Création du catalogue de film

import { SimulationEngine } from "./engine.js";
import { CacheNode, OriginNode, UserNode } from "./graph/graph.js";
import { Chunk, Stream } from "./graph/packet.js";
import { Catalog, VideoAsset } from "./graph/video.js";

const catalogue = new Catalog();

const movie1 = new VideoAsset(1, "Tron l'héritage", 4_139_343_321);
const movie2 = new VideoAsset(2, "Tron Ares", 3_170_153_452);

catalogue.addCatalog(movie1);
catalogue.addCatalog(movie2);

// Création de la ville
const originServer = new OriginNode("ORIGIN_1", "ORIGIN");

const cdn1 = new CacheNode(
  "CDN_1",
  "CDN",
  10_000_000_000,
  { latencyToParent: 50 },
  originServer,
);

const fog1 = new CacheNode(
  "FOG_1",
  "FOG",
  1_000_000_000,
  { latencyToParent: 15 },
  cdn1,
);

// Utilisateur
const user1 = new UserNode("USER_1", "USER", fog1, { latencyToParent: 10 });
const user2 = new UserNode("USER_2", "USER", fog1, { latencyToParent: 10 });

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

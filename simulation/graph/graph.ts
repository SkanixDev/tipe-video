import { SimulationEngine } from "../engine.js";
import {
  ConfigNodeType,
  NetworkNodeType,
  PacketType,
} from "../types/event.type.js";
import { Chunk } from "./packet.js";

class NetworkNode {
  id: string;
  type: NetworkNodeType;
  parent: NetworkNode | undefined;

  // statistique du noeud
  config: ConfigNodeType;

  constructor(
    id: string,
    type: NetworkNodeType,
    parent?: NetworkNode,
    config: ConfigNodeType = {},
  ) {
    this.id = id;
    this.type = type;
    this.parent = parent;
    this.config = config;
  }
}

class UserNode extends NetworkNode {
  handleChunk() {
    return "Noeud gérer";
  }
}
class CacheNode extends NetworkNode {
  handleChunk() {
    return "Noeud gérer";
  }
}

class OriginNode extends NetworkNode {
  handleChunk(chunk: Chunk, engine: SimulationEngine) {
    if (chunk.status === "DOWN")
      throw new Error("Une vidéo à l'origine ne peut pas etre DOWN");
    // retour de requete
    chunk.setStatus("DOWN");

    // recherche de la video
    const video = engine.catalog.getCatalogById(chunk.videoId);

    if (!video) throw new Error("Vidéo Introuvable"); // si id fausse

    const chunkVideo = video?.chunks[chunk.chunkIndex];

    chunk.size = chunkVideo?.size;

    const nextGoal = chunk.history.pop();

    engine.scheduleEvent(nextGoal?.config.latencyToParent!, "PACKET_ARRIVAL", {
      targetNode: nextGoal,
      packet: chunk,
    });
  }
}

export { UserNode, CacheNode, OriginNode, NetworkNode };

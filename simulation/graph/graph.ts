import { SimulationEngine } from "../engine.js";
import {
  ConfigNodeType,
  NetworkNodeType,
  PacketType,
} from "../types/event.type.js";
import { Chunk, Stream } from "./packet.js";
import { VideoChunk } from "./video.js";

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
  activeStream: Stream[] = [];

  handleChunk(chunk: Chunk, engine: SimulationEngine) {
    if (chunk.status !== "DOWN")
      throw Error("Il ne peut pas gérer les émissions ici");

    const stream = this.activeStream.find(
      (el) => el.assetVideo.id === chunk.videoId,
    );

    if (!stream)
      throw new Error(
        "Stream impossible à trouver, video non demandé par l'utilisateur.",
      );

    stream.chunks.push(chunk);
    const videoCatalog = engine.catalog.getCatalogById(stream.assetVideo.id);
    if (!videoCatalog) throw new Error("Vidéo inexistante");
    if (stream.chunks.length >= videoCatalog.chunks.length) {
      stream.status = "END";
    } else {
      stream.nextChunkIndex++;

      // Demande de la suite des chunk
      const newChunk = new Chunk(
        stream.nextChunkIndex,
        0,
        stream.assetVideo.id,
        chunk.from,
      );

      engine.scheduleEvent(this.config.latencyToParent!, "PACKET_ARRIVAL", {
        targetNode: this.parent!,
        packet: newChunk,
      });
    }
  }
}

class CacheNode extends NetworkNode {
  capacity: number;
  usedCapacity: number = 0;
  storage: Map<string, VideoChunk> = new Map(); // videoId_chunkIndex

  constructor(
    id: string,
    type: NetworkNodeType,
    capacity: number,
    config: ConfigNodeType = {},
    parent?: NetworkNode,
  ) {
    super(id, type, parent, config);
    this.capacity = capacity;
  }

  handleChunk(chunk: Chunk, engine: SimulationEngine) {
    if (chunk.status === "UP") {
      // Vérifie si la video est dans la Map
      const keyMap = `${chunk.videoId.toString()}_${chunk.chunkIndex.toString()}`;
      const video = this.storage.get(keyMap);
      if (!video) {
        // Cache miss
        chunk.history.push(this); // ajout à l'historique
        engine.scheduleEvent(this.config.latencyToParent!, "PACKET_ARRIVAL", {
          targetNode: this.parent!,
          packet: chunk,
        });
      } else {
        // Cache hit
        chunk.setStatus("DOWN");
        chunk.size = video.size;

        if (this.storage.delete(keyMap)) {
          this.storage.set(keyMap, video);

          const nextGoal = chunk.history.pop();

          if (!nextGoal) throw new Error("Il n'y a pas d'historique, erreur");

          engine.scheduleEvent(
            nextGoal?.config.latencyToParent!,
            "PACKET_ARRIVAL",
            {
              targetNode: nextGoal,
              packet: chunk,
            },
          );
        } else throw new Error("Video Introuvable, erreur");
      }
    } else {
      // Ajouter la video au storage
      if (chunk.size > this.capacity) return; // fichier plus grand que cache on skip
      while (this.usedCapacity + chunk.size > this.capacity) {
        const oldestKey = this.storage.keys().next().value;
        if (!oldestKey) throw new Error("Le stockage est déjà vide");
        this.usedCapacity -= this.storage.get(oldestKey)?.size!;
        this.storage.delete(oldestKey);
      }
      this.storage.set(
        `${chunk.videoId.toString()}_${chunk.chunkIndex.toString()}`,
        engine.catalog.getCatalogById(chunk.videoId)?.chunks[chunk.chunkIndex]!,
      );
      this.usedCapacity += chunk.size;

      const nextGoal = chunk.history.pop();

      if (!nextGoal) throw new Error("Il n'y a pas d'historique, erreur");

      engine.scheduleEvent(
        nextGoal?.config.latencyToParent!,
        "PACKET_ARRIVAL",
        {
          targetNode: nextGoal,
          packet: chunk,
        },
      );
    }
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

    if (!nextGoal) throw new Error("Il n'y a pas d'historique, erreur");

    engine.scheduleEvent(nextGoal?.config.latencyToParent!, "PACKET_ARRIVAL", {
      targetNode: nextGoal,
      packet: chunk,
    });
  }
}

export { UserNode, CacheNode, OriginNode, NetworkNode };

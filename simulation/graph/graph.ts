import { SimulationEngine } from "../engine.js";
import {
  ConfigNodeType,
  NetworkNodeType,
  PacketType,
} from "../types/event.type.js";
import { Chunk, PreChunk, Stream } from "./packet.js";
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

  calculateTransmissionDelay(chunkSize: number): number {
    const latency = this.config.latencyToParent || 0;
    const bandwith = this.config.bandwidthToParent;

    if (!bandwith) return latency;

    // Latence + (Taille / Débit)
    return latency + chunkSize / bandwith;
  }
}

class UserNode extends NetworkNode {
  activeStream: Stream[] = [];
  octetDemand: number = 0;

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

    // ajout du nombre d'octet --- STATS
    chunk.from.octetDemand += chunk.size;
    chunk.endTime = engine.currentTime;

    if (!videoCatalog) throw new Error("Vidéo inexistante");
    if (stream.chunks.length >= videoCatalog.chunks.length) {
      stream.status = "END";
      console.log("END ATTEINT");
    } else {
      stream.nextChunkIndex++;

      // Demande de la suite des chunk
      const newChunk = new Chunk(
        stream.nextChunkIndex,
        0,
        stream.assetVideo.id,
        chunk.from,
        engine.currentTime,
      );
      newChunk.history.push(this);

      const delay = this.calculateTransmissionDelay(chunk.size);

      engine.scheduleEvent(delay, "PACKET_ARRIVAL", {
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
  private inFlightRequest = new Set<string>(); // videoId_chunkIndex

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
        const delay = this.calculateTransmissionDelay(chunk.size);

        // ajout de la stats miiss
        engine.stats.cacheMiss++;
        // =============
        // Système si le prefetching est activé
        // =============
        if (engine.techChoice === "Prefetching") {
          // envoie du packet de base dmd
          engine.scheduleEvent(delay, "PACKET_ARRIVAL", {
            targetNode: this.parent!,
            packet: chunk,
          });

          // envoie du prefetching suivant
          this.sendToPrefetch(chunk, engine, delay);
        } else if (engine.techChoice === "LRU") {
          engine.scheduleEvent(delay, "PACKET_ARRIVAL", {
            targetNode: this.parent!,
            packet: chunk,
          });
        }
      } else {
        // Cache hit
        chunk.setStatus("DOWN");
        chunk.size = video.size;

        //ajout de la stats hit
        engine.stats.cacheHits++;

        if (this.storage.delete(keyMap)) {
          this.storage.set(keyMap, video);

          const nextGoal = chunk.history.pop();

          if (!nextGoal) throw new Error("Il n'y a pas d'historique, erreur");
          const delay = nextGoal.calculateTransmissionDelay(chunk.size);

          engine.scheduleEvent(delay, "PACKET_ARRIVAL", {
            targetNode: nextGoal,
            packet: chunk,
          });

          this.sendToPrefetch(chunk, engine, delay);
        } else throw new Error("Video Introuvable, erreur");
      }
    } else {
      // 1. Définir la clé unique du morceau
      const cacheKey = `${chunk.videoId.toString()}_${chunk.chunkIndex.toString()}`;

      // 2. Si le morceau est plus grand que le cache, on ignore le stockage
      if (chunk.size > this.capacity) return;

      // 3. GESTION DU DOUBLON / MISE À JOUR LRU
      if (this.storage.has(cacheKey)) {
        this.storage.delete(cacheKey);
      } else {
        while (this.usedCapacity + chunk.size > this.capacity) {
          const oldestKey = this.storage.keys().next().value;
          if (!oldestKey) break; // Sécurité élégante

          this.usedCapacity -= this.storage.get(oldestKey)?.size!;
          this.storage.delete(oldestKey);
        }
        this.usedCapacity += chunk.size;
      }

      // 4. On applique le stockage
      this.storage.set(
        cacheKey,
        engine.catalog.getCatalogById(chunk.videoId)?.chunks[chunk.chunkIndex]!,
      );

      // 5. on route vers le bas
      const nextGoal = chunk.history.pop();

      if (!nextGoal) throw new Error("Il n'y a pas d'historique, erreur");
      const delay = nextGoal.calculateTransmissionDelay(chunk.size);

      engine.scheduleEvent(delay, "PACKET_ARRIVAL", {
        targetNode: nextGoal,
        packet: chunk,
      });
    }
  }

  handlePrefetchChunk(chunk: PreChunk, engine: SimulationEngine) {
    if (chunk.status === "UP") {
      // Vérifie si la video est dans la Map
      const keyMap = `${chunk.videoId.toString()}_${chunk.chunkIndex.toString()}`;
      const video = this.storage.get(keyMap);
      // cache miss
      if (!video) {
        // Cache miss
        chunk.history.push(this); // ajout à l'historique
        const delay = this.calculateTransmissionDelay(chunk.size);

        engine.scheduleEvent(delay, "PACKET_PREFETCH", {
          targetNode: this.parent!,
          packet: chunk,
        });
      } else {
        // Cache hit
        // renvoie de la requete
        chunk.setStatus("DOWN");
        chunk.size = video.size;
        const nextGoal = chunk.history.pop();

        if (!nextGoal) throw new Error("Il n'y a pas d'historique, erreur");
        const delay = nextGoal.calculateTransmissionDelay(chunk.size);

        engine.scheduleEvent(delay, "PACKET_PREFETCH", {
          targetNode: nextGoal,
          packet: chunk,
        });
      }
    } else {
      // on vérif si c'est l'endroit où il faut stocker le prefetching
      if (chunk.history.length !== 0) {
        // sinon on fait descendre
        const nextGoal = chunk.history.pop()!;
        const delay = nextGoal.calculateTransmissionDelay(chunk.size);
        engine.scheduleEvent(delay, "PACKET_PREFETCH", {
          packet: chunk,
          targetNode: nextGoal,
        });
      }

      // Définir la clé unique du morceau
      const cacheKey = `${chunk.videoId.toString()}_${chunk.chunkIndex.toString()}`;

      // 2. Si le morceau est plus grand que le cache, on ignore le stockage
      if (chunk.size > this.capacity) return;

      // 3. GESTION DU DOUBLON / MISE À JOUR LRU
      if (this.storage.has(cacheKey)) {
        this.storage.delete(cacheKey);
      } else {
        while (this.usedCapacity + chunk.size > this.capacity) {
          const oldestKey = this.storage.keys().next().value;
          if (!oldestKey) break; // Sécurité élégante

          this.usedCapacity -= this.storage.get(oldestKey)?.size!;
          this.storage.delete(oldestKey);
        }
        this.usedCapacity += chunk.size;
      }

      // 4. On applique le stockage
      this.storage.set(
        cacheKey,
        engine.catalog.getCatalogById(chunk.videoId)?.chunks[chunk.chunkIndex]!,
      );
      this.inFlightRequest.delete(`${chunk.videoId}_${chunk.chunkIndex}`);
      console.log("Réception du prefetching prêt");
    }
  }

  sendToPrefetch(chunk: Chunk, engine: SimulationEngine, delay: number) {
    // envoie des packet N+1 , N+2
    for (let index = 1; index <= 2; index++) {
      const keyMap = `${chunk.videoId.toString()}_${(chunk.chunkIndex + index).toString()}`;
      const checkChunkExist = engine.catalog.getCatalogById(chunk.videoId)
        ?.chunks[chunk.chunkIndex + index];
      if (!checkChunkExist) continue;
      if (this.storage.has(keyMap)) continue;
      if (
        this.inFlightRequest.has(`${chunk.videoId}_${chunk.chunkIndex + index}`)
      )
        continue; // si la requete est déjà en cours

      const newPrefetchChunk = new PreChunk(
        chunk.chunkIndex + index, // video actuelle + N
        0,
        chunk.videoId,
        this,
        engine.currentTime,
        "UP",
      );

      newPrefetchChunk.history.push(this);

      engine.scheduleEvent(delay, "PACKET_PREFETCH", {
        targetNode: this.parent!,
        packet: newPrefetchChunk,
      });
      this.inFlightRequest.add(`${chunk.videoId}_${chunk.chunkIndex + index}`);
    }
  }
}

class OriginNode extends NetworkNode {
  octetSend: number = 0;

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
    const delay = nextGoal.calculateTransmissionDelay(chunk.size);

    // ajouter le nombre d'octet envoyé
    this.octetSend += chunk.size;

    engine.scheduleEvent(delay, "PACKET_ARRIVAL", {
      targetNode: nextGoal,
      packet: chunk,
    });
  }

  handlePrefetchChunk(chunk: PreChunk, engine: SimulationEngine) {
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
    const delay = nextGoal.calculateTransmissionDelay(chunk.size);

    // ajouter le nombre d'octet envoyé
    this.octetSend += chunk.size;

    engine.scheduleEvent(delay, "PACKET_PREFETCH", {
      targetNode: nextGoal,
      packet: chunk,
    });
  }
}

export { UserNode, CacheNode, OriginNode, NetworkNode };

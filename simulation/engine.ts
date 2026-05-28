import { PriorityQueue, EventTreeNode } from "./event.js";
import { CacheNode, UserNode } from "./graph/graph.js";
import { Chunk, Stream } from "./graph/packet.js";
import { Catalog } from "./graph/video.js";
import {
  EventType,
  ScheduleEventDataType,
  StatsSimulationEngine,
} from "./types/event.type.js";

class SimulationEngine {
  currentTime: number = 0;
  catalog: Catalog = new Catalog();
  techChoice: "LRU" | "Prefetching" = "Prefetching";
  private queue = new PriorityQueue();
  private lambdaArrivalUser = 0.01;

  // construction du graph
  public fogNodes: CacheNode[] = [];
  public userNode: UserNode[] = [];

  // gérer l'arrêt du code
  private iteration;
  private currentIteration = 0;

  // A ajouter
  stats: StatsSimulationEngine = {
    cacheHits: 0,
    cacheMiss: 0,
  };

  constructor(iteration: number) {
    this.iteration = iteration;
  }

  // permet d'ajouter un évenement à la liste d'attente
  scheduleEvent(
    delay: number,
    type: EventType,
    data: ScheduleEventDataType,
  ): void {
    const absoluteTime = this.currentTime + delay;
    // console.log(
    //   "absoluteTime:",
    //   absoluteTime,
    //   `itération: ${this.currentIteration}/${this.iteration}`,
    // );
    const newEvent = new EventTreeNode(absoluteTime, type, data);

    this.queue.enqueue(newEvent);
  }

  run() {
    while (this.currentIteration < this.iteration) {
      // 1.  On dequeue l'event
      const runningEvent = this.queue.dequeue();

      if (!runningEvent) break;

      // 2. On avance dans le temps de l'event
      this.currentTime = runningEvent?.time;

      // 3. On execute le code
      this.processEvent(runningEvent);
      this.currentIteration++;
    }
  }

  registerFogNode(node: CacheNode) {
    this.fogNodes.push(node);
  }

  processEvent(event: EventTreeNode) {
    switch (event.type) {
      case "PACKET_ARRIVAL": {
        // console.log(
        //   `[HORLOGE: ${this.currentTime}ms] Traitement de l'événement: ${event.type} pour le nœud: ${event.data.targetNode.id}`,
        // );
        const { targetNode, packet } = event.data;

        targetNode.handleChunk(packet, this);
        break;
      }
      case "USER_ARRIVAL":
        this.privateEnterNewUser(event.data);
        break;
      case "PACKET_PREFETCH":
        const { targetNode, packet, wanted } = event.data;
        // console.log(
        //   `\x1b[32m [HORLOGE: ${this.currentTime}ms] Prefetching actif`,
        // );
        targetNode.handlePrefetchChunk(packet, this);
        break;
      default:
        break;
    }
  }

  // permet de faire rentrer un nouvel utilisateur lors de l'event "USER_ARRIVAL"
  private privateEnterNewUser(data: { lastIndexUser: number }) {
    const randomIndex = Math.floor(Math.random() * this.fogNodes.length);
    const attachedFog = this.fogNodes[randomIndex];

    const newUser = new UserNode(
      `USER_${data.lastIndexUser + 1}`,
      "USER",
      attachedFog,
      { bandwidthToParent: 50_000, latencyToParent: 2 },
    );
    // register de l'utilisateur
    this.userNode.push(newUser);

    // selection du film
    const selectedProbabilityItem = this.catalog.selectRandomValue();
    const selectedMovie = this.catalog.getCatalogById(
      selectedProbabilityItem.id,
    );

    if (!selectedMovie) throw new Error("Film introuvable");

    const stream = new Stream(
      `STREAM_USER_${newUser.id}_VID_${selectedMovie?.id}`,
      selectedMovie,
      newUser,
    );
    newUser.activeStream.push(stream);

    // console.info(
    //   `\x1b[33m[t=${this.currentTime}ms] Nouvel utilisateur ${newUser.id} connecté au Fog ${attachedFog.id} pour voir : ${selectedMovie?.title}`,
    //   `Déclanché par: USER_${data.lastIndexUser}`,
    // );

    // création de la requete
    const newChunk = new Chunk(
      0,
      0,
      selectedMovie.id,
      newUser,
      this.currentTime,
      "UP",
    );

    newChunk.history.push(newUser);

    this.scheduleEvent(0, "PACKET_ARRIVAL", {
      packet: newChunk,
      targetNode: attachedFog,
    });

    this.scheduleEvent(
      this.getNextInterArrivalTime(this.lambdaArrivalUser),
      "USER_ARRIVAL",
      { lastIndexUser: data.lastIndexUser + 1 },
    );
  }

  private getNextInterArrivalTime(lambda: number): number {
    const u = Math.random();
    // pour éviter un -infinity
    const safeU = u === 0 ? 0.0001 : u;
    return -Math.log(safeU) / lambda; // on fait un -log(U)/lambda => U une proba uniforme
  }
}

export { SimulationEngine };

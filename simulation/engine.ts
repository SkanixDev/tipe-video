import { PriorityQueue, EventTreeNode } from "./event.js";
import { EventType } from "./types/event.type.js";

class SimulationEngine {
  currentTime: number = 0;
  private queue = new PriorityQueue();

  // A ajouter
  stats: any;

  constructor() {}

  // permet d'ajouter un évenement à la liste d'attente
  scheduleEvent(delay: number, type: EventType, data: any): void {
    const absoluteTime = this.currentTime + delay;
    console.log("absoluteTime:", absoluteTime);
    const newEvent = new EventTreeNode(absoluteTime, type, data);

    this.queue.enqueue(newEvent);
  }

  run() {
    while (true) {
      // 1.  On dequeue l'event
      const runningEvent = this.queue.dequeue();

      if (!runningEvent) break;

      // 2. On avance dans le temps de l'event
      this.currentTime = runningEvent?.time;

      // 3. On execute le code
      this.processEvent(runningEvent);
    }
  }

  processEvent(event: EventTreeNode) {
    switch (event.type) {
      case "PACKET_ARRIVAL":

      default:
        break;
    }
  }
}

export { SimulationEngine };

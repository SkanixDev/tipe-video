import { EventType } from "./types/types.js";

// Définition d'un noeud
class EventTreeNode {
  type: EventType = "PACKET_ARRIVAL";
  data: any;
  public time: number;

  constructor(time: number, type: EventType, data: any) {
    this.time = time;
    this.type = type;
    this.data = data;
  }
}

// Class de ma file de priorité
class PriorityQueue {
  queue = [] as EventTreeNode[];

  constructor() {
    this.queue = [];
  }

  getLeftElement(i: number) {
    return 2 * i + 1;
  }

  getRightElement(i: number) {
    return 2 * i + 2;
  }

  getParent(i: number) {
    return Math.floor((i - 1) / 2);
  }

  // Permet d'ajouter un élément à la file d'attente
  enqueue(element: EventTreeNode): void {
    this.queue.push(element);

    let i = this.queue.length - 1;
    while (i > 0 && this.queue[this.getParent(i)].time > this.queue[i].time) {
      const parent = this.getParent(i);
      // on échange la valeur entre le fils et son parent
      [this.queue[parent], this.queue[i]] = [this.queue[i], this.queue[parent]];
      i = parent;
    }
  }

  // Permet de retirer un élément de la file d'attente
  dequeue(): EventTreeNode | undefined {
    if (this.queue.length === 0) return undefined;

    const elementRemove = this.queue[0];
    const lastElement = this.queue.pop();

    // S'il reste des éléments après le pop, on place le dernier à la racine et on le fait descendre
    if (this.queue.length > 0 && lastElement) {
      this.queue[0] = lastElement;

      let i = 0;
      const length = this.queue.length;

      while (true) {
        let smallest = i; // On suppose que le parent est le plus petit
        const left = this.getLeftElement(i);
        const right = this.getRightElement(i);

        // On compare avec l'enfant gauche
        if (
          left < length &&
          this.queue[left].time < this.queue[smallest].time
        ) {
          smallest = left;
        }

        // On fait pareil pour l'enfant droit
        if (
          right < length &&
          this.queue[right].time < this.queue[smallest].time
        ) {
          smallest = right;
        }

        // Si le plus petit n'est plus le parent 'i', on doit faire un échange
        if (smallest !== i) {
          [this.queue[i], this.queue[smallest]] = [
            this.queue[smallest],
            this.queue[i],
          ];
          i = smallest; // On met à jour i pour la prochaine itération
        } else {
          // Si le parent est toujours le plus petit
          break;
        }
      }
    }

    return elementRemove;
  }
}

export { PriorityQueue, EventTreeNode };

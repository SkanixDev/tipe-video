import { UserNode } from "./graph.js";

class Packet {
  id: string; // USER_N_DMD_N_VID_N;

  // Status dans le graphe
  from: UserNode;
  idAssetVideo: number;
  history: string[] = []; // contient les id des noeud parcourus
  status: "GO" | "BACK";
  chunkIndex: number = 0;

  constructor(
    id: string,
    assetVideoId: number,
    from: UserNode,
    status?: "GO" | "BACK",
  ) {
    this.id = id;
    this.idAssetVideo = assetVideoId;
    this.from = from;
    this.status = status ? status : "GO";
  }
}

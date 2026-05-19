import { ChunkStatus, StatusAsset } from "../types/event.type.js";
import { NetworkNode, UserNode } from "./graph.js";
import { VideoAsset, VideoChunk } from "./video.js";

class Stream {
  id: string; // STREAM_USER_N_VID_N;

  // Status dans le graphe
  from: UserNode;
  assetVideo: VideoAsset;
  status: StatusAsset = "START";
  chunks: Chunk[] = [];

  constructor(id: string, assetVideoId: VideoAsset, from: UserNode) {
    this.id = id;
    this.assetVideo = assetVideoId;
    this.from = from;
  }
}

class Chunk {
  chunkIndex: number;

  from: UserNode;
  status: ChunkStatus;
  size: number; // nombre d'octets
  videoId: number;
  history: NetworkNode[] = [];

  constructor(
    id: number,
    size: number,
    videoId: number,
    from: UserNode,
    status?: ChunkStatus,
  ) {
    this.chunkIndex = id;
    this.size = size;
    this.status = status ? status : "UP";
    this.videoId = videoId;
    this.from = from;
  }

  setStatus(status: ChunkStatus) {
    this.status = status;
  }
}

export { Chunk, Stream };

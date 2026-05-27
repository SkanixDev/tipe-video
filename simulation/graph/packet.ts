import { ChunkStatus, StatusAsset } from "../types/event.type.js";
import { CacheNode, NetworkNode, UserNode } from "./graph.js";
import { VideoAsset, VideoChunk } from "./video.js";

class Stream {
  id: string; // STREAM_USER_N_VID_N;

  // Status dans le graphe
  from: UserNode;
  assetVideo: VideoAsset;
  status: StatusAsset = "START";
  chunks: Chunk[] = [];
  nextChunkIndex: number = 0;

  constructor(id: string, assetVideoId: VideoAsset, from: UserNode) {
    this.id = id;
    this.assetVideo = assetVideoId;
    this.from = from;
  }
}

class AtomeChunk {
  chunkIndex: number;
  creationTime: number;
  endTime: number | undefined;

  status: ChunkStatus;
  size: number; // nombre d'octets
  videoId: number;
  history: NetworkNode[] = [];

  constructor(
    id: number,
    size: number,
    videoId: number,
    creationTime: number,
    status?: ChunkStatus,
  ) {
    this.chunkIndex = id;
    this.size = size;
    this.status = status ? status : "UP";
    this.videoId = videoId;
    this.creationTime = creationTime;
  }

  setStatus(status: ChunkStatus) {
    this.status = status;
  }
}

class Chunk extends AtomeChunk {
  from: UserNode;

  constructor(
    id: number,
    size: number,
    videoId: number,
    from: UserNode,
    creationTime: number,
    status?: ChunkStatus,
  ) {
    super(id, size, videoId, creationTime, status);
    this.from = from;
  }
}

class PreChunk extends AtomeChunk {
  from: CacheNode;

  constructor(
    id: number,
    size: number,
    videoId: number,
    from: CacheNode,
    creationTime: number,
    status?: ChunkStatus,
  ) {
    super(id, size, videoId, creationTime, status);
    this.from = from;
  }
}

export { Chunk, PreChunk, Stream };

import { NetworkNode } from "../graph/graph.js";
import { Chunk } from "../graph/packet.js";

export type EventType =
  | "USER_REQUEST_GENERATED"
  | "PACKET_ARRIVAL"
  | "VIDEO_DELIVERED"
  | "USER_ARRIVAL";

export type NetworkNodeType = "USER" | "FOG" | "CDN" | "ORIGIN";

export type PacketType = "STREAM" | "PACKET";

export type ConfigNodeType = {
  latencyToParent?: number; // peut être nulle pour l'origine
  bandwidthToParent?: number;
};

export type ChunkStatus = "UP" | "DOWN";

export type StatusAsset = "START" | "STREAM" | "END";

export type ScheduleEventDataType =
  | {
      targetNode: NetworkNode;
      packet: Chunk;
    }
  | { lastIndexUser: number };

export type StatsSimulationEngine = {
  cacheHits: number;
  cacheMiss: number;
};

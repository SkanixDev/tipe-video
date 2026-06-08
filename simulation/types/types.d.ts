import { NetworkNode } from "../graph/graph.ts";
import { Chunk, PreChunk } from "../graph/packet.ts";

export type EventType = "PACKET_ARRIVAL" | "USER_ARRIVAL" | "PACKET_PREFETCH";

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
      packet: Chunk | PreChunk;
    }
  | { lastIndexUser: number };

export type StatsSimulationEngine = {
  cacheHits: number;
  cacheMiss: number;
};

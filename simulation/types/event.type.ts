export type EventType =
  | "USER_REQUEST_GENERATED"
  | "PACKET_ARRIVAL"
  | "VIDEO_DELIVERED";

export type NetworkNodeType = "USER" | "FOG" | "CDN" | "ORIGIN";

export type PacketType = "STREAM" | "PACKET";

export type ConfigNodeType = {
  latencyToParent?: number; // peut être nulle pour l'origine
};

export type ChunkStatus = "UP" | "DOWN";

export type StatusAsset = "START" | "STREAM" | "END";

type EventType =
  | "USER_REQUEST_GENERATED"
  | "PACKET_ARRIVAL"
  | "VIDEO_DELIVERED";

type NetworkNodeType = "USER" | "FOG" | "CDN" | "ORIGIN";

type PacketType = "STREAM" | "PACKET";

type ConfigNodeType = {
  latencyToParent?: number; // peut être nulle pour l'origine
};

export type { EventType, NetworkNodeType, ConfigNodeType, PacketType };

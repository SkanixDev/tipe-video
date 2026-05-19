import {
  ConfigNodeType,
  NetworkNodeType,
  PacketType,
} from "../types/event.type.js";

class NetworkNode {
  id: string;
  type: NetworkNodeType;
  parent: NetworkNode | undefined;

  // statistique du noeud
  config: ConfigNodeType;

  constructor(
    id: string,
    type: NetworkNodeType,
    parent?: NetworkNode,
    config: ConfigNodeType = {},
  ) {
    this.id = id;
    this.type = type;
    this.parent = parent;
    this.config = config;
  }
}

class UserNode extends NetworkNode {
  handlePacket() {
    return "Noeud gérer";
  }
}
class CacheNode extends NetworkNode {
  handlePacket() {
    return "Noeud gérer";
  }
}

class OriginNode extends NetworkNode {
  handlePacket() {
    return "Noeud gérer";
  }
}

export { UserNode, CacheNode, OriginNode };

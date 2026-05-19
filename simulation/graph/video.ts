class VideoAsset {
  id: number;
  size: number; // taille en octet
  packets: VideoChunk[] = [];

  constructor(id: number, size: number) {
    this.id = id;
    this.size = size;
  }

  splitFile() {
    // il faut découper le fichier en mini packet pour les envoyer
  }
}

class VideoChunk {
  idPacket: number;
  size: number;

  constructor(id: number, size: number) {
    this.idPacket = id;
    this.size = size;
  }
}

export { VideoAsset, VideoChunk };

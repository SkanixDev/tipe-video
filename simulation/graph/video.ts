const CHUNK_MAX_SIZE = 2 * 10 ** 6;

class VideoAsset {
  id: number;
  title: string;
  size: number; // taille en octet
  chunks: VideoChunk[] = [];

  constructor(id: number, title: string, size: number) {
    this.id = id;
    this.size = size;
    this.title = title;
  }

  splitFile() {
    let tempSize = this.size;
    let index = 0;
    while (tempSize > 0) {
      // creation du chunk
      let chunkSize = tempSize - CHUNK_MAX_SIZE > 0 ? CHUNK_MAX_SIZE : tempSize;
      const newChunk = new VideoChunk(index, chunkSize);
      this.chunks.push(newChunk);

      // changement des valeurs
      tempSize -= chunkSize;
      index++;
    }
  }
}

class VideoChunk {
  idChunk: number;
  size: number;

  constructor(id: number, size: number) {
    this.idChunk = id;
    this.size = size;
  }
}

class Catalog {
  catalog: VideoAsset[] = [];

  constructor() {}

  addCatalog(asset: VideoAsset) {
    this.catalog.push(asset);
  }

  getCatalogById(idAssets: number) {
    return this.catalog.find((el) => el.id === idAssets);
  }
}

export { VideoAsset, VideoChunk, Catalog };

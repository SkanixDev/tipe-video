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
    this.splitFile();
  }

  splitFile() {
    console.log("Spliting du film:", this.title);
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
  zipf_parameter: number = 0.7;
  probability: { id: number; value: number }[] = []; // id , valeur de proba
  normalizationFactor: number = 0;

  constructor() {}

  addCatalog(asset: VideoAsset) {
    this.catalog.push(asset);
  }

  getCatalogById(idAssets: number) {
    return this.catalog.find((el) => el.id === idAssets);
  }

  calculateProbability() {
    const h = this.calculateNormalization();
    let beforeValue = 0;
    for (let i = 1; i <= this.catalog.length; i++) {
      const value = 1 / i ** this.zipf_parameter / h;
      this.probability.push({
        id: this.catalog[i - 1].id,
        value: value + beforeValue,
      });
      beforeValue += value;
      console.log("Calcul", value, beforeValue);
    }
    console.log("norm:", h);
    console.log("map:", this.probability);
  }

  selectRandomValue() {
    const random = Math.random();
    let returnedValue = this.probability[0];
    const length = this.probability.length;
    // on peut opti avec un tri dichotoique
    let index = 0;
    while (random > returnedValue.value && index < length) {
      index++;
      returnedValue = this.probability[index];
    }
    return returnedValue;
  }

  private calculateNormalization() {
    let h = 0;
    for (let i = 1; i <= this.catalog.length; i++) {
      // 1/i^s
      h += 1 / i ** this.zipf_parameter;
    }
    return h;
  }
}

export { VideoAsset, VideoChunk, Catalog };

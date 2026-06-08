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
    // console.log("Spliting du film:", this.title);
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
  zipf_parameter: number = 0.5;
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
    this.probability = []; // vider à chaque nouveau calcul

    const h = this.calculateNormalization();
    let beforeValue = 0;
    for (let i = 1; i <= this.catalog.length; i++) {
      const value = 1 / i ** this.zipf_parameter / h;
      this.probability.push({
        id: this.catalog[i - 1].id,
        value: value + beforeValue,
      });
      beforeValue += value;
    }
  }

  selectRandomValue() {
    const random = Math.random(); // Valeur aléatoire sélectionnée
    const length = this.probability.length;

    let gauche = 0;
    let droite = length - 1;

    while (gauche != droite) {
      const milieu = Math.floor((gauche + droite) / 2);

      // choix de la gauche ou droite
      if (this.probability[milieu].value < random) {
        gauche = milieu + 1;
      } else {
        droite = milieu;
      }
    }

    return this.probability[gauche];
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

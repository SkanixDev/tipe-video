import matplotlib.pyplot as plt

# Tes données
donnees = [
    54292,
    38414,
    30836,
    26811,
    24198,
    21866,
    20570,
    19070,
    17913,
    16974,
    16218,
    15401,
    14823,
    14643,
    13764,
    13424,
    13053,
    12697,
    12217,
    11887,
    11806,
    11691,
    11239,
    11018,
    10625,
    10543,
    10195,
    10085,
    9892,
    9724,
    9688,
    9384,
    9306,
    9239,
    9036,
    8992,
    8753,
    8524,
    8545,
    8627,
    8304,
    8375,
    8101,
    8029,
    7997,
    7895,
    7840,
    7792,
    7502,
    7527,
    7652,
    7531,
    7532,
    7205,
    7237,
    7015,
    7352,
    7159,
    6932,
    6973,
    6852,
    6823,
    6852,
    6723,
    6710,
    6637,
    6497,
    6614,
    6514,
    6218,
    6357,
    6448,
    6291,
    6137,
    6382,
    6120,
    6067,
    6056,
    6112,
    6061,
    5962,
    6013,
    5962,
    5901,
    5837,
    5752,
    5859,
    5749,
    5717,
    5679,
    5610,
    5718,
    5635,
    5603,
    5586,
    5453,
    5531,
    5305,
    5442,
    5282,
]
# Création des indices pour l'axe X (de 1 à 99)
indices = range(1, len(donnees) + 1)

# Définition de la taille de la fenêtre (large pour voir tous les éléments)
plt.figure(figsize=(14, 6))

# Génération du graphique en barres
# 'royalblue' donne un bleu propre, et 'edgecolor' sépare bien les barres
plt.bar(indices, donnees, color="royalblue", edgecolor="black", linewidth=0.5)

# Personnalisation des axes et du titre
plt.title(
    "Répartition d'un contenu selon la loi de Zipf (k=0.7)",
    fontsize=14,
    fontweight="bold",
    pad=15,
)
plt.xlabel("Liste de 100 contenus vidéos", fontsize=12)
plt.ylabel("Nombre d'apparition", fontsize=12)

# Ajout d'une grille horizontale en arrière-plan pour mieux lire les grands nombres
plt.grid(axis="y", linestyle="--", alpha=0.7)

# Ajustement automatique des marges pour éviter les coupures
plt.tight_layout()

# Affichage du rendu
plt.show()

import matplotlib.pyplot as plt
import pandas as pd

# 1. Chargement des données (pense à renommer ton fichier si nécessaire)
df = pd.read_csv("../data/test_best_iteration.csv", sep=";")

# Nettoyage des espaces cachés dans les noms de colonnes
df.columns = df.columns.str.strip()

# 2. Groupe par niveau d'itération pour calculer la moyenne et l'écart-type
grouped = df.groupby("iteration")

# On extrait les valeurs des abscisses (les itérations étudiées)
iterations = sorted(df["iteration"].unique())

# Calcul des moyennes et écarts-types pour le Hit Rate et l'Overhead
hit_rate_mean = grouped["Hit rate"].mean()
hit_rate_std = grouped["Hit rate"].std()

ratio_mean = grouped["Ratio OriginUser"].mean()
ratio_std = grouped["Ratio OriginUser"].std()

# 3. Création du graphique (Évolution du Hit Rate)
plt.figure(figsize=(10, 5))
# On utilise une échelle logarithmique en X car tes itérations vont de 100 à 1M
plt.xscale("log")

# plt.errorbar trace la ligne moyenne ET les barres d'incertitude (yerr)
plt.errorbar(
    iterations,
    hit_rate_mean,
    yerr=hit_rate_std,
    fmt="-o",
    color="blue",
    capsize=5,
    label="Hit Rate Moyen",
)

plt.title("Stabilité du Hit Rate en fonction des itérations")
plt.xlabel("Nombre d'itérations de la simulation (Échelle log)")
plt.ylabel("Hit Rate Global")
plt.grid(True, which="both", ls="--")
plt.legend()
plt.savefig("convergence_hit_rate.png")
plt.show()

# 4. Même chose pour le Ratio OriginUser
plt.figure(figsize=(10, 5))
plt.xscale("log")
plt.errorbar(
    iterations,
    ratio_mean,
    yerr=ratio_std,
    fmt="-s",
    color="red",
    capsize=5,
    label="Overhead Réseau (Origin/User)",
)
plt.title("Étude de convergence : Amortissement de l'Overhead de Prefetching")
plt.xlabel("Nombre d'itérations de la simulation (Échelle log)")
plt.ylabel("Ratio d'octets (%)")
plt.grid(True, which="both", ls="--")
plt.legend()
plt.savefig("convergence_overhead.png")
plt.show()

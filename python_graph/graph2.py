import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

# 1. Chargement et nettoyage des données
df = pd.read_csv("../export_data.csv")
df.columns = df.columns.str.strip()  # Supprime les espaces cachés dans les en-têtes

# On filtre pour ne garder que le régime permanent stable (1 000 000 d'itérations)
df_stable = df[df["itération"] == 1000000]

# On calcule la moyenne des 6 seeds pour chaque configuration unique
df_mean = (
    df_stable.groupby(["Technologie", "Capacité", "Nombre de Fogs"])
    .mean()
    .reset_index()
)

# Configuration du style des graphiques
sns.set_theme(style="whitegrid")
plt.rcParams.update({"font.size": 12, "axes.labelsize": 14, "axes.titlesize": 16})

# ==========================================
# GRAPHIQUE 1 : LATENCE EN FONCTION DU CACHE
# ==========================================
# On isole une topologie fixe (ex: 2 Fogs) pour voir l'impact de la mémoire
df_cache = df_mean[df_mean["Nombre de Fogs"] == 2]

plt.figure(figsize=(10, 6))
for tech in df_cache["Technologie"].unique():
    data_tech = df_cache[df_cache["Technologie"] == tech]
    # On convertit la capacité en Mo pour l'affichage
    x_mo = data_tech["Capacité"] / 1_000_000

    # On trace la latence P90 (représentative des ralentissements légers)
    plt.plot(
        x_mo,
        data_tech["Latence_P90"],
        marker="o",
        linewidth=2,
        label=f"{tech} (Percentile P90)",
    )
    # On trace la latence P50 (médiane)
    plt.plot(
        x_mo,
        data_tech["Latence_P50"],
        marker="s",
        linestyle="--",
        linewidth=2,
        label=f"{tech} (Médiane P50)",
    )

plt.title("Impact de la capacité du cache sur le temps de latence")
plt.xlabel("Capacité du stockage Fog (En Mo)")
plt.ylabel("Latence perçue par l'utilisateur (ms)")
plt.legend()
plt.tight_layout()
plt.savefig("analyse_capacite_latence.png", dpi=300)
plt.show()

# ==========================================
# GRAPHIQUE 2 : HIT RATE EN FONCTION DU NOMBRE DE FOGS
# ==========================================
# On isole une capacité fixe (ex: 300 Mo) pour voir l'impact de la topologie
df_topo = df_mean[df_mean["Capacité"] == 300000000]

plt.figure(figsize=(10, 6))
for tech in df_topo["Technologie"].unique():
    data_tech = df_topo[df_topo["Technologie"] == tech]
    plt.plot(
        data_tech["Nombre de Fogs"],
        data_tech["Hit rate"] * 100,
        marker="^",
        linewidth=2,
        label=tech,
    )

plt.title(
    "Efficacité algorithmique en fonction de la granularité de la topologie (Cache : 300 Mo)"
)
plt.xlabel("Nombre de nœuds Fog distribués")
plt.ylabel("Taux de succès du Cache (Hit Rate %)")
plt.legend()
plt.tight_layout()
plt.savefig("analyse_topologie_hitrate.png", dpi=300)
plt.show()

# ==========================================
# GRAPHIQUE 3 : LE COÛT DE LA PROACTIVITÉ (OVERHEAD)
# ==========================================
plt.figure(figsize=(10, 6))
for tech in df_cache["Technologie"].unique():
    data_tech = df_cache[df_cache["Technologie"] == tech]
    x_mo = data_tech["Capacité"] / 1_000_000
    plt.plot(x_mo, data_tech["Ratio OriginUser"], marker="d", linewidth=2, label=tech)

plt.axhline(y=100, color="r", linestyle=":", label="Seuil de neutralité réseau (100%)")
plt.title("Évaluation du compromis : Coût de bande passante injecté à l'Origine")
plt.xlabel("Capacité du stockage Fog (En Mo)")
plt.ylabel("Ratio d'octets Origine / Consommation Client (%)")
plt.legend()
plt.tight_layout()
plt.savefig("analyse_compromis_overhead.png", dpi=300)
plt.show()

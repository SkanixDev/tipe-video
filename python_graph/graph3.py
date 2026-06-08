import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

# 1. Chargement et nettoyage des données
df = pd.read_csv("../export_data.csv")
df.columns = df.columns.str.strip()  # Supprime les espaces (" Hit rate" -> "Hit rate")

# 2. Agrégation : on calcule la moyenne des 5 graines (seeds) pour chaque configuration
df_mean = (
    df.groupby(["Technologie", "Capacité", "zipf_parameter", "Nombre de Fogs"])
    .mean()
    .reset_index()
)

# Configuration du style scientifique
sns.set_theme(style="whitegrid")
plt.rcParams.update({"font.size": 12, "axes.labelsize": 13, "axes.titlesize": 14})

# =====================================================================
# GRAPHIQUE 1 : HIT RATE vs ZIPF_PARAMETER (Topologie: 5 Fogs, Cache: 150Mo)
# =====================================================================
plt.figure(figsize=(9, 5.5))
g1_data = df_mean[(df_mean["Nombre de Fogs"] == 5) & (df_mean["Capacité"] == 150000000)]
for tech in ["LRU", "Prefetching"]:
    data = g1_data[g1_data["Technologie"] == tech].sort_values("zipf_parameter")
    plt.plot(
        data["zipf_parameter"],
        data["Hit rate"] * 100,
        marker="o",
        linewidth=2.5,
        label=f"Stratégie {tech}",
    )
plt.title("Efficacité algorithmique face à la structure de la demande")
plt.xlabel("Paramètre de la Loi de Zipf")
plt.ylabel("Taux de succès global du Cache (Hit Rate %)")
plt.legend()
plt.tight_layout()
plt.savefig("g1_zipf_hitrate.png", dpi=300)
plt.close()

# =====================================================================
# GRAPHIQUE 2 : OVERHEAD vs ZIPF_PARAMETER (Topologie: 5 Fogs, Cache: 150Mo)
# =====================================================================
plt.figure(figsize=(9, 5.5))
for tech in ["LRU", "Prefetching"]:
    data = g1_data[g1_data["Technologie"] == tech].sort_values("zipf_parameter")
    plt.plot(
        data["zipf_parameter"],
        data["Ratio OriginUser"],
        marker="s",
        linewidth=2.5,
        label=f"Stratégie {tech}",
    )
plt.axhline(
    y=100, color="red", linestyle="--", alpha=0.7, label="Seuil de neutralité (100%)"
)
plt.title("Compromis infrastructure : Évolution de l'Overhead réseau")
plt.xlabel("Paramètre de concentration s (Loi de Zipf)")
plt.ylabel("Ratio d'octets transmis (Origine / Consommation Client %)")
plt.legend()
plt.tight_layout()
plt.savefig("g2_zipf_overhead.png", dpi=300)
plt.close()

# =====================================================================
# GRAPHIQUE 3 : LATENCE vs CAPACITÉ (Topologie: 5 Fogs, Zipf: 1.0)
# =====================================================================
plt.figure(figsize=(9, 5.5))
g3_data = df_mean[(df_mean["Nombre de Fogs"] == 5) & (df_mean["zipf_parameter"] == 1.0)]
for tech in ["LRU", "Prefetching"]:
    data = g3_data[g3_data["Technologie"] == tech].sort_values("Capacité")
    # Conversion de la capacité en Mo pour l'abscisse
    capacite_mo = data["Capacité"] / 1_000_000
    plt.plot(
        capacite_mo,
        data["Latence_P50"],
        marker="^",
        linewidth=2.5,
        label=f"{tech} (Médiane P50)",
    )
plt.title("Impact du stockage local sur la Qualité d'Expérience (QoE)")
plt.xlabel("Capacité mémoire allouée au nœud Fog (En Mo)")
plt.ylabel("Temps d'attente utilisateur (ms)")
plt.legend()
plt.tight_layout()
plt.savefig("g3_capacite_latence.png", dpi=300)
plt.close()

# =====================================================================
# GRAPHIQUE 4 : DILUTION SPATIALE (Prefetching, Cache: 150Mo)
# =====================================================================
plt.figure(figsize=(9, 5.5))
g4_data = df_mean[
    (df_mean["Technologie"] == "Prefetching") & (df_mean["Capacité"] == 150000000)
]
for zipf_val in [0.1, 2.0, 5.0]:
    data = g4_data[g4_data["zipf_parameter"] == zipf_val].sort_values("Nombre de Fogs")
    plt.plot(
        data["Nombre de Fogs"],
        data["Hit rate"] * 100,
        marker="d",
        linewidth=2,
        label=f"Zipf s = {zipf_val}",
    )
plt.title("Mise à l'échelle topologique : Le phénomène de dilution spatiale")
plt.xlabel("Nombre de nœuds Fog distribués (Granularité du réseau)")
plt.ylabel("Hit Rate Global du Prefetching (%)")
plt.legend()
plt.tight_layout()
plt.savefig("g4_topologie_dilution.png", dpi=300)
plt.close()

print("Graphiques générés avec succès !")

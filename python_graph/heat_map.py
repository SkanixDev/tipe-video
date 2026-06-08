import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

# Chargement
df = pd.read_csv("../export_data.csv")
df.columns = df.columns.str.strip()

# Moyenne des runs
df_mean = (
    df.groupby(["Technologie", "Capacité", "zipf_parameter", "Nombre de Fogs"])
    .mean()
    .reset_index()
)

sns.set_theme(style="whitegrid")

# =====================================================================
# GRAPH AVANCÉ 1 : INTERACTION TOPOLOGIE x ZIPF (L'inversion des pentes)
# =====================================================================
plt.figure(figsize=(10, 6))
df_pref = df_mean[
    (df_mean["Technologie"] == "Prefetching") & (df_mean["Capacité"] == 150000000)
]

# On trace pour deux extrêmes de comportement humain
for z_val, color, style in [(0.1, "blue", "-o"), (5.0, "red", "-s")]:
    data = df_pref[df_pref["zipf_parameter"] == z_val].sort_values("Nombre de Fogs")
    plt.plot(
        data["Nombre de Fogs"],
        data["Hit rate"] * 100,
        style,
        color=color,
        linewidth=2.5,
        label=f"Demande Uniforme (s={z_val})"
        if z_val == 0.1
        else f"Demande Hyper-Concentrée (s={z_val})",
    )

plt.title(
    "Couplage Structurel : Inversion de l'impact topologique selon le comportement utilisateur",
    pad=15,
)
plt.xlabel("Nombre de nœuds Fog distribués")
plt.ylabel("Taux de succès du Prefetching (Hit Rate %)")
plt.legend(frameon=True)
plt.tight_layout()
plt.savefig("analyse_avancee_couplage.png", dpi=300)
plt.show()


# =====================================================================
# GRAPH AVANCÉ 2 : HEATMAP DE L'ESPACE DES PHASES (Pour Zipf = 1.0)
# =====================================================================
plt.figure(figsize=(10, 7))
# On filtre pour le Prefetching et un Zipf classique de 1.0
df_heatmap_src = df_mean[
    (df_mean["Technologie"] == "Prefetching") & (df_mean["zipf_parameter"] == 1.0)
]

# On convertit la capacité en Mo pour l'affichage des axes
df_heatmap_src["Capacité (Mo)"] = df_heatmap_src["Capacité"] / 1_000_000

# On pivote les données pour créer une matrice (Lignes = Fogs, Colonnes = Capacité)
pivot_table = df_heatmap_src.pivot(
    index="Nombre de Fogs", columns="Capacité (Mo)", values="Hit rate"
)
# On multiplie par 100 pour l'avoir en pourcentage
pivot_table = pivot_table * 100

# Tracé de la carte de chaleur
sns.heatmap(
    pivot_table, cmap="YlGnBu", annot=False, cbar_kws={"label": "Hit Rate Global (%)"}
)
plt.title(
    "Espace des Phases du Réseau : Cartographie de l'efficacité algorithmique (Zipf s=1.0)",
    pad=15,
)
plt.gca().invert_yaxis()  # Pour avoir 1 Fog en bas et 50 Fogs en haut
plt.tight_layout()
plt.savefig("analyse_avancee_heatmap.png", dpi=300)
plt.show()

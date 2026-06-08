import matplotlib.pyplot as plt
import numpy as np

# --- PARAMÈTRES DE LA SIMULATION ---
lambda_param = 0.01  # Taux moyen d'arrivée (0.01 utilisateur/seconde)
nb_utilisateurs = 20  # Nombre d'utilisateurs à simuler

# 1. Génération des variables Uniformes U ~ U[0,1]
np.random.seed(42)  # Pour fixer la simulation
U = np.random.uniform(0, 1, nb_utilisateurs)

# 2. Transformation en temps d'inter-arrivées (Loi Exponentielle)
T = -np.log(U) / lambda_param

# 3. Calcul des instants d'arrivée cumulés (Somme cumulée)
instants_arrivee = np.cumsum(T)
# On ajoute l'origine (0 utilisateur à t=0)
temps = np.insert(instants_arrivee, 0, 0.0)
nb_clients_cumules = np.arange(0, nb_utilisateurs + 1)

# --- TRACÉ DU GRAPHIPH UNIQUE DU PROCESSUS DE POISSON ---
plt.figure(figsize=(10, 6))

# Tracé en escalier (step) : montre le nombre d'utilisateurs au cours du temps
plt.step(
    temps,
    nb_clients_cumules,
    where="post",
    color="blue",
    linewidth=2,
    label="Nombre d'utilisateurs $N(t)$",
)

# Ajout de repères visuels pour matérialiser les instants d'arrivée
plt.vlines(
    instants_arrivee,
    ymin=0,
    ymax=nb_clients_cumules[:-1],
    color="red",
    linestyle=":",
    alpha=0.6,
)
plt.scatter(
    instants_arrivee,
    nb_clients_cumules[1:],
    color="red",
    zorder=5,
    label="Instants d'arrivée ($t_n$)",
)

# Personnalisation graphique
plt.title(
    "Modélisation de l'arrivée des utilisateurs (Processus de Poisson)",
    fontsize=13,
    fontweight="bold",
)
plt.xlabel("Axe du Temps ($t$ en ms)", fontsize=11)
plt.ylabel("Nombre total d'utilisateurs arrivés", fontsize=11)
plt.xlim(0, max(temps) * 1.05)
plt.ylim(0, nb_utilisateurs + 1)
plt.grid(True, linestyle="--", alpha=0.5)
plt.legend(loc="upper left")

# Exemple de validation empirique pour le rapport écrit :
moyenne_empirique = np.mean(T)
print(f"Espérance théorique (1/lambda) : {1 / lambda_param} secondes")
print(f"Moyenne empirique simulée      : {moyenne_empirique:.2f} secondes")

plt.tight_layout()
plt.show()

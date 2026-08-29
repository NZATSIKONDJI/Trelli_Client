import { appelerApi } from "./api.js";

const selectionner = selecteur => document.querySelector(selecteur);
const etat = { utilisateur: null, projets: [], projetSelectionne: null, onglet: "taches" };
const libellesStatut = { a_faire: "À faire", en_cours: "En cours", terminee: "Terminées" };
const libellesStatutProjet = { planifie: "Planifié", en_cours: "En cours", en_pause: "En pause", termine: "Terminé" };
const estAdministrateur = () => etat.projetSelectionne?.role_courant === "administrateur";

/*Ici on importe la fonction d’appel à l’API, initialise l’état général de l’application,
définit les libellés français des statuts et fournit des fonctions utilitaires
pour sélectionner un élément, vérifier le rôle administrateur et afficher
temporairement un message d’alerte.*/

function afficherAlerte(message) {
  const boite = document.createElement("div");
  boite.className = "alert";
  boite.textContent = message;
  selectionner("#alertes").replaceChildren(boite);
  setTimeout(() => boite.remove(), 5000);
}
/*Ici on met à jour l’interface selon l’état de connexion : affiche l’application et
les informations de session lorsqu’un utilisateur est connecté, ou affiche
le formulaire de connexion et vide ses champs après une déconnexion.*/

function definirSession(utilisateur) {
  etat.utilisateur = utilisateur;
  document.body.classList.toggle("connecte", Boolean(utilisateur));
  selectionner("#vue-connexion").hidden = Boolean(utilisateur);
  selectionner("#vue-application").hidden = !utilisateur;
  selectionner(".topbar").hidden = !utilisateur;
  selectionner("#session").hidden = !utilisateur;
  selectionner("#nom-utilisateur").textContent = utilisateur?.nom_affiche ?? "";
  if (!utilisateur) {
    const formulaire = selectionner("#formulaire-connexion");
    formulaire.reset();
    for (const champ of formulaire.elements) {
      if (champ instanceof HTMLInputElement) champ.value = "";
    }
    setTimeout(() => {
      for (const champ of formulaire.elements) {
        if (champ instanceof HTMLInputElement) champ.value = "";
      }
    }, 100);
  }
}

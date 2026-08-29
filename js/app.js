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

/*Ici on charge depuis l’API les projets accessibles à l’utilisateur, sélectionne le
projet demandé ou le premier disponible, puis actualise leur liste et les
informations détaillées du projet sélectionné.*/

async function chargerProjets(idSouhaite) {
  etat.projets = await appelerApi("/projets");
  etat.projetSelectionne = etat.projets.find(projet => projet.id === idSouhaite) ?? etat.projets[0] ?? null;
  afficherProjets();
  afficherDetailProjet();
}

/*Ici on affiche la liste des projets avec leur titre, leur statut, le nombre de tâches
et le rôle de l’utilisateur. Lorsqu’un projet est sélectionné, actualise la
liste et affiche ses tâches et ses informations détaillées.*/

function afficherProjets() {
  const liste = selectionner("#liste-projets");
  liste.replaceChildren();
  if (!etat.projets.length) {
    const vide = document.createElement("p");
    vide.className = "muted";
    vide.textContent = "Aucun projet.";
    liste.append(vide);
    return;
  }
  for (const projet of etat.projets) {
    const boutonProjet = document.createElement("button");
    boutonProjet.type = "button";
    boutonProjet.className = `project-item statut-projet-${projet.statut}${projet.id === etat.projetSelectionne?.id ? " active" : ""}`;
    const titre = document.createElement("strong");
    titre.textContent = projet.titre;
    const resume = document.createElement("span");
    resume.textContent = `${projet.taches.length} tâche(s) · ${projet.role_courant}`;
    const statut = document.createElement("span");
    statut.className = `project-status project-status-${projet.statut}`;
    statut.textContent = libellesStatutProjet[projet.statut];
    boutonProjet.append(titre, statut, resume);
    boutonProjet.addEventListener("click", () => {
      etat.projetSelectionne = projet;
      etat.onglet = "taches";
      afficherProjets();
      afficherDetailProjet();
    });
    liste.append(boutonProjet);
  }
}


/*Ici on crée et renvoie un bouton avec un texte, une classe CSS et une action 
à exécuter lors du clic, afin d’éviter de répéter le même code.*/

function creerBouton(libelle, classe, action) {
  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.className = `button ${classe}`;
  bouton.textContent = libelle;
  bouton.addEventListener("click", action);
  return bouton;
}

/*Ici on crée l’avatar d’un membre à partir de sa photo. Si la photo est absente ou
ne se charge pas, affiche automatiquement les initiales de son nom.*/

function creerAvatar(personne, taille = "normal") {
  const avatar = document.createElement("span");
  avatar.className = `avatar avatar-${taille}`;
  avatar.textContent = personne.nom_affiche.split(/\s+/).slice(0, 2).map(mot => mot[0]).join("").toUpperCase();
  avatar.title = personne.nom_affiche;
  if (personne.photo) {
    const image = document.createElement("img");
    image.src = personne.photo;
    image.alt = `Photo de ${personne.nom_affiche}`;
    image.addEventListener("load", () => avatar.replaceChildren(image));
  }
  return avatar;
}
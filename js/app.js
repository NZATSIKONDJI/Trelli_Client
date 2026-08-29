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

/*Ici on affiche les informations et les actions du projet sélectionné selon les droits
de l’utilisateur, construit les onglets autorisés, puis affiche soit les tâches,
soit la gestion de l’équipe. Si aucun projet n’existe, affiche un message vide.*/

function afficherDetailProjet() {
  const detail = selectionner("#detail-projet");
  detail.replaceChildren();
  const projet = etat.projetSelectionne;
  if (!projet) {
    detail.className = "panel empty-state";
    const texte = document.createElement("p");
    texte.textContent = "Créez votre premier projet.";
    detail.append(texte);
    return;
  }
  detail.className = "panel";
  const entete = document.createElement("div");
  entete.className = "detail-heading";
  const informations = document.createElement("div");
  const titre = document.createElement("h2");
  titre.textContent = projet.titre;
  const statutProjet = document.createElement("span");
  statutProjet.className = `project-status project-status-${projet.statut}`;
  statutProjet.textContent = libellesStatutProjet[projet.statut];
  const description = document.createElement("p");
  description.className = "muted";
  description.textContent = projet.description || "Sans description";
  informations.append(titre, statutProjet, description);
  const commandes = document.createElement("div");
  commandes.className = "actions";
  if (estAdministrateur()) commandes.append(creerBouton("Modifier", "ghost", () => ouvrirProjet(projet)));
  if (projet.proprietaire_id === etat.utilisateur.id) commandes.append(creerBouton("Supprimer", "danger", supprimerProjet));
  entete.append(informations, commandes);
  detail.append(entete);

  const onglets = document.createElement("div");
  onglets.className = "tabs";
  const ongletsDisponibles = estAdministrateur()
    ? [["taches", "Tâches"], ["equipe", "Équipe et rôles"]]
    : [["taches", "Tâches"]];
  if (!estAdministrateur() && etat.onglet === "equipe") etat.onglet = "taches";
  for (const [valeur, libelle] of ongletsDisponibles) {
    const boutonOnglet = creerBouton(libelle, etat.onglet === valeur ? "primary" : "ghost", () => {
      etat.onglet = valeur;
      afficherDetailProjet();
    });
    onglets.append(boutonOnglet);
  }
  detail.append(onglets);
  if (etat.onglet === "equipe") afficherEquipe(detail, projet);
  else afficherTaches(detail, projet);
}

/*Ici on affiche les membres du projet avec leur identité, leur avatar et leur rôle.
Le propriétaire peut modifier les rôles sauf le sien, tandis que les
administrateurs peuvent ajouter de nouveaux participants au projet.*/

function afficherEquipe(conteneur, projet) {
  const estProprietaire = projet.proprietaire_id === etat.utilisateur.id;
  const explication = document.createElement("p");
  explication.className = "muted";
  explication.textContent = estProprietaire
    ? "Vous êtes le propriétaire : vous seul pouvez attribuer ou retirer le rôle administrateur."
    : estAdministrateur()
      ? "Vous êtes administrateur délégué : vous gérez le projet et les tâches, mais seul le propriétaire peut modifier les rôles."
    : "Vous pouvez consulter l’équipe et les rôles. Seul le propriétaire peut modifier les rôles.";
  conteneur.append(explication);
  const liste = document.createElement("div");
  liste.className = "role-list";
  for (const personne of projet.participants) {
    const ligne = document.createElement("div");
    ligne.className = "role-row";
    const identite = document.createElement("div");
    identite.className = "member-identity";
    const textes = document.createElement("span");
    const nom = document.createElement("strong");
    nom.textContent = personne.nom_affiche;
    const courrielMembre = document.createElement("small");
    courrielMembre.textContent = personne.courriel;
    textes.append(nom, courrielMembre);
    identite.append(creerAvatar(personne), textes);
    const role = document.createElement("select");
    role.append(new Option("Administrateur", "administrateur"), new Option("Participant", "participant"));
    role.value = personne.role;
    role.disabled = !estProprietaire || personne.id === projet.proprietaire_id;
    role.setAttribute("aria-label", `Rôle de ${personne.nom_affiche}`);
    role.addEventListener("change", async () => {
      try {
        await appelerApi(`/projets/${projet.id}/participants/${personne.id}/role`, {
          method: "PUT", body: JSON.stringify({ role: role.value }),
        });
        await chargerProjets(projet.id);
        etat.onglet = "equipe";
        afficherDetailProjet();
      } catch (erreur) {
        afficherAlerte(erreur.message);
        role.value = personne.role;
      }
    });
    ligne.append(identite, role);
    liste.append(ligne);
  }
  conteneur.append(liste);
  if (estAdministrateur()) {
    const formulaire = document.createElement("form");
    formulaire.className = "add-participant";
    const courriel = document.createElement("input");
    courriel.type = "email";
    courriel.placeholder = "participant@mentor-ac.fr";
    courriel.required = true;
    courriel.maxLength = 254;
    const ajouter = creerBouton("Ajouter", "ghost", () => {});
    ajouter.type = "submit";
    formulaire.append(courriel, ajouter);
    formulaire.addEventListener("submit", async evenement => {
      evenement.preventDefault();
      try {
        await appelerApi(`/projets/${projet.id}/participants`, { method: "POST", body: JSON.stringify({ courriel: courriel.value }) });
        await chargerProjets(projet.id);
        etat.onglet = "equipe";
        afficherDetailProjet();
      } catch (erreur) { afficherAlerte(erreur.message); }
    });
    conteneur.append(formulaire);
  }
}

/*Ici on affiche la zone des tâches avec le bouton de création, construit une colonne
pour chaque statut et place chaque tâche dans la colonne correspondante.*/

function afficherTaches(conteneur, projet) {
  const barre = document.createElement("div");
  barre.className = "toolbar";
  const titre = document.createElement("h3");
  titre.textContent = "Tâches";
  barre.append(titre);
  barre.append(creerBouton("Nouvelle tâche", "primary", () => ouvrirTache()));
  conteneur.append(barre);
  const grille = document.createElement("div");
  grille.className = "task-grid";
  for (const statut of Object.keys(libellesStatut)) {
    const colonne = document.createElement("section");
    colonne.className = `task-column task-column-${statut}`;
    const nomColonne = document.createElement("strong");
    nomColonne.textContent = libellesStatut[statut];
    colonne.append(nomColonne);
    for (const tache of projet.taches.filter(element => element.statut === statut)) {
      colonne.append(creerCarteTache(tache, projet));
    }
    grille.append(colonne);
  }
  conteneur.append(grille);
}

/*Ici on crée la carte visuelle d’une tâche avec son titre, sa description et son
responsable. Si l’utilisateur est administrateur, responsable ou créateur,
ajoute les commandes permettant de changer le statut, modifier ou supprimer
la tâche.*/

function creerCarteTache(tache, projet) {
  const carte = document.createElement("article");
  carte.className = "task-card";
  const titre = document.createElement("strong");
  titre.textContent = tache.titre;
  const description = document.createElement("p");
  description.textContent = tache.description || "Sans description";
  const responsable = document.createElement("div");
  responsable.className = "task-assignee";
  if (tache.responsable) {
    responsable.append(creerAvatar(tache.responsable, "petit"));
    const nomResponsable = document.createElement("small");
    nomResponsable.textContent = tache.responsable.nom_affiche;
    responsable.append(nomResponsable);
  } else {
    const nonAssignee = document.createElement("small");
    nonAssignee.textContent = "Non assignée";
    responsable.append(nonAssignee);
  }
  carte.append(titre, description, responsable);
  const commandes = document.createElement("div");
  commandes.className = "actions";
  const peutAdministrerTache = estAdministrateur()
    || tache.responsable_id === etat.utilisateur.id
    || tache.createur_id === etat.utilisateur.id;
  if (peutAdministrerTache) {
    const statut = document.createElement("select");
    statut.setAttribute("aria-label", `Statut de ${tache.titre}`);
    for (const [valeur, libelle] of Object.entries(libellesStatut)) statut.add(new Option(libelle, valeur));
    statut.value = tache.statut;
    statut.addEventListener("change", async () => {
      try {
        await appelerApi(`/projets/${projet.id}/taches/${tache.id}/statut`, { method: "PATCH", body: JSON.stringify({ statut: statut.value }) });
        await chargerProjets(projet.id);
      } catch (erreur) { afficherAlerte(erreur.message); statut.value = tache.statut; }
    });
    commandes.append(
      statut,
      creerBouton("Modifier", "ghost", () => ouvrirTache(tache)),
      creerBouton("Supprimer", "danger", () => supprimerTache(tache.id)),
    );
  }
  if (commandes.childElementCount) carte.append(commandes);
  return carte;
}

/*Ici on ouvre la fenêtre de création ou de modification d’un projet, réinitialise le
formulaire et le préremplit avec les informations du projet lorsqu’il existe.*/

function ouvrirProjet(projet = null) {
  const formulaire = selectionner("#formulaire-projet");
  formulaire.reset();
  formulaire.elements.id.value = projet?.id ?? "";
  formulaire.elements.titre.value = projet?.titre ?? "";
  formulaire.elements.description.value = projet?.description ?? "";
  formulaire.elements.statut.value = projet?.statut ?? "en_cours";
  selectionner("#titre-dialogue-projet").textContent = projet ? "Modifier le projet" : "Nouveau projet";
  selectionner("#dialogue-projet").showModal();
}

/*Ici on ouvre la fenêtre de création ou de modification d’une tâche, initialise ses
champs, remplit la liste des responsables avec les participants du projet
et sélectionne le responsable actuel lorsque la tâche existe déjà.*/

function ouvrirTache(tache = null) {
  const formulaire = selectionner("#formulaire-tache");
  formulaire.reset();
  formulaire.elements.id.value = tache?.id ?? "";
  formulaire.elements.titre.value = tache?.titre ?? "";
  formulaire.elements.description.value = tache?.description ?? "";
  formulaire.elements.statut.value = tache?.statut ?? "a_faire";
  const responsables = formulaire.elements.responsable_id;
  responsables.replaceChildren(new Option("Non assignée", ""));
  for (const personne of etat.projetSelectionne.participants) responsables.add(new Option(`${personne.nom_affiche} (${personne.courriel})`, String(personne.id)));
  responsables.value = tache?.responsable_id ? String(tache.responsable_id) : "";
  selectionner("#titre-dialogue-tache").textContent = tache ? "Modifier la tâche" : "Nouvelle tâche";
  selectionner("#dialogue-tache").showModal();
}


/*Ici on demande une confirmation avant de supprimer définitivement le projet
sélectionné et ses tâches, puis actualise la liste des projets. En cas
d’échec, affiche le message d’erreur renvoyé par l’API.*/

async function supprimerProjet() {
  if (!confirm("Supprimer définitivement ce projet et ses tâches ?")) return;
  try { await appelerApi(`/projets/${etat.projetSelectionne.id}`, { method: "DELETE" }); await chargerProjets(); }
  catch (erreur) { afficherAlerte(erreur.message); }
}


/*Ici on demande une confirmation avant de supprimer définitivement la tâche
sélectionnée, puis actualise la liste des projets. En cas
d’échec, affiche le message d’erreur renvoyé par l’API.*/

async function supprimerTache(id) {
  if (!confirm("Supprimer cette tâche ?")) return;
  try { await appelerApi(`/projets/${etat.projetSelectionne.id}/taches/${id}`, { method: "DELETE" }); await chargerProjets(etat.projetSelectionne.id); }
  catch (erreur) { afficherAlerte(erreur.message); }
}

/*Ici on configure les événements de connexion, déconnexion, création et modification
des projets et des tâches, ainsi que la fermeture des fenêtres. Au chargement
de la page, vérifie si une session existe déjà puis affiche l’application ou
le formulaire de connexion.*/

selectionner("#formulaire-connexion").addEventListener("submit", async evenement => {
  evenement.preventDefault();
  try {
    const utilisateur = await appelerApi("/authentification/connexion", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(evenement.currentTarget))) });
    definirSession(utilisateur);
    await chargerProjets();
  } catch (erreur) { afficherAlerte(erreur.message); }
});
selectionner("#deconnexion").addEventListener("click", async () => {
  try { await appelerApi("/authentification/deconnexion", { method: "POST" }); }
  finally { etat.projets = []; etat.projetSelectionne = null; definirSession(null); }
});
selectionner("#nouveau-projet").addEventListener("click", () => ouvrirProjet());
selectionner("#annuler-projet").addEventListener("click", () => selectionner("#dialogue-projet").close());
selectionner("#annuler-tache").addEventListener("click", () => selectionner("#dialogue-tache").close());
selectionner("#formulaire-projet").addEventListener("submit", async evenement => {
  evenement.preventDefault();
  const formulaire = evenement.currentTarget;
  const id = formulaire.elements.id.value;
  const donnees = { titre: formulaire.elements.titre.value, description: formulaire.elements.description.value, statut: formulaire.elements.statut.value };
  try {
    const projet = await appelerApi(id ? `/projets/${id}` : "/projets", { method: id ? "PUT" : "POST", body: JSON.stringify(donnees) });
    selectionner("#dialogue-projet").close();
    await chargerProjets(projet.id);
  } catch (erreur) { afficherAlerte(erreur.message); }
});
selectionner("#formulaire-tache").addEventListener("submit", async evenement => {
  evenement.preventDefault();
  const formulaire = evenement.currentTarget;
  const id = formulaire.elements.id.value;
  const donnees = {
    titre: formulaire.elements.titre.value, description: formulaire.elements.description.value,
    statut: formulaire.elements.statut.value,
    responsable_id: formulaire.elements.responsable_id.value ? Number(formulaire.elements.responsable_id.value) : null,
  };
  try {
    await appelerApi(`/projets/${etat.projetSelectionne.id}/taches${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify(donnees) });
    selectionner("#dialogue-tache").close();
    await chargerProjets(etat.projetSelectionne.id);
  } catch (erreur) { afficherAlerte(erreur.message); }
});

(async () => {
  try { const utilisateur = await appelerApi("/authentification/moi"); definirSession(utilisateur); await chargerProjets(); }
  catch { definirSession(null); }
})();

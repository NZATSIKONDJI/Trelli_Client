const API_URL = "/api";

function lireCookie(nom) {
  return document.cookie.split("; ").find(ligne => ligne.startsWith(`${nom}=`))?.split("=")[1] ?? "";
}
/*Ici on centralise les appels du client vers l’API FastAPI, ajoute automatiquement
les cookies de session et le jeton CSRF, traite les réponses JSON et signaleles erreurs renvoyées par le serveur.*/
export async function appelerApi(chemin, options = {}) {
  const methode = options.method ?? "GET";
  const entetes = { ...(options.headers ?? {}) };
  if (options.body) entetes["Content-Type"] = "application/json";
  if (!["GET", "HEAD"].includes(methode)) entetes["X-CSRF-Token"] = decodeURIComponent(lireCookie("csrf_token"));
  const reponse = await fetch(`${API_URL}${chemin}`, { ...options, method: methode, headers: entetes, credentials: "include" });
  if (reponse.status === 204) return null;
  const donnees = await reponse.json().catch(() => ({ detail: "Réponse serveur invalide" }));
  if (!reponse.ok) throw new Error(typeof donnees.detail === "string" ? donnees.detail : "Données invalides");
  return donnees;
}

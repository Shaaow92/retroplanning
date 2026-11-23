const STATUS_FLOW = ["À faire", "En cours", "Fait"];

// 3 projets exemples E2C sans chevauchement de dates : Bleu, Vert, Jaune
const PROJETS_E2C = [
  {
    id: "visite-entreprise",
    titre: "Visite d'entreprise",
    court: "Visite entreprise",
    debut: 1,
    fin: 7,
    echeance: "15 décembre (action exemple)",
    couleur: "#1d4ed8",
    etapes: [
      { id: "ve-1", dateLimite: "15 décembre", libelle: "Visite de l'entreprise avec le groupe", responsable: "Formateur référent", statut: "À faire" },
      { id: "ve-2", dateLimite: "12 décembre", libelle: "Envoyer aux jeunes l'heure, le lieu et les consignes", responsable: "Chargé d'accompagnement", statut: "En cours" },
      { id: "ve-3", dateLimite: "8 décembre", libelle: "Constituer la liste des participants", responsable: "Formateur référent", statut: "Fait" },
      { id: "ve-4", dateLimite: "1er décembre", libelle: "Confirmer la date avec l'entreprise", responsable: "Chargé relations entreprises", statut: "Fait" },
      { id: "ve-5", dateLimite: "20 novembre", libelle: "Contacter l'entreprise pour proposer la visite", responsable: "Chargé relations entreprises", statut: "Fait" }
    ]
  },
  {
    id: "atelier-job-dating",
    titre: "Atelier / Job dating",
    court: "Job dating",
    debut: 10,
    fin: 15,
    echeance: "15 décembre",
    couleur: "#15803d",
    etapes: [
      { id: "jd-1", dateLimite: "15 décembre", libelle: "Tenir les entretiens flash candidats-recruteurs", responsable: "Équipe insertion", statut: "À faire" },
      { id: "jd-2", dateLimite: "11 décembre", libelle: "Préparer les CV et le pitch de présentation", responsable: "Formateur référent", statut: "En cours" },
      { id: "jd-3", dateLimite: "6 décembre", libelle: "Valider la venue des recruteurs et les créneaux", responsable: "Chargé relations entreprises", statut: "Fait" }
    ]
  },
  {
    id: "rencontre-partenaire",
    titre: "Rencontre avec des partenaires",
    court: "Partenaires",
    debut: 18,
    fin: 23,
    echeance: "22 décembre",
    couleur: "#eab308",
    etapes: [
      { id: "rp-1", dateLimite: "22 décembre", libelle: "Réunion bilan et suites d'accompagnement", responsable: "Direction / Référents", statut: "À faire" },
      { id: "rp-2", dateLimite: "18 décembre", libelle: "Envoyer l'ordre du jour et les fiches stagiaires", responsable: "Chargé d'accompagnement", statut: "À faire" },
      { id: "rp-3", dateLimite: "12 décembre", libelle: "Confirmer la salle et les partenaires présents", responsable: "Chargé relations entreprises", statut: "En cours" }
    ]
  }
];

let projetActifId = PROJETS_E2C[0].id;

function getProjetActif() {
  return PROJETS_E2C.find((p) => p.id === projetActifId) || PROJETS_E2C[0];
}

function choisirProjet(id) {
  projetActifId = id;
  rendreTout();
}

function classeStatut(statut) {
  if (statut === "Fait") return "st-done";
  if (statut === "En cours") return "st-doing";
  return "st-todo";
}

function estJaune(hex) {
  return hex.toLowerCase() === "#eab308";
}

function couleurTexteSurRepere(hex) {
  return estJaune(hex) ? "#1e293b" : "#ffffff";
}

function couleurAccentTexte(hex) {
  return estJaune(hex) ? "#a16207" : hex;
}

function rendreBadgeProjet() {
  const actif = getProjetActif();
  const total = actif.etapes.length;
  const faites = actif.etapes.filter((e) => e.statut === "Fait").length;
  const pct = total ? Math.round((faites / total) * 100) : 0;
  const badge = document.getElementById("globalProgress");
  badge.textContent = `${actif.court} : ${faites}/${total} étapes faites (${pct}%)`;
  badge.style.color = couleurAccentTexte(actif.couleur);
  badge.style.borderColor = actif.couleur;
}

function rendreCalendrier() {
  const actif = getProjetActif();
  const decalage = 1;
  const cases = [];
  for (let i = 0; i < decalage; i++) cases.push(null);
  for (let d = 1; d <= 31; d++) cases.push(d);
  while (cases.length % 7 !== 0) cases.push(null);

  const lignes = [];
  for (let i = 0; i < cases.length; i += 7) {
    const tds = cases.slice(i, i + 7).map((jour) => {
      if (!jour) return `<td class="blank"></td>`;
      const surJour = PROJETS_E2C.filter((p) => jour >= p.debut && jour <= p.fin);
      const dansActif = actif && jour >= actif.debut && jour <= actif.fin;
      const reperes = surJour
        .map((p) => `<button type="button" class="mark" data-pid="${p.id}" style="background:${p.couleur};color:${couleurTexteSurRepere(p.couleur)}">${p.court}</button>`)
        .join("");
      return `<td class="${dansActif ? "active-range" : ""}"><div class="dnum">${jour}</div>${reperes}</td>`;
    });
    lignes.push(`<tr>${tds.join("")}</tr>`);
  }

  const tbody = document.getElementById("calBody");
  tbody.innerHTML = lignes.join("");
  tbody.querySelectorAll(".mark").forEach((btn) => {
    btn.addEventListener("click", () => choisirProjet(btn.dataset.pid));
  });
}

function rendrePanneau() {
  const actif = getProjetActif();
  const tabs = document.getElementById("projectTabs");
  tabs.innerHTML = PROJETS_E2C
    .map((p) => {
      const faites = p.etapes.filter((e) => e.statut === "Fait").length;
      const pctProjet = p.etapes.length ? Math.round((faites / p.etapes.length) * 100) : 0;
      return `<button type="button" class="tab-btn ${p.id === actif.id ? "selected" : ""}" data-pid="${p.id}" style="border-left:4px solid ${p.couleur}"><span>${p.titre}</span><span>${faites}/${p.etapes.length} (${pctProjet}%)</span></button>`;
    })
    .join("");

  tabs.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => choisirProjet(btn.dataset.pid));
  });

  const faitesActif = actif.etapes.filter((e) => e.statut === "Fait").length;
  const pctActif = actif.etapes.length ? Math.round((faitesActif / actif.etapes.length) * 100) : 0;
  const accent = couleurAccentTexte(actif.couleur);

  document.getElementById("detailBox").innerHTML = `
    <h3 style="color:${accent}">${actif.titre}</h3>
    <div class="meta">Repère calendrier : jours ${actif.debut} à ${actif.fin} • Échéance : ${actif.echeance} • ${faitesActif}/${actif.etapes.length} fait (${pctActif}%)</div>
    ${actif.etapes.map((e) => {
      const isDone = e.statut === "Fait";
      return `
      <div class="step">
        <div class="step-left">
          <input type="checkbox" class="step-check" data-eid="${e.id}" ${isDone ? "checked" : ""} aria-label="Marquer l'étape comme faite" />
          <div>
            <div class="step-date" style="color:${accent}">Date limite : ${e.dateLimite}</div>
            <p class="step-text ${isDone ? "is-done" : ""}">${e.libelle}</p>
            <div class="step-who">Responsable : ${e.responsable}</div>
          </div>
        </div>
        <button type="button" class="st ${classeStatut(e.statut)}" data-eid="${e.id}" title="Cliquer pour changer : À faire → En cours → Fait">${e.statut}</button>
      </div>
    `;
    }).join("")}
  `;

  document.querySelectorAll(".step-check").forEach((chk) => {
    chk.addEventListener("change", () => {
      const etape = actif.etapes.find((item) => item.id === chk.dataset.eid);
      if (!etape) return;
      etape.statut = chk.checked ? "Fait" : "À faire";
      rendreTout();
    });
  });

  document.querySelectorAll(".st").forEach((btn) => {
    btn.addEventListener("click", () => {
      const etape = actif.etapes.find((item) => item.id === btn.dataset.eid);
      if (!etape) return;
      etape.statut = STATUS_FLOW[(STATUS_FLOW.indexOf(etape.statut) + 1) % STATUS_FLOW.length];
      rendreTout();
    });
  });
}

function ajouterLigneEtape(dateLimite = "", libelle = "", responsable = "") {
  const container = document.getElementById("stepRowsContainer");
  const row = document.createElement("div");
  row.className = "step-row";
  row.innerHTML = `
    <input type="text" class="sr-date" placeholder="Date limite (ex. 25 déc.)" value="${dateLimite}" required />
    <input type="text" class="sr-title" placeholder="Étape à faire en amont..." value="${libelle}" required />
    <input type="text" class="sr-owner" placeholder="Responsable" value="${responsable}" required />
    <button type="button" class="btn-remove" title="Retirer cette étape">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    if (container.children.length > 1) {
      row.remove();
    }
  });
  container.appendChild(row);
}

function initFormulaireProjet() {
  const container = document.getElementById("stepRowsContainer");
  container.innerHTML = "";
  ajouterLigneEtape("29 décembre", "Action cible / événement", "Formateur référent");
  ajouterLigneEtape("26 décembre", "Envoyer convocations et consignes", "Chargé d'accompagnement");
  ajouterLigneEtape("22 décembre", "Confirmer participants et intervenants", "Chargé relations entreprises");

  document.getElementById("addStepRowBtn").addEventListener("click", () => {
    const ownerDefault = document.getElementById("projOwner").value.trim() || "Formateur référent";
    ajouterLigneEtape("", "", ownerDefault);
  });

  document.getElementById("addProjectForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const titre = document.getElementById("projTitle").value.trim();
    if (!titre) return;

    const debut = Math.max(1, Math.min(31, Number(document.getElementById("projStart").value) || 1));
    const fin = Math.max(debut, Math.min(31, Number(document.getElementById("projEnd").value) || debut));
    const echeance = document.getElementById("projDeadline").value.trim() || `${fin} décembre`;
    const ownerDefault = document.getElementById("projOwner").value.trim() || "Formateur référent";
    const couleur = document.getElementById("projColor").value;

    const rows = [...document.querySelectorAll("#stepRowsContainer .step-row")];
    const etapes = rows.map((r, idx) => {
      const dateLimite = r.querySelector(".sr-date").value.trim() || "À définir";
      const libelle = r.querySelector(".sr-title").value.trim() || "Étape de préparation";
      const responsable = r.querySelector(".sr-owner").value.trim() || ownerDefault;
      return {
        id: `custom-${Date.now()}-${idx}`,
        dateLimite,
        libelle,
        responsable,
        statut: "À faire"
      };
    });

    const nouveauProjet = {
      id: `proj-${Date.now()}`,
      titre,
      court: titre.length > 16 ? `${titre.slice(0, 15)}…` : titre,
      debut,
      fin,
      echeance,
      couleur,
      etapes
    };

    PROJETS_E2C.push(nouveauProjet);
    projetActifId = nouveauProjet.id;
    e.target.reset();
    document.getElementById("projStart").value = Math.min(31, fin + 1);
    document.getElementById("projEnd").value = Math.min(31, fin + 3);
    container.innerHTML = "";
    ajouterLigneEtape("", "", ownerDefault);
    rendreTout();
  });
}

function rendreTout() {
  rendreBadgeProjet();
  rendreCalendrier();
  rendrePanneau();
}

document.addEventListener("DOMContentLoaded", () => {
  initFormulaireProjet();
  rendreTout();
});

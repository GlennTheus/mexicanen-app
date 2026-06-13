/* ========================================================================
   MEXICANEN - script.js
   Fase 3: setup, beurten, scorelogica, ronde-einde
   Fase 4: drinklogica + UI, instelbare huisregels
   Fase 5: bugfixes (Mexicaantje-score, eigen 1/2 laten liggen) + simpele UI
   ======================================================================== */

/* ----- DOM-referenties (overal nodig) ----- */
const setupScherm = document.getElementById("setupScherm");
const aantalSpelersInput = document.getElementById("aantalSpelersInput");
const genereerNamenKnop = document.getElementById("genereerNamenKnop");
const namenContainer = document.getElementById("namenContainer");
const startSpelKnop = document.getElementById("startSpelKnop");

const instellingenKnop = document.getElementById("instellingenKnop");
const instellingenScherm = document.getElementById("instellingenScherm");
const instBasisStraf = document.getElementById("instBasisStraf");
const instMexicaantjeBonus = document.getElementById("instMexicaantjeBonus");
const instLatenLiggen = document.getElementById("instLatenLiggen");
const instHonderdmannetje = document.getElementById("instHonderdmannetje");
const instMaxWorpenVastAan = document.getElementById("instMaxWorpenVastAan");
const instMaxWorpenAantal = document.getElementById("instMaxWorpenAantal");
const instellingenSluitKnop = document.getElementById("instellingenSluitKnop");

const spelScherm = document.getElementById("spelScherm");
const beurtInfo = document.getElementById("beurtInfo");
const dobbel1 = document.getElementById("dobbel1");
const dobbel2 = document.getElementById("dobbel2");
const houdOptiesContainer = document.getElementById("houdOptiesContainer");
const laatsteWorpInfo = document.getElementById("laatsteWorpInfo");
const beurtKnoppen = document.getElementById("beurtKnoppen");
const stopKnop = document.getElementById("stopKnop");
const scorebordKnop = document.getElementById("scorebordKnop");

const meldingBlok = document.getElementById("meldingBlok");
const meldingTekstEl = document.getElementById("meldingTekst");
const meldingOkKnop = document.getElementById("meldingOkKnop");

const overlay31 = document.getElementById("overlay31Blok");
const overlay31Tekst = document.getElementById("overlay31Tekst");
const overlay31Knoppen = document.getElementById("overlay31Knoppen");

const eindBlok = document.getElementById("eindBlok");
const eindVerliezer = document.getElementById("eindVerliezer");
const eindSlokken = document.getElementById("eindSlokken");
const eindMexicaantjes = document.getElementById("eindMexicaantjes");
const nieuweRondeKnop = document.getElementById("nieuweRondeKnop");
const nieuwSpelKnop = document.getElementById("nieuwSpelKnop");

const scorebordOverlay = document.getElementById("scorebordBlok");
const totaalScorebordBody = document.getElementById("totaalScorebordBody");
const scorebordSluitKnop = document.getElementById("scorebordSluitKnop");

/* ----- pips (overgenomen uit Fase 2) ----- */
const pipPatronen = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

// Zet de pips van een dobbelsteen-div op basis van de gegooide waarde
function toonOgen(dobbelEl, waarde) {
  const pips = dobbelEl.querySelectorAll(".pip");
  pips.forEach((pip, i) => {
    pip.classList.toggle("show", pipPatronen[waarde].includes(i + 1));
  });
}

// Maak beide dobbelstenen leeg (geen pips zichtbaar)
function leegDobbelen() {
  document.querySelectorAll(".pip").forEach((p) => p.classList.remove("show"));
}

/* ========================================================================
   INSTELLINGEN / HUISREGELS
   ======================================================================== */
let instellingen = {
  basisStraf: 2,          // standaard: 2 slokken voor de verliezer
  mexicaantjeBonus: 5,     // standaard: +5 slokken per Mexicaantje
  latenLiggenAan: true,    // standaard: aan
  honderdmannetjeAan: true, // standaard: aan
  maxWorpenVast: null,     // null = startspeler kiest 1-3, anders een vast getal
};

// Open het instellingenscherm en vul de invoervelden met de huidige waarden
instellingenKnop.addEventListener("click", () => {
  instBasisStraf.value = instellingen.basisStraf;
  instMexicaantjeBonus.value = instellingen.mexicaantjeBonus;
  instLatenLiggen.checked = instellingen.latenLiggenAan;
  instHonderdmannetje.checked = instellingen.honderdmannetjeAan;
  instMaxWorpenVastAan.checked = instellingen.maxWorpenVast !== null;
  instMaxWorpenAantal.value = instellingen.maxWorpenVast === null ? 2 : instellingen.maxWorpenVast;

  setupScherm.style.display = "none";
  instellingenScherm.style.display = "flex";
});

// Lees de invoervelden, sla ze op in het instellingen-object en ga terug
instellingenSluitKnop.addEventListener("click", () => {
  instellingen.basisStraf = Math.max(0, parseInt(instBasisStraf.value) || 0);
  instellingen.mexicaantjeBonus = Math.max(0, parseInt(instMexicaantjeBonus.value) || 0);
  instellingen.latenLiggenAan = instLatenLiggen.checked;
  instellingen.honderdmannetjeAan = instHonderdmannetje.checked;

  if (instMaxWorpenVastAan.checked) {
    let aantal = parseInt(instMaxWorpenAantal.value);
    if (isNaN(aantal) || aantal < 1) aantal = 1;
    if (aantal > 3) aantal = 3;
    instellingen.maxWorpenVast = aantal;
  } else {
    instellingen.maxWorpenVast = null;
  }

  instellingenScherm.style.display = "none";
  setupScherm.style.display = "flex";
});

/* ========================================================================
   SPEL-STATE
   ======================================================================== */
const MEXICAANTJE_WAARDE = 9999; // interne waarde: altijd hoger dan elke andere score

let spelers = [];              // [{ naam, score, klaar }]
let globaleStats = [];         // [{ rondesVerloren, totaalSlokken, mexicaantjes }] - hele spel
let huidigeSpelerIndex = 0;    // wie is er nu aan de beurt
let startSpelerIndex = 0;      // wie begon deze ronde (bepaalt max. worpen)
let worpTeller = 0;            // aantal worpen van de huidige speler deze beurt
let maxWorpen = null;          // door startspeler gekozen max. (null = nog kiezen)
let mexicaantjesDezeRonde = 0; // teller voor de eindstraf
let honderdmannetjeIndex = null; // index van de speler met "Honderdmannetje"-status
let laatsteWorp = null;        // { d1, d2 } van de laatst afgeronde beurt (voor "laten liggen")
let laatsteGeworpenDitBeurt = null; // { d1, d2 } van de huidige beurt (voor eindigBeurt)
let gehoudenWaarden = { 1: null, 2: null }; // welke dobbelsteen-waarden blijven liggen
let suddenDeath = null;        // { kandidaten, huidige, scores } tijdens gelijkspel

let dobbelKlikbaar = false;    // mogen de dobbelstenen nu aangetikt worden om te gooien?
let aanHetRollen = false;      // staat de tuimel-animatie nu te draaien? (voorkomt dubbel gooien)

// Eén dobbelsteen-worp: willekeurig getal 1-6
function worp() {
  return Math.floor(Math.random() * 6) + 1;
}

// Zet een score om naar leesbare tekst (Mexicaantje intern = 9999, toon "21")
function formatScore(score) {
  return score === MEXICAANTJE_WAARDE ? "21 (Mexicaantje)" : String(score);
}

/* ========================================================================
   SETUP: aantal spelers + namen invoeren
   ======================================================================== */

// Genereer een invoerveld per speler zodra op "Namen invoeren" geklikt wordt
genereerNamenKnop.addEventListener("click", () => {
  let aantal = parseInt(aantalSpelersInput.value);
  if (isNaN(aantal) || aantal < 2) aantal = 2;
  if (aantal > 8) aantal = 8;
  aantalSpelersInput.value = aantal;

  namenContainer.innerHTML = "";
  for (let i = 1; i <= aantal; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Naam speler ${i}`;
    input.className = "spelerNaamInput";
    namenContainer.appendChild(input);
    namenContainer.appendChild(document.createElement("br"));
  }

  startSpelKnop.style.display = "inline-block";
});

// Lees de namen, vul de spelers-array en start het spel
startSpelKnop.addEventListener("click", () => {
  const inputs = document.querySelectorAll(".spelerNaamInput");
  spelers = [];
  inputs.forEach((input, i) => {
    const naam = input.value.trim() || `Speler ${i + 1}`;
    spelers.push({ naam: naam, score: null, klaar: false });
  });

  if (spelers.length < 2) return; // veiligheidscheck

  startNieuwSpel();

  setupScherm.style.display = "none";
  spelScherm.style.display = "flex";

  leegDobbelen();
  laatsteWorpInfo.textContent = "";
  toonBeurtStart();
  renderBeurtInfo();
  checkHoudOpties();
});

// Zet alle spel- en totaalstatistieken op nul (voor een gloednieuw spel)
function startNieuwSpel() {
  globaleStats = spelers.map(() => ({
    rondesVerloren: 0,
    totaalSlokken: 0,
    mexicaantjes: 0,
  }));

  huidigeSpelerIndex = 0;
  startSpelerIndex = 0;
  honderdmannetjeIndex = null;
  startNieuweRondeState();
}

// Zet alle state voor één ronde op nul (gebruikt bij nieuw spel én nieuwe ronde)
function startNieuweRondeState() {
  worpTeller = 0;
  maxWorpen = null;
  mexicaantjesDezeRonde = 0;
  laatsteWorp = null;
  laatsteGeworpenDitBeurt = null;
  gehoudenWaarden = { 1: null, 2: null };
  suddenDeath = null;

  spelers.forEach((s) => {
    s.score = null;
    s.klaar = false;
  });
}

/* ========================================================================
   BEURTENSYSTEEM
   ======================================================================== */

// Werk de tekst boven de dobbelstenen bij: wie is aan de beurt, welke worp.
// Heeft de huidige speler de Honderdmannetje-status, toon dan een badge.
function renderBeurtInfo() {
  const speler = spelers[huidigeSpelerIndex];
  const badge = (huidigeSpelerIndex === honderdmannetjeIndex) ? " 🍺" : "";

  if (suddenDeath) {
    beurtInfo.textContent = `Sudden death! ${speler.naam}${badge}`;
    return;
  }

  if (instellingen.maxWorpenVast !== null) {
    // huisregel: vast aantal worpen voor iedereen
    beurtInfo.textContent =
      `${speler.naam}${badge} — worp ${worpTeller} van ${instellingen.maxWorpenVast}`;
  } else if (maxWorpen === null) {
    // de startspeler heeft nog niet bepaald hoeveel worpen er max. zijn
    beurtInfo.textContent =
      `${speler.naam}${badge} (startspeler) — worp ${worpTeller} (kies max. 3)`;
  } else {
    beurtInfo.textContent =
      `${speler.naam}${badge} — worp ${worpTeller} van ${maxWorpen}`;
  }
}

// Maak de dobbelstenen klikbaar: pulse-gloed aan (geeft aan "tik om te gooien")
function maakDobbelKlikbaar() {
  dobbelKlikbaar = true;
  dobbel1.classList.add("klikbaar");
  dobbel2.classList.add("klikbaar");
}

// Maak de dobbelstenen niet-klikbaar: pulse uit
function maakDobbelOnklikbaar() {
  dobbelKlikbaar = false;
  dobbel1.classList.remove("klikbaar");
  dobbel2.classList.remove("klikbaar");
}

// Beurt-start: dobbelstenen klikbaar voor de eerste worp, nog geen "Stop"
// (je kunt niet stoppen vóór je geldige eerste worp)
function toonBeurtStart() {
  beurtKnoppen.style.display = "none";
  maakDobbelKlikbaar();
}

// Na een worp: "Stop" verschijnt. Zijn er nog worpen over, dan blijven de
// dobbelstenen klikbaar om opnieuw te gooien; anders niet meer.
function toonNaWorp(magNogGooien) {
  beurtKnoppen.style.display = "flex"; // alleen "Stop, volgende speler"
  if (magNogGooien) {
    maakDobbelKlikbaar();
  } else {
    maakDobbelOnklikbaar();
  }
}

// Hoeveel worpen mag de huidige speler maximaal doen?
function maxWorpenVoorHuidigeSpeler() {
  if (instellingen.maxWorpenVast !== null) return instellingen.maxWorpenVast;
  // startspeler mag tot 3 keer gooien zolang hij/zij nog niet gestopt is
  return maxWorpen === null ? 3 : maxWorpen;
}

// Start het 3D-tuimel effect op één dobbelsteen. De eind-rotatie is een
// willekeurig veelvoud van 360° (zodat hij plat eindigt) per as.
function startTuimel(el) {
  const rx = (2 + Math.floor(Math.random() * 2)) * 360; // 720 of 1080 graden
  const ry = (1 + Math.floor(Math.random() * 3)) * 360; // 360, 720 of 1080 graden
  el.style.setProperty("--rx", rx + "deg");
  el.style.setProperty("--ry", ry + "deg");

  // class opnieuw zetten zodat de animatie elke worp opnieuw start
  el.classList.remove("tuimel");
  void el.offsetWidth; // forceer reflow
  el.classList.add("tuimel");
}

// Animeer beide dobbelstenen (3D-tuimel + snel wisselende willekeurige pips),
// toon na 0.6s het eindresultaat en roep dan de callback aan.
function animeerEnToon(eind1, eind2, callback) {
  aanHetRollen = true;
  maakDobbelOnklikbaar(); // tijdens het rollen niet klikbaar

  startTuimel(dobbel1);
  startTuimel(dobbel2);

  // snel wisselende willekeurige waarden tijdens het tuimelen
  const flits = setInterval(() => {
    toonOgen(dobbel1, worp());
    toonOgen(dobbel2, worp());
  }, 80);

  setTimeout(() => {
    clearInterval(flits);
    dobbel1.classList.remove("tuimel");
    dobbel2.classList.remove("tuimel");
    toonOgen(dobbel1, eind1);
    toonOgen(dobbel2, eind2);
    aanHetRollen = false;
    callback();
  }, 600);
}

// Gooi de dobbelstenen (normale beurt). Respecteer eventueel bewaarde waarden.
function rolDobbelstenen() {
  if (aanHetRollen) return; // niet dubbel gooien tijdens de animatie
  if (suddenDeath) {
    suddenDeathGooien();
    return;
  }

  // een bewaarde waarde (van de vorige speler óf de eigen vorige worp)
  // wordt gebruikt indien gezet, anders een nieuwe willekeurige worp.
  // vers1/vers2 onthouden of dit een ECHTE nieuwe worp is (voor de
  // "dobbelsteen bewaren"-optie: een gehouden waarde mag niet opnieuw
  // bewaard worden, alsof hij net gegooid was)
  const vers1 = gehoudenWaarden[1] === null;
  const vers2 = gehoudenWaarden[2] === null;
  const d1 = vers1 ? worp() : gehoudenWaarden[1];
  const d2 = vers2 ? worp() : gehoudenWaarden[2];

  gehoudenWaarden = { 1: null, 2: null };
  houdOptiesContainer.innerHTML = "";

  animeerEnToon(d1, d2, () => verwerkWorp(d1, d2, vers1, vers2));
}

// Klik op een dobbelsteen = gooien. Geldt voor elke worp van de beurt
// (eerste én volgende). Werkt alleen als de dobbelstenen klikbaar zijn.
function probeerGooien() {
  if (!dobbelKlikbaar || aanHetRollen) return;
  rolDobbelstenen();
}
dobbel1.addEventListener("click", probeerGooien);
dobbel2.addEventListener("click", probeerGooien);

// "Stop, volgende speler": beurt direct beëindigen.
// Naast "click" ook "touchend" zodat mobiel zeker reageert. preventDefault op
// touchend onderdrukt de daarna gesynthetiseerde click, zodat eindigBeurt()
// maar één keer draait (anders zou er een speler overgeslagen worden).
function stopBeurtHandler(e) {
  if (e.type === "touchend") e.preventDefault();
  eindigBeurt();
}
stopKnop.addEventListener("click", stopBeurtHandler);
stopKnop.addEventListener("touchend", stopBeurtHandler);

// Ronde de huidige beurt af en geef de beurt door aan de volgende speler
function eindigBeurt() {
  // de startspeler legt met zijn/haar keuze het maximum vast voor iedereen
  // (alleen relevant als er geen vast aantal worpen is ingesteld)
  if (instellingen.maxWorpenVast === null
      && huidigeSpelerIndex === startSpelerIndex
      && maxWorpen === null) {
    maxWorpen = worpTeller;
  }

  spelers[huidigeSpelerIndex].klaar = true;
  laatsteWorp = laatsteGeworpenDitBeurt; // voor "laten liggen" bij de volgende speler

  // een eventueel aangevinkte "laten liggen"-optie geldt niet meer
  // zodra deze beurt stopt (bijv. via "Stop, volgende speler")
  gehoudenWaarden = { 1: null, 2: null };
  houdOptiesContainer.innerHTML = "";

  const volgende = (huidigeSpelerIndex + 1) % spelers.length;
  if (volgende === startSpelerIndex) {
    // iedereen is geweest -> ronde is klaar
    roundeEinde();
    return;
  }

  huidigeSpelerIndex = volgende;
  worpTeller = 0;
  toonBeurtStart();
  renderBeurtInfo();
  checkHoudOpties();
}

/* ========================================================================
   SCORELOGICA (31, Mexicaantje, Honderdmannetje, laten liggen)
   ======================================================================== */

// Bereken de score volgens de Mexicanen-regels.
// Een Mexicaantje (1+2) krijgt MEXICAANTJE_WAARDE (9999): altijd de hoogste
// worp, zodat het nooit als laagste score (en dus sudden-death-kandidaat)
// wordt gezien.
function berekenScore(d1, d2) {
  if (d1 === d2) return d1 * 100;          // dubbel: cijfer x 100
  const hoog = Math.max(d1, d2);
  const laag = Math.min(d1, d2);
  if (hoog === 2 && laag === 1) return MEXICAANTJE_WAARDE; // Mexicaantje
  return hoog * 10 + laag;                  // hoogste = tiental, laagste = eenheid
  // dit geeft automatisch 31 voor 1+3
}

// Is deze worp een 31? (speciale actie + direct opnieuw gooien)
function is31(d1, d2) {
  return berekenScore(d1, d2) === 31;
}

// Is deze worp een Mexicaantje? Hoogste worp, intern MEXICAANTJE_WAARDE
function isMexicaantje(d1, d2) {
  return berekenScore(d1, d2) === MEXICAANTJE_WAARDE;
}

// Verwerk de Honderdmannetje-regel: status toekennen of straf melden.
// Geeft een object terug met de meldingstekst en of die "belangrijk" is.
function verwerkHonderdmannetje(d1, d2, score, spelerIndex) {
  if (!instellingen.honderdmannetjeAan) return { tekst: "", belangrijk: false };

  if (d1 === 1 && d2 === 1) {
    // 1+1 = nieuw Honderdmannetje (vervangt de vorige, indien aanwezig)
    honderdmannetjeIndex = spelerIndex;
    return {
      tekst: `${spelers[spelerIndex].naam} is het nieuwe Honderdmannetje!`,
      belangrijk: true,
    };
  }

  if (honderdmannetjeIndex !== null && score >= 100 && score % 100 === 0) {
    // iemand gooit een honderdtal terwijl er een Honderdmannetje actief is
    const slokken = score / 100; // eerste cijfer van de worp
    globaleStats[honderdmannetjeIndex].totaalSlokken += slokken;
    return {
      tekst: `🍺 ${spelers[honderdmannetjeIndex].naam} drinkt ${slokken} slokken!`,
      belangrijk: true,
    };
  }

  return { tekst: "", belangrijk: false };
}

// Verwerk het resultaat van een worp: score, 31, Mexicaantje, Honderdmannetje
function verwerkWorp(d1, d2, vers1, vers2) {
  const score = berekenScore(d1, d2);

  if (is31(d1, d2)) {
    // 31 telt niet als beurt: overlay laat de speler kiezen wie er drinkt,
    // daarna mag dezelfde speler direct opnieuw gooien
    toon31Overlay(huidigeSpelerIndex, d1, d2, vers1, vers2);
    return; // worpTeller blijft gelijk, score wordt niet opgeslagen
  }

  const honderd = verwerkHonderdmannetje(d1, d2, score, huidigeSpelerIndex);

  worpTeller++;
  spelers[huidigeSpelerIndex].score = score; // voorlopig, definitief bij stoppen
  laatsteGeworpenDitBeurt = { d1: d1, d2: d2, vers1: vers1, vers2: vers2 };
  laatsteWorpInfo.textContent = `${spelers[huidigeSpelerIndex].naam} gooide: ${formatScore(score)}`;

  let mexicaantjeTekst = "";
  if (isMexicaantje(d1, d2)) {
    mexicaantjesDezeRonde++;
    globaleStats[huidigeSpelerIndex].mexicaantjes++;
    mexicaantjeTekst = `🌮 ${spelers[huidigeSpelerIndex].naam} — MEXICAANTJE!`;
  }

  // 1+1 en honderdtallen kunnen nooit samenvallen met een Mexicaantje (1+2),
  // dus er is hooguit één belangrijke melding per worp
  const meldingTekst = honderd.tekst || mexicaantjeTekst;

  if (meldingTekst) {
    toonMeldingOverlay(meldingTekst, () => vervolgNaWorp(d1, d2, vers1, vers2));
  } else {
    vervolgNaWorp(d1, d2, vers1, vers2);
  }
}

// Na het verwerken van een worp (en eventuele melding): juiste knoppen/staat
// tonen. Zijn er nog worpen over, dan worden de dobbelstenen klikbaar om
// opnieuw te gooien; anders alleen nog "Stop".
function vervolgNaWorp(d1, d2, vers1, vers2) {
  const magNogGooien = worpTeller < maxWorpenVoorHuidigeSpeler();
  const isLaatsteSpelerVanRonde =
    (huidigeSpelerIndex + 1) % spelers.length === startSpelerIndex;

  if (!magNogGooien && isLaatsteSpelerVanRonde) {
    // laatste worp van de laatste speler: geen "Stop"-knop meer nodig,
    // na korte pauze automatisch de ronde afronden
    maakDobbelOnklikbaar();
    beurtKnoppen.style.display = "none";
    renderBeurtInfo();
    setTimeout(() => eindigBeurt(), 1500);
    return;
  }

  toonNaWorp(magNogGooien);
  renderBeurtInfo();
  if (magNogGooien) toonEigenHoudOptie(d1, d2, vers1, vers2);
}

// Toon (indien van toepassing) de keuze om een dobbelsteen te laten liggen
// die de VORIGE speler als laatste worp gooide (1 of 2). Geldt alleen voor
// de allereerste worp van een beurt. Een dobbelsteen die de vorige speler
// zelf al gehouden had (vers1/vers2 = false) is al "verbruikt" en mag niet
// nóg eens doorgegeven worden.
function checkHoudOpties() {
  houdOptiesContainer.innerHTML = "";
  if (!instellingen.latenLiggenAan) return;
  if (worpTeller !== 0 || laatsteWorp === null) return;

  if (laatsteWorp.vers1 && (laatsteWorp.d1 === 1 || laatsteWorp.d1 === 2)) {
    houdOptiesContainer.appendChild(maakHoudKnop(1, laatsteWorp.d1));
  }
  if (laatsteWorp.vers2 && (laatsteWorp.d2 === 1 || laatsteWorp.d2 === 2)) {
    houdOptiesContainer.appendChild(maakHoudKnop(2, laatsteWorp.d2));
  }
}

// Toon (indien van toepassing) de keuze om je EIGEN net gegooide 1 of 2 te
// laten liggen voor je volgende worp binnen deze beurt. canKeep wordt elke
// worp opnieuw bepaald (geen beperking van 1x per beurt). Een gehouden
// waarde die niet opnieuw gegooid is (vers1/vers2 = false) telt niet:
// die mag niet nóg eens "bewaard" worden.
function toonEigenHoudOptie(d1, d2, vers1, vers2) {
  houdOptiesContainer.innerHTML = "";
  if (!instellingen.latenLiggenAan) return;
  if (worpTeller >= maxWorpenVoorHuidigeSpeler()) return; // geen volgende worp meer

  if (vers1 && (d1 === 1 || d1 === 2)) {
    houdOptiesContainer.appendChild(maakHoudKnop(1, d1));
  }
  if (vers2 && (d2 === 1 || d2 === 2)) {
    houdOptiesContainer.appendChild(maakHoudKnop(2, d2));
  }
}

// Maak een grote, tap-bare knop waarmee een dobbelsteen-waarde bewaard wordt
// voor de volgende worp. Standaard UIT (neutraal), aangeklikt AAN (accentkleur).
function maakHoudKnop(dobbelNr, waarde) {
  const knop = document.createElement("button");
  knop.type = "button";
  knop.className = "bewaarKnop";
  knop.textContent = `🎲 ${waarde} bewaren: UIT`;

  knop.addEventListener("click", () => {
    const nuAan = gehoudenWaarden[dobbelNr] === null; // toggle
    gehoudenWaarden[dobbelNr] = nuAan ? waarde : null;
    knop.classList.toggle("aan", nuAan);
    knop.textContent = `🎲 ${waarde} bewaren: ${nuAan ? "AAN" : "UIT"}`;
  });

  return knop;
}

/* ========================================================================
   DRINKLOGICA EN -NOTIFICATIES (overlays)
   ======================================================================== */

// Generieke melding: inline blok onder de dobbelstenen, één zin + knop "OK".
// De callback wordt uitgevoerd zodra de speler op OK klikt.
function toonMeldingOverlay(tekst, callback) {
  meldingTekstEl.textContent = tekst;
  meldingBlok.style.display = "flex";
  meldingOkKnop.onclick = () => {
    meldingBlok.style.display = "none";
    callback();
  };
}

// Toon de 31-overlay: de gooier kiest wie er een slok krijgt
function toon31Overlay(spelerIndex, d1, d2, vers1, vers2) {
  overlay31Tekst.textContent = `${spelers[spelerIndex].naam} gooit 31! Kies wie er drinkt.`;
  overlay31Knoppen.innerHTML = "";

  spelers.forEach((speler, i) => {
    if (i === spelerIndex) return; // de gooier kan niet zichzelf kiezen
    const knop = document.createElement("button");
    knop.textContent = speler.naam;
    knop.addEventListener("click", () => kiesWieDrinktBij31(i, d1, d2, vers1, vers2));
    overlay31Knoppen.appendChild(knop);
  });

  overlay31.style.display = "flex";
}

// Verwerk de keuze bij een 31: gekozen speler drinkt 1 slok.
// Daarna sluit de speler de overlay en gooit (dezelfde speler) opnieuw.
function kiesWieDrinktBij31(gekozenIndex, d1, d2, vers1, vers2) {
  globaleStats[gekozenIndex].totaalSlokken += 1;

  overlay31Tekst.textContent = `${spelers[gekozenIndex].naam} drinkt 1 slok!`;
  overlay31Knoppen.innerHTML = "";

  const verderKnop = document.createElement("button");
  verderKnop.textContent = "Opnieuw gooien";
  verderKnop.addEventListener("click", () => {
    overlay31.style.display = "none";
    // 31 telt niet als beurt: speler gooit direct opnieuw. Herstel de
    // mogelijkheid om te gooien (eerste worp -> knop, anders dobbelstenen).
    if (worpTeller === 0) {
      toonBeurtStart();
    } else {
      toonNaWorp(true);
    }
    renderBeurtInfo();
    // de 31-worp zelf telt niet als beurt, maar een 1 of 2 daarin mag
    // alsnog bewaard worden voor de herworp
    toonEigenHoudOptie(d1, d2, vers1, vers2);
  });
  overlay31Knoppen.appendChild(verderKnop);
}

/* ========================================================================
   TOTAALSCOREBORD (over meerdere rondes, via overlay)
   ======================================================================== */

// Teken het totaalscorebord als tabel: rondes verloren, slokken en Mexicaantjes.
// Highlight de rij met de meeste slokken (rood) en die met de meeste Mexicanen
// (goud). Rood heeft voorrang als één speler beide records heeft.
function renderTotaalScorebord() {
  totaalScorebordBody.innerHTML = "";

  // bepaal de records (alleen highlighten als het record > 0 is, anders
  // zou bij 0-0-0 iedereen oplichten)
  const maxSlokken = Math.max(...globaleStats.map((s) => s.totaalSlokken));
  const maxMexicanen = Math.max(...globaleStats.map((s) => s.mexicaantjes));

  spelers.forEach((speler, i) => {
    const stats = globaleStats[i];
    const rij = document.createElement("tr");

    // highlight-klasse kiezen: rood (meeste slokken) heeft voorrang op goud
    if (maxSlokken > 0 && stats.totaalSlokken === maxSlokken) {
      rij.className = "meeste-slokken";
    } else if (maxMexicanen > 0 && stats.mexicaantjes === maxMexicanen) {
      rij.className = "meeste-mexicanen";
    }

    // naam-cel (eerste kolom), eventueel met Honderdmannetje-badge
    const naamCel = document.createElement("td");
    naamCel.className = "speler-naam";
    naamCel.textContent = speler.naam + (i === honderdmannetjeIndex ? " 🍺" : "");
    rij.appendChild(naamCel);

    // getal-cellen (gecentreerd via CSS)
    [stats.rondesVerloren, stats.totaalSlokken, stats.mexicaantjes].forEach((getal) => {
      const cel = document.createElement("td");
      cel.textContent = getal;
      rij.appendChild(cel);
    });

    totaalScorebordBody.appendChild(rij);
  });
}

// "📊 Scorebord": toon de totaalscores als overlay
scorebordKnop.addEventListener("click", () => {
  renderTotaalScorebord();
  scorebordOverlay.style.display = "flex";
});

// Sluit het totaalscorebord weer
scorebordSluitKnop.addEventListener("click", () => {
  scorebordOverlay.style.display = "none";
});

// "Nieuw spel": alle standen resetten, spelersnamen blijven behouden
nieuwSpelKnop.addEventListener("click", () => {
  startNieuwSpel();

  eindBlok.style.display = "none";

  leegDobbelen();
  laatsteWorpInfo.textContent = "";
  toonBeurtStart();
  renderBeurtInfo();
  checkHoudOpties();
});

/* ========================================================================
   RONDE-EINDE, VERLIEZER EN SUDDEN DEATH
   ======================================================================== */

// Alle spelers zijn klaar: bepaal de verliezer (laagste score)
function roundeEinde() {
  const scores = spelers.map((s) => s.score);
  const minScore = Math.min(...scores);
  const laagsteIndices = spelers
    .map((_, i) => i)
    .filter((i) => spelers[i].score === minScore);

  if (laagsteIndices.length === 1) {
    toonEindscherm(laagsteIndices[0]);
  } else {
    // gelijkspel onder de laagste scores -> sudden death
    startSuddenDeath(laagsteIndices);
  }
}

// Start (of herhaal) een sudden-death-ronde tussen gelijk-staande spelers
function startSuddenDeath(kandidatenIndices) {
  suddenDeath = { kandidaten: kandidatenIndices, huidige: 0, scores: {} };
  houdOptiesContainer.innerHTML = "";
  huidigeSpelerIndex = kandidatenIndices[0];
  toonBeurtStart();
  renderBeurtInfo();
}

// Eén worp tijdens sudden death verwerken (1 worp per kandidaat)
function suddenDeathGooien() {
  const d1 = worp();
  const d2 = worp();

  animeerEnToon(d1, d2, () => {
    const score = berekenScore(d1, d2);
    const spelerIndex = suddenDeath.kandidaten[suddenDeath.huidige];
    suddenDeath.scores[spelerIndex] = score;
    spelers[spelerIndex].score = score;
    laatsteWorpInfo.textContent = `${spelers[spelerIndex].naam} gooide: ${formatScore(score)}`;

    suddenDeath.huidige++;
    if (suddenDeath.huidige < suddenDeath.kandidaten.length) {
      // volgende kandidaat is aan de beurt -> weer alleen "Gooien"
      huidigeSpelerIndex = suddenDeath.kandidaten[suddenDeath.huidige];
      toonBeurtStart();
      renderBeurtInfo();
    } else {
      // iedereen heeft gegooid: bepaal de nieuwe laagste score
      const minScore = Math.min(...Object.values(suddenDeath.scores));
      const nieuweKandidaten = suddenDeath.kandidaten.filter(
        (i) => suddenDeath.scores[i] === minScore
      );

      if (nieuweKandidaten.length === 1) {
        suddenDeath = null;
        toonEindscherm(nieuweKandidaten[0]);
      } else {
        // nog steeds gelijk -> herhaal sudden death met deze kandidaten
        startSuddenDeath(nieuweKandidaten);
      }
    }
  });
}

// Toon de eind-overlay: verliezer, straf-opbouw en gegooide Mexicaantjes
function toonEindscherm(verliezerIndex) {
  // straf = instelbare basisstraf + instelbare bonus per Mexicaantje
  const straf = instellingen.basisStraf + instellingen.mexicaantjeBonus * mexicaantjesDezeRonde;

  globaleStats[verliezerIndex].rondesVerloren++;
  globaleStats[verliezerIndex].totaalSlokken += straf;

  eindVerliezer.textContent = `😵 ${spelers[verliezerIndex].naam} verliest`;
  eindSlokken.textContent = `🍺 ${straf} slokken`;

  // bonusregel alleen tonen als er ook echt Mexicaantjes gegooid zijn
  if (mexicaantjesDezeRonde > 0) {
    eindMexicaantjes.textContent = `🌮 x${mexicaantjesDezeRonde} Mexicaantje bonus`;
    eindMexicaantjes.style.display = "block";
  } else {
    eindMexicaantjes.style.display = "none";
  }

  eindBlok.style.display = "flex";
}

// "Nieuwe ronde": reset de ronde-state en geef de beurt aan de volgende startspeler
nieuweRondeKnop.addEventListener("click", () => {
  startNieuweRondeState();

  // de volgende speler in de cirkel begint de nieuwe ronde
  startSpelerIndex = (startSpelerIndex + 1) % spelers.length;
  huidigeSpelerIndex = startSpelerIndex;

  eindBlok.style.display = "none";

  leegDobbelen();
  laatsteWorpInfo.textContent = "";
  toonBeurtStart();
  renderBeurtInfo();
  checkHoudOpties();
});

// ===== PWA: registreer de service worker zodat de app offline werkt =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
}

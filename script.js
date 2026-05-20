// ===== INSTELLINGEN =====
// Standaardwaarden als er nog niets is opgeslagen
let instellingen = {
  fastSeconds: 180, 
  slowSeconds: 180, 
  totalMinutes: 30,
  startTempo: "snel", 
  voicePrompts: true,
  beeps: true,      
  vibrate: true,
  speedFastKmH: 7.0, 
  speedSlowKmH: 5.0  
};

// ===== TIMER STATS =====
let totaalSeconden = instellingen.totalMinutes * 60;
let resterendeSeconden = totaalSeconden;
let verstrekenSeconden = 0;
let phaseSeconden = instellingen.fastSeconds;
let huidigeSet = 1;
let isFastPhase = true;
let totaalSets = Math.ceil(totaalSeconden / (instellingen.fastSeconds + instellingen.slowSeconds)) * 2;
let totaalAfstandMeter = 0; 

let timerLoopt = false;
let isAftellen = false;
let interval;
let aftelInterval; 

// ===== UI ELEMENTEN =====
const mainTimer = document.getElementById("mainTimer");
const phaseTimer = document.getElementById("phaseTimer");
const elapsedInfo = document.getElementById("elapsedInfo");
const remainingInfo = document.getElementById("remainingInfo");
const setInfo = document.getElementById("setInfo");
const distanceInfo = document.getElementById("distanceInfo"); 
const progressFill = document.getElementById("progressFill");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const modeTitle = document.querySelector(".mode-title");

// Schermen wisselen elementen (Summary / Voltooid)
const timerRunningView = document.getElementById("timerRunningView");
const summaryView = document.getElementById("summaryView");
const sumTotalTime = document.getElementById("sumTotalTime");
const sumDistance = document.getElementById("sumDistance"); 
const sumIntervals = document.getElementById("sumIntervals");
const saveWalkBtn = document.getElementById("saveWalkBtn");
const closeWalkBtn = document.getElementById("closeWalkBtn");

// ===== SETTINGS PANEL =====
const settingsPanel = document.getElementById("settingsPanel");
const openSettings = document.getElementById("openSettings");
const closeSettings = document.getElementById("closeSettings");

const selectStartTempo = document.getElementById("startTempo");
const selectSpraak = document.getElementById("gesprokenMeldingen");
const selectPiepjes = document.getElementById("piepjes");
const selectTrillen = document.getElementById("trillen");

// Spinner input elementen
const snelMinInput = document.getElementById("snelMinuten");
const snelSecInput = document.getElementById("snelSeconden");
const traagMinInput = document.getElementById("traagMinuten");
const traagSecInput = document.getElementById("traagSeconden");
const totaleTijdInput = document.getElementById("totaleTijd");

// ===== HISTORY PANEL =====
const historyPanel = document.getElementById("historyPanel");
const openHistory = document.getElementById("openHistory");
const closeHistory = document.getElementById("closeHistory");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// Schakel het instellingenpaneel (open/dicht) via tandwieltje
if (openSettings) {
  openSettings.addEventListener("click", () => {
    if (!timerLoopt) {
      if (settingsPanel) settingsPanel.classList.toggle("open");
      if (historyPanel) historyPanel.classList.remove("open"); 
      document.body.classList.add("settings-open");
      document.body.classList.remove("history-open");
    }
  });
}

if (closeSettings) {
  closeSettings.addEventListener("click", () => {
    if (settingsPanel) settingsPanel.classList.remove("open");
    document.body.classList.remove("settings-open"); 
  });
}

// Schakel het geschiedenispaneel open/dicht via de klok-knop
if (openHistory) {
  openHistory.addEventListener("click", () => {
    if (!timerLoopt) {
      if (historyPanel) historyPanel.classList.toggle("open");
      if (settingsPanel) settingsPanel.classList.remove("open"); 
      document.body.classList.add("history-open");
      document.body.classList.remove("settings-open");
      toonGeschiedenis();
    }
  });
}

if (closeHistory) {
  closeHistory.addEventListener("click", () => {
    if (historyPanel) historyPanel.classList.remove("open");
    document.body.classList.remove("history-open"); 
  });
}

// ===== INSTELLINGSBEHEER (GEHEUGEN) =====
function slaInstellingenOp() {
  localStorage.setItem("wandelInstellingen", JSON.stringify(instellingen));
}

function laadInstellingen() {
  let opgeslagen = localStorage.getItem("wandelInstellingen");
  if (opgeslagen) {
    try {
      instellingen = JSON.parse(opgeslagen);
      
      // Zet de HTML elementen (inputs/selects) direct op de opgeslagen waarden
      if (selectStartTempo) selectStartTempo.value = instellingen.startTempo;
      if (totaleTijdInput) totaleTijdInput.value = instellingen.totalMinutes;
      
      if (selectSpraak) selectSpraak.value = instellingen.voicePrompts ? "Aan" : "Uit";
      if (selectPiepjes) selectPiepjes.value = instellingen.beeps ? "Aan" : "Uit";
      if (selectTrillen) selectTrillen.value = instellingen.vibrate ? "Aan" : "Uit";
      
      if (snelMinInput) snelMinInput.value = Math.floor(instellingen.fastSeconds / 60);
      if (snelSecInput) snelSecInput.value = instellingen.fastSeconds % 60;
      if (traagMinInput) traagMinInput.value = Math.floor(instellingen.slowSeconds / 60);
      if (traagSecInput) traagSecInput.value = instellingen.slowSeconds % 60;
    } catch (e) {
      console.log("Fout bij laden van instellingen:", e);
    }
  }
}

// ===== STEM, GELUID & TRILLEN FUNCTIES =====
function spreekTekst(tekst) {
  if (!instellingen.voicePrompts) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(tekst);
    utterance.lang = "nl-NL";
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.log("Spraak niet ondersteund.");
  }
}

// Functie om de timer te resetten naar de beginwaarden op basis van instellingen
function resetNaarBeginWaarden() {
  totaalSeconden = instellingen.totalMinutes * 60;
  resterendeSeconden = totaalSeconden;
  verstrekenSeconden = 0;
  huidigeSet = 1;
  totaalAfstandMeter = 0; 
  
  // Bepaal de startfase op basis van de instelling
  isFastPhase = (instellingen.startTempo === "snel");
  phaseSeconden = isFastPhase ? instellingen.fastSeconds : instellingen.slowSeconds;
  
  totaalSets = Math.ceil(totaalSeconden / (instellingen.fastSeconds + instellingen.slowSeconds)) * 2;

  if (summaryView) summaryView.style.display = "none";
  if (timerRunningView) timerRunningView.style.display = "block";
}

function speelPiep(frequentie = 880) {
  if (!instellingen.beeps) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = "sine"; 
    oscillator.frequency.setValueAtTime(frequentie, audioCtx.currentTime); 
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
    oscillator.start();
    setTimeout(() => { oscillator.stop(); audioCtx.close(); }, 300);
  } catch (e) {
    console.log("Audio niet ondersteund.");
  }
}

function trilTelefoon() {
  if (!instellingen.vibrate) return;
  if ("vibrate" in navigator) {
    navigator.vibrate(500);
  }
}

// ===== TIJD & AFSTAND FORMATTEREN =====
function formatTime(seconds) {
  let mins = Math.floor(seconds / 60);
  let secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatKilometers(meters) {
  let km = meters / 1000;
  return km.toFixed(2) + " km";
}

// ===== UPDATE UI =====
function updateUI() {
  if (!isAftellen && mainTimer) {
    mainTimer.textContent = formatTime(resterendeSeconden);
    mainTimer.style.color = "white";
  }

  if (phaseTimer) phaseTimer.textContent = formatTime(phaseSeconden);
  if (elapsedInfo) elapsedInfo.textContent = formatTime(verstrekenSeconden);
  if (remainingInfo) remainingInfo.textContent = formatTime(resterendeSeconden);
  if (setInfo) setInfo.textContent = `${huidigeSet} / ${totaalSets}`;
  if (distanceInfo) distanceInfo.textContent = formatKilometers(totaalAfstandMeter); 

  if (modeTitle) {
    if (isFastPhase) {
      modeTitle.textContent = "SNEL";
      modeTitle.style.color = "#00ff66";
    } else {
      modeTitle.textContent = "TRAAG";
      modeTitle.style.color = "#ffcc00";
    }
  }

  let progress = (verstrekenSeconden / totaalSeconden) * 100;
  if (progressFill) progressFill.style.width = `${Math.min(progress, 100)}%`;
}

// ===== GESCHIEDENIS LOGICA =====
function slaWandelingOp() {
  let geschiedenis = JSON.parse(localStorage.getItem("wandelGeschiedenis")) || [];
  
  let nieuweWandeling = {
    datum: new Date().toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    totaleTijd: instellingen.totalMinutes,
    afstand: formatKilometers(totaalAfstandMeter), 
    snelTijd: formatTime(instellingen.fastSeconds),
    traagTijd: formatTime(instellingen.slowSeconds)
  };
  
  geschiedenis.unshift(nieuweWandeling); 
  localStorage.setItem("wandelGeschiedenis", JSON.stringify(geschiedenis));
}

function toonGeschiedenis() {
  if (!historyList) return;
  let geschiedenis = JSON.parse(localStorage.getItem("wandelGeschiedenis")) || [];
  historyList.innerHTML = "";
  
  if (geschiedenis.length === 0) {
    historyList.innerHTML = "<p style='color: #666; text-align: center; margin-top: 20px;'>Nog geen wandelingen opgeslagen.</p>";
    return;
  }
  
  geschiedenis.forEach(w => {
    let item = document.createElement("div");
    item.classList.add("history-item");
    let afstandTekst = w.afstand ? ` (${w.afstand})` : '';
    item.innerHTML = `
      <div class="date">${w.datum}</div>
      <div class="duration">${w.totaleTijd} min gewandeld${afstandTekst}</div>
      <div class="details">Interval: ${w.snelTijd} snel / ${w.traagTijd} traag</div>
    `;
    historyList.appendChild(item);
  });
}

if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    if (confirm("Weet je zeker dat je de hele geschiedenis wilt wissen?")) {
      localStorage.removeItem("wandelGeschiedenis");
      toonGeschiedenis();
    }
  });
}

// ===== RUN CORE TIMER =====
function startEchteTimer() {
  isAftellen = false;
  updateUI();
  
  speelPiep(1200);
  trilTelefoon();
  
  setTimeout(() => { spreekTekst(isFastPhase ? "Snel" : "Traag"); }, 350);

  interval = setInterval(() => {
    resterendeSeconden--;
    verstrekenSeconden++;
    phaseSeconden--;

    // AFSTAND BEREKENEN PER SECONDE
    if (isFastPhase) {
      totaalAfstandMeter += (instellingen.speedFastKmH * 1000) / 3600;
    } else {
      totaalAfstandMeter += (instellingen.speedSlowKmH * 1000) / 3600;
    }

    if (phaseSeconden <= 0 && resterendeSeconden > 0) {
      huidigeSet++;
      isFastPhase = !isFastPhase;
      phaseSeconden = isFastPhase ? instellingen.fastSeconds : instellingen.slowSeconds;
      
      speelPiep(1200);
      trilTelefoon();
      setTimeout(() => { spreekTekst(isFastPhase ? "Snel" : "Traag"); }, 350);
    }

    if (resterendeSeconden <= 0) {
      clearInterval(interval);
      timerLoopt = false;
      resterendeSeconden = 0;
      phaseSeconden = 0;
      
      if (openSettings) openSettings.classList.remove("disabled");
      if (openHistory) openHistory.classList.remove("disabled"); 
      if (startBtn) startBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start`;
      
      speelPiep(1500);
      setTimeout(() => speelPiep(1500), 400);
      
      setTimeout(() => { 
        spreekTekst("Wandeling voltooid! Goed gedaan!"); 
        
        if (sumTotalTime) sumTotalTime.textContent = instellingen.totalMinutes;
        if (sumDistance) sumDistance.textContent = (totaalAfstandMeter / 1000).toFixed(2); 
        if (sumIntervals) sumIntervals.textContent = `${formatTime(instellingen.fastSeconds)} / ${formatTime(instellingen.slowSeconds)}`;
        
        if (timerRunningView) timerRunningView.style.display = "none";
        if (summaryView) summaryView.style.display = "block";
      }, 500);
    }

    updateUI();
  }, 1000);
}

// Knoppen op het overzichtsscherm afhandelen
if (saveWalkBtn) {
  saveWalkBtn.addEventListener("click", () => {
    slaWandelingOp();
    saveWalkBtn.innerHTML = `<i class="fa-solid fa-check"></i> Opgeslagen!`;
    saveWalkBtn.style.background = "#222";
    saveWalkBtn.style.color = "#00ff66";
    saveWalkBtn.disabled = true;
    
    setTimeout(() => {
      saveWalkBtn.innerHTML = `<i class="fa-solid fa-bookmark"></i> Opslaan`;
      saveWalkBtn.style.background = "#00ff66";
      saveWalkBtn.style.color = "black";
      saveWalkBtn.disabled = false;
      resetNaarBeginWaarden();
      updateUI();
    }, 1200);
  });
}

if (closeWalkBtn) {
  closeWalkBtn.addEventListener("click", () => {
    resetNaarBeginWaarden();
    updateUI();
  });
}

// ===== START / PAUSE =====
if (startBtn) {
  startBtn.addEventListener("click", () => {
    if (!timerLoopt) {
      timerLoopt = true;
      isAftellen = true;
      startBtn.innerHTML = `<i class="fa-solid fa-hourglass-start"></i> Bereid je voor...`;
      
      if (settingsPanel) settingsPanel.classList.remove("open");
      if (historyPanel) historyPanel.classList.remove("open"); 
      document.body.classList.remove("settings-open");
      document.body.classList.remove("history-open");
      
      if (openSettings) openSettings.classList.add("disabled");
      if (openHistory) openHistory.classList.add("disabled"); 

      let aftelTeller = 3;
      if (mainTimer) {
        mainTimer.textContent = aftelTeller;
        mainTimer.style.color = "#ff9900";
      }
      
      speelPiep(880);

      aftelInterval = setInterval(() => {
        aftelTeller--;
        if (aftelTeller > 0) {
          if (mainTimer) mainTimer.textContent = aftelTeller;
          speelPiep(880); 
        } else {
          clearInterval(aftelInterval);
          startBtn.innerHTML = `<i class="fa-solid fa-pause"></i> Pause`;
          startEchteTimer(); 
        }
      }, 1000);

    } else {
      timerLoopt = false;
      isAftellen = false;
      clearInterval(interval);
      clearInterval(aftelInterval);
      window.speechSynthesis.cancel();
      
      if (openSettings) openSettings.classList.remove("disabled");
      if (openHistory) openHistory.classList.remove("disabled"); 
      startBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start`;
      updateUI(); 
    }
  });
}

// ===== RESET =====
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    clearInterval(interval);
    clearInterval(aftelInterval); 
    window.speechSynthesis.cancel();
    timerLoopt = false;
    isAftellen = false;

    if (openSettings) openSettings.classList.remove("disabled");
    if (openHistory) openHistory.classList.remove("disabled"); 
    document.body.classList.remove("settings-open");
    document.body.classList.remove("history-open");

    resetNaarBeginWaarden();

    if (startBtn) startBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start`;
    updateUI();
  });
}

// ===== HERBEREKENEN VAN SPINNER INPUTS =====
function updateFaseTijdenVanInputs() {
  let snelMin = 0, snelSec = 0, traagMin = 0, traagSec = 0;
  if (snelMinInput) snelMin = Math.max(0, Number(snelMinInput.value) || 0);
  if (snelSecInput) snelSec = Math.max(0, Number(snelSecInput.value) || 0);
  if (traagMinInput) traagMin = Math.max(0, Number(traagMinInput.value) || 0);
  if (traagSecInput) traagSec = Math.max(0, Number(traagSecInput.value) || 0);

  instellingen.fastSeconds = (snelMin * 60) + snelSec;
  instellingen.slowSeconds = (traagMin * 60) + traagSec;
  
  if (!timerLoopt) {
    resetNaarBeginWaarden();
  }
  updateUI();
  slaInstellingenOp(); // Sla op na aanpassing
}

// Luisteraars voor de spinners
if (snelMinInput) snelMinInput.addEventListener("input", updateFaseTijdenVanInputs);
if (snelSecInput) snelSecInput.addEventListener("input", updateFaseTijdenVanInputs);
if (traagMinInput) traagMinInput.addEventListener("input", updateFaseTijdenVanInputs);
if (traagSecInput) traagSecInput.addEventListener("input", updateFaseTijdenVanInputs);

// Luisteraar voor starttempo wissel
if (selectStartTempo) {
  selectStartTempo.addEventListener("change", (e) => {
    instellingen.startTempo = e.target.value;
    if (!timerLoopt) {
      resetNaarBeginWaarden();
    }
    updateUI();
    slaInstellingenOp(); // Sla op na aanpassing
  });
}

if (totaleTijdInput) {
  totaleTijdInput.addEventListener("input", (e) => {
    instellingen.totalMinutes = Number(e.target.value) || 0;
    if (!timerLoopt) {
      resetNaarBeginWaarden();
    }
    updateUI();
    slaInstellingenOp(); // Sla op na aanpassing
  });
}

if (selectSpraak) selectSpraak.addEventListener("change", (e) => { instellingen.voicePrompts = (e.target.value === "Aan"); slaInstellingenOp(); });
if (selectPiepjes) selectPiepjes.addEventListener("change", (e) => { instellingen.beeps = (e.target.value === "Aan"); slaInstellingenOp(); });
if (selectTrillen) selectTrillen.addEventListener("change", (e) => { instellingen.vibrate = (e.target.value === "Aan"); slaInstellingenOp(); });

// ===== ON LOAD =====
laadInstellingen(); // 1. Laad eerst de opgeslagen instellingen in
resetNaarBeginWaarden(); // 2. Bereken de klokken op basis daarvan
updateUI(); // 3. Toon het op het scherm

// ===== INSTELLINGEN =====
let instellingen = {
  fastSeconds: 180, 
  slowSeconds: 180, 
  totalMinutes: 30,
  startTempo: "snel", 
  voicePrompts: true,
  beeps: true,      
  vibrate: true     
};

// ===== TIMER STATS =====
let totaalSeconden = instellingen.totalMinutes * 60;
let resterendeSeconden = totaalSeconden;
let verstrekenSeconden = 0;
let phaseSeconden = instellingen.fastSeconds;
let huidigeSet = 1;
let isFastPhase = true;
let totaalSets = 5;

let timerLoopt = false;
let isAftellen = false;
let interval;
let aftelInterval; 

// Mobiele audio-fix variabele
let audioCtx = null;

// ===== UI ELEMENTEN =====
const mainTimer = document.getElementById("mainTimer");
const phaseTimer = document.getElementById("phaseTimer");
const elapsedInfo = document.getElementById("elapsedInfo");
const remainingInfo = document.getElementById("remainingInfo");
const setInfo = document.getElementById("setInfo");
const progressFill = document.getElementById("progressFill");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const modeTitle = document.querySelector(".mode-title");

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

// Schakel het instellingenpaneel open/dicht
openSettings.addEventListener("click", () => {
  if (!timerLoopt) {
    settingsPanel.classList.toggle("open");
  }
});

closeSettings.addEventListener("click", () => {
  settingsPanel.classList.remove("open");
});

// ===== STEM, GELUID & TRILLEN FUNCTIES =====
function activeerAudioOpGsm() {
  // Maak de audiocontext aan of herstart hem bij de allereerste klik (vereist voor iOS/Android)
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    // Korte spraak-trigger om speechSynthesis toestemming te geven op de achtergrond
    if (instellingen.voicePrompts) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(u);
    }
  } catch (e) {
    console.log("Audio initialisatie mislukt", e);
  }
}

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

function resetNaarBeginWaarden() {
  totaalSeconden = instellingen.totalMinutes * 60;
  resterendeSeconden = totaalSeconden;
  verstrekenSeconden = 0;
  huidigeSet = 1;
  
  isFastPhase = (instellingen.startTempo === "snel");
  phaseSeconden = isFastPhase ? instellingen.fastSeconds : instellingen.slowSeconds;
  
  totaalSets = Math.ceil(totaalSeconden / (instellingen.fastSeconds + instellingen.slowSeconds)) * 2;
}

function speelPiep(frequentie = 880) {
  if (!instellingen.beeps) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = "sine"; 
    oscillator.frequency.setValueAtTime(frequentie, audioCtx.currentTime); 
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
    oscillator.start();
    setTimeout(() => { oscillator.stop(); }, 300);
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

// ===== TIJD FORMATTEREN =====
function formatTime(seconds) {
  let mins = Math.floor(seconds / 60);
  let secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// ===== UPDATE UI =====
function updateUI() {
  if (!isAftellen) {
    mainTimer.textContent = formatTime(resterendeSeconden);
    mainTimer.style.color = "white";
  }

  phaseTimer.textContent = formatTime(phaseSeconden);
  elapsedInfo.textContent = formatTime(verstrekenSeconden);
  remainingInfo.textContent = formatTime(resterendeSeconden);
  setInfo.textContent = `${huidigeSet} / ${totaalSets}`;

  if (isFastPhase) {
    modeTitle.textContent = "SNEL";
    modeTitle.style.color = "#00ff66";
  } else {
    modeTitle.textContent = "TRAAG";
    modeTitle.style.color = "#ffcc00";
  }

  let progress = (verstrekenSeconden / totaalSeconden) * 100;
  progressFill.style.width = `${Math.min(progress, 100)}%`;
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
      
      openSettings.classList.remove("disabled");
      startBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start`;
      
      speelPiep(1500);
      setTimeout(() => speelPiep(1500), 400);
      
      setTimeout(() => { spreekTekst("Wandeling voltooid! Goed gedaan!"); }, 500);
      alert("Wandeling voltooid! Goed gedaan!");
    }

    updateUI();
  }, 1000);
}

// ===== START / PAUSE =====
startBtn.addEventListener("click", () => {
  // FIX: Activeer direct audio bij de klik-gebeurtenis!
  activeerAudioOpGsm();

  if (!timerLoopt) {
    timerLoopt = true;
    isAftellen = true;
    startBtn.innerHTML = `<i class="fa-solid fa-hourglass-start"></i> Bereid je voor...`;
    
    settingsPanel.classList.remove("open");
    openSettings.classList.add("disabled");

    let aftelTeller = 3;
    mainTimer.textContent = aftelTeller;
    mainTimer.style.color = "#ff9900";
    
    speelPiep(880);

    aftelInterval = setInterval(() => {
      aftelTeller--;
      if (aftelTeller > 0) {
        mainTimer.textContent = aftelTeller;
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
    
    openSettings.classList.remove("disabled");
    startBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start`;
    updateUI(); 
  }
});

// ===== RESET =====
resetBtn.addEventListener("click", () => {
  activeerAudioOpGsm();
  clearInterval(interval);
  clearInterval(aftelInterval); 
  window.speechSynthesis.cancel();
  timerLoopt = false;
  isAftellen = false;

  openSettings.classList.remove("disabled");
  resetNaarBeginWaarden();

  startBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start`;
  updateUI();
});

// ===== HERBEREKENEN VAN SPINNER INPUTS =====
function updateFaseTijdenVanInputs() {
  let snelMin = Math.max(0, Number(snelMinInput.value) || 0);
  let snelSec = Math.max(0, Number(snelSecInput.value) || 0);
  let traagMin = Math.max(0, Number(traagMinInput.value) || 0);
  let traagSec = Math.max(0, Number(traagSecInput.value) || 0);

  instellingen.fastSeconds = (snelMin * 60) + snelSec;
  instellingen.slowSeconds = (traagMin * 60) + traagSec;
  
  if (!timerLoopt) {
    resetNaarBeginWaarden();
  }
  updateUI();
}

snelMinInput.addEventListener("input", updateFaseTijdenVanInputs);
snelSecInput.addEventListener("input", updateFaseTijdenVanInputs);
traagMinInput.addEventListener("input", updateFaseTijdenVanInputs);
traagSecInput.addEventListener("input", updateFaseTijdenVanInputs);

selectStartTempo.addEventListener("change", (e) => {
  instellingen.startTempo = e.target.value;
  if (!timerLoopt) {
    resetNaarBeginWaarden();
  }
  updateUI();
});

document.getElementById("totaleTijd").addEventListener("input", (e) => {
  instellingen.totalMinutes = Number(e.target.value) || 0;
  if (!timerLoopt) {
    resetNaarBeginWaarden();
  }
  updateUI();
});

selectSpraak.addEventListener("change", (e) => { instellingen.voicePrompts = (e.target.value === "Aan"); });
selectPiepjes.addEventListener("change", (e) => { instellingen.beeps = (e.target.value === "Aan"); });
selectTrillen.addEventListener("change", (e) => { instellingen.vibrate = (e.target.value === "Aan"); });

// ===== ON LOAD =====
resetNaarBeginWaarden();
updateUI();

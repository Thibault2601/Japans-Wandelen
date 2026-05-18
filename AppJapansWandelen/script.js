// ===== INSTELLINGEN =====
let instellingen = {
  fastSeconds: 180,
  slowSeconds: 180,
  totalMinutes: 30,
  voicePrompts: true, // Standaard aan
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

let totaalSets = Math.ceil(totaalSeconden / (instellingen.fastSeconds + instellingen.slowSeconds)) * 2;

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
const progressFill = document.getElementById("progressFill");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const modeTitle = document.querySelector(".mode-title");

// ===== SETTINGS PANEL =====
const settingsPanel = document.getElementById("settingsPanel");
const openSettings = document.getElementById("openSettings");
const closeSettings = document.getElementById("closeSettings");

const selectSpraak = document.getElementById("gesprokenMeldingen");
const selectPiepjes = document.getElementById("piepjes");
const selectTrillen = document.getElementById("trillen");

// Schakel het instellingenpaneel (open/dicht)
openSettings.addEventListener("click", () => {
  if (!timerLoopt) {
    settingsPanel.classList.toggle("open");
  }
});

closeSettings.addEventListener("click", () => {
  settingsPanel.classList.remove("open");
});

// ===== STEM, GELUID & TRILLEN FUNCTIES =====

// Nieuw: Spreek tekst uit in het Nederlands
function spreekTekst(tekst) {
  if (!instellingen.voicePrompts) return;

  try {
    // Stop eventuele lopende spraak direct om overlapping te voorkomen
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(tekst);
    utterance.lang = "nl-NL"; // Stel de taal in op Nederlands
    utterance.rate = 1.0;     // Snelheid van de stem (1.0 is normaal)
    
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.log("Spraak via browser niet ondersteund.");
  }
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
    
    setTimeout(() => {
      oscillator.stop();
      audioCtx.close();
    }, 300);
  } catch (e) {
    console.log("AudioContext niet geactiveerd of ondersteund.");
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
  mins = String(mins).padStart(2, "0");
  secs = String(secs).padStart(2, "0");
  return `${mins}:${secs}`;
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
  
  // Zeg de startfase na het aftellen
  setTimeout(() => {
    spreekTekst(isFastPhase ? "Snel" : "Traag");
  }, 350);

  interval = setInterval(() => {
    resterendeSeconden--;
    verstrekenSeconden++;
    phaseSeconden--;

    // Als een tempo-fase afgelopen is
    if (phaseSeconden <= 0 && resterendeSeconden > 0) {
      huidigeSet++;
      isFastPhase = !isFastPhase;
      phaseSeconden = isFastPhase ? instellingen.fastSeconds : instellingen.slowSeconds;
      
      speelPiep(1200);
      trilTelefoon();
      
      // Roep de nieuwe fase om (kort na de piep)
      setTimeout(() => {
        spreekTekst(isFastPhase ? "Snel" : "Traag");
      }, 350);
    }

    // Als de gehele wandeling voltooid is
    if (resterendeSeconden <= 0) {
      clearInterval(interval);
      timerLoopt = false;
      resterendeSeconden = 0;
      phaseSeconden = 0;
      
      openSettings.classList.remove("disabled");
      startBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start`;
      
      speelPiep(1500);
      setTimeout(() => speelPiep(1500), 400);
      if ("vibrate" in navigator) navigator.vibrate([300, 100, 300]); 

      // Kondig het einde ook gesproken aan
      setTimeout(() => {
        spreekTekst("Wandeling voltooid! Goed gedaan!");
      }, 500);

      alert("Wandeling voltooid! Goed gedaan!");
    }

    updateUI();
  }, 1000);
}

// ===== START / PAUSE =====
startBtn.addEventListener("click", () => {
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
    window.speechSynthesis.cancel(); // Stop eventuele spraak bij pauze
    
    openSettings.classList.remove("disabled");
    startBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start`;
    updateUI(); 
  }
});

// ===== RESET =====
resetBtn.addEventListener("click", () => {
  clearInterval(interval);
  clearInterval(aftelInterval); 
  window.speechSynthesis.cancel(); // Stop alle spraak direct
  timerLoopt = false;
  isAftellen = false;

  openSettings.classList.remove("disabled");

  totaalSeconden = instellingen.totalMinutes * 60;
  resterendeSeconden = totaalSeconden;
  verstrekenSeconden = 0;
  isFastPhase = true;
  phaseSeconden = instellingen.fastSeconds;
  huidigeSet = 1;
  
  totaalSets = Math.ceil(totaalSeconden / (instellingen.fastSeconds + instellingen.slowSeconds)) * 2;

  startBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start`;
  updateUI();
});

// ===== INSTELLINGEN LUISTERAARS =====
document.getElementById("tijdSnelTempo").addEventListener("input", (e) => {
  instellingen.fastSeconds = Number(e.target.value) || 0;
  if (isFastPhase && !timerLoopt) phaseSeconden = instellingen.fastSeconds;
  totaalSets = Math.ceil(totaalSeconden / (instellingen.fastSeconds + instellingen.slowSeconds)) * 2;
  updateUI();
});

document.getElementById("tijdTraagTempo").addEventListener("input", (e) => {
  instellingen.slowSeconds = Number(e.target.value) || 0;
  if (!isFastPhase && !timerLoopt) phaseSeconden = instellingen.slowSeconds;
  totaalSets = Math.ceil(totaalSeconden / (instellingen.fastSeconds + instellingen.slowSeconds)) * 2;
  updateUI();
});

document.getElementById("totaleTijd").addEventListener("input", (e) => {
  instellingen.totalMinutes = Number(e.target.value) || 0;
  totaalSeconden = instellingen.totalMinutes * 60;
  
  if (!timerLoopt) {
    resterendeSeconden = totaalSeconden;
    totaalSets = Math.ceil(totaalSeconden / (instellingen.fastSeconds + instellingen.slowSeconds)) * 2;
  }
  updateUI();
});

// Luisteraar voor gesproken meldingen select-knop
selectSpraak.addEventListener("change", (e) => {
  instellingen.voicePrompts = (e.target.value === "Aan");
});

selectPiepjes.addEventListener("change", (e) => {
  instellingen.beeps = (e.target.value === "Aan");
});

selectTrillen.addEventListener("change", (e) => {
  instellingen.vibrate = (e.target.value === "Aan");
});

// ===== ON LOAD =====
updateUI();
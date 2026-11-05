const storageKey = "go-beginner-sound";
let enabled = localStorage.getItem(storageKey) !== "0";
let ctx = null;
let manifest = null;
let playToken = 0;
let currentClip = null;
const manifestReady = fetch("audio/voice/manifest.json")
  .then((response) => response.json())
  .then((data) => {
    manifest = data.files || {};
  })
  .catch(() => {
    manifest = {};
  });

const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

export function zhCount(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0 || n >= 100) return String(value);
  if (n < 10) return digits[n];
  if (n < 20) return `十${n === 10 ? "" : digits[n % 10]}`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${digits[tens]}十${ones ? digits[ones] : ""}`;
}

export function bindSoundToggle(button) {
  const paint = () => {
    button.textContent = enabled ? "声音开" : "声音关";
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
  };
  paint();
  button.addEventListener("click", () => {
    enabled = !enabled;
    localStorage.setItem(storageKey, enabled ? "1" : "0");
    if (!enabled) stopVoice();
    else {
      unlock();
      playTone("place");
    }
    paint();
  });
}

export function playTone(kind) {
  if (!enabled) return;
  const audio = unlock();
  if (!audio) return;
  if (kind === "capture") {
    knock(audio, 210, 0.22, 0.09);
    knock(audio, 320, 0.16, 0.08, 0.07);
  } else if (kind === "forbid" || kind === "no") {
    knock(audio, 140, 0.12, 0.08);
    knock(audio, 110, 0.1, 0.1, 0.09);
  } else if (kind === "ok") {
    knock(audio, 392, 0.12, 0.07);
    knock(audio, 523, 0.1, 0.09, 0.08);
  } else if (kind === "pass") {
    knock(audio, 180, 0.08, 0.06);
  } else {
    knock(audio, 230, 0.2, 0.08);
  }
}

export function speak(text) {
  if (!enabled || !text) return;
  speakParts([text]);
}

export function speakMove({ color, coord, liberties, captured }) {
  const who = color === "B" ? "黑棋" : "白棋";
  const letter = String(coord).slice(0, 1);
  const row = zhCount(Number(String(coord).slice(1)));
  const count = zhCount(liberties);
  const clauses = [
    [[`${who}下在${letter}${row}。`], [`${who}下在`, letter, row]],
    [[`这一块有${count}气。`], ["，这一块有", count, "气。"]],
  ];
  if (captured) {
    const taken = zhCount(captured);
    clauses.push([[`${who}提掉了${taken}子。`], [`${who}提掉了`, taken, "子。"]]);
  }
  speakClauses(clauses);
}

export function speakParts(parts) {
  speakFlexible([parts]);
}

export function speakFlexible(groups) {
  speakClauses([groups]);
}

export function speakClauses(clauses) {
  if (!enabled) return;
  const token = ++playToken;
  const start = () => {
    if (token !== playToken || !enabled) return;
    const queue = [];
    clauses.forEach((options) => {
      const found = options
        .map((parts) => parts.filter(Boolean))
        .find((parts) => parts.length && parts.every((part) => manifest[part]));
      if (found) queue.push(...found);
    });
    if (!queue.length) {
      systemSpeak(clauses.flat().flat().filter(Boolean).join(""));
      return;
    }
    playQueue(queue, token, 0);
  };
  if (manifest) start();
  else manifestReady.then(start);
}

function playQueue(queue, token, index) {
  if (token !== playToken || !enabled || index >= queue.length) return;
  if (currentClip) {
    currentClip.onended = null;
    currentClip.pause();
  }
  const audio = new Audio(`audio/voice/${manifest[queue[index]]}?v=2`);
  currentClip = audio;
  audio.onended = () => playQueue(queue, token, index + 1);
  audio.play().catch(() => {
    if (index === 0) systemSpeak(queue.join(""));
  });
}

function systemSpeak(text) {
  const synth = window.speechSynthesis;
  if (!synth || !text) return;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-CN";
  utter.rate = 0.95;
  const voice = synth.getVoices().find((item) => item.lang && item.lang.toLowerCase().startsWith("zh"));
  if (voice) utter.voice = voice;
  synth.speak(utter);
}

function stopVoice() {
  playToken += 1;
  if (currentClip) {
    currentClip.onended = null;
    currentClip.pause();
    currentClip = null;
  }
  window.speechSynthesis?.cancel();
}

function unlock() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function knock(audio, freq, volume, duration, delay = 0) {
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.55), start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);

  const length = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
  }
  const noise = audio.createBufferSource();
  const noiseGain = audio.createGain();
  const filter = audio.createBiquadFilter();
  noise.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, start);
  noiseGain.gain.setValueAtTime(volume * 0.45, start);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, start + duration * 0.45);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audio.destination);
  noise.start(start);
  noise.stop(start + duration);
}

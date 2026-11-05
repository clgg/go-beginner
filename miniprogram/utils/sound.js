const files = require("./voice-manifest.js").files;
const base = "https://clgg.github.io/go-beginner/audio/voice/";
const storageKey = "go-beginner-sound";

let enabled = wx.getStorageSync(storageKey) !== "0";
let web = null;
let playToken = 0;
let current = null;

const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

function zhCount(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0 || n >= 100) return String(value);
  if (n < 10) return digits[n];
  if (n < 20) return `十${n === 10 ? "" : digits[n % 10]}`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${digits[tens]}十${ones ? digits[ones] : ""}`;
}

function isOn() {
  return enabled;
}

function setOn(next) {
  enabled = Boolean(next);
  wx.setStorageSync(storageKey, enabled ? "1" : "0");
  if (!enabled) stop();
}

function playTone(kind) {
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

function speak(text) {
  if (!enabled || !text) return;
  speakParts([text]);
}

function speakMove({ color, coord, liberties, captured }) {
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

function speakParts(parts) {
  speakFlexible([parts]);
}

function speakFlexible(groups) {
  speakClauses([groups]);
}

function speakClauses(clauses) {
  if (!enabled) return;
  const queue = [];
  clauses.forEach((options) => {
    const found = options
      .map((parts) => parts.filter(Boolean))
      .find((parts) => parts.length && parts.every((part) => files[part]));
    if (found) queue.push(...found);
  });
  if (!queue.length) return;
  playQueue(queue, ++playToken, 0);
}

function playQueue(queue, token, index) {
  if (token !== playToken || !enabled || index >= queue.length) return;
  if (current) {
    current.stop();
    current.destroy();
  }
  const audio = wx.createInnerAudioContext();
  current = audio;
  audio.obeyMuteSwitch = false;
  audio.src = `${base}${files[queue[index]]}?v=2`;
  audio.onEnded(() => playQueue(queue, token, index + 1));
  audio.onError(() => {
    if (token === playToken) playQueue(queue, token, index + 1);
  });
  audio.play();
}

function stop() {
  playToken += 1;
  if (current) {
    current.stop();
    current.destroy();
    current = null;
  }
}

function unlock() {
  if (!wx.createWebAudioContext) return null;
  if (!web) {
    try { web = wx.createWebAudioContext(); } catch (error) { web = null; }
  }
  if (web && web.state === "suspended" && web.resume) web.resume();
  return web;
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
}

module.exports = { isOn, setOn, playTone, speak, speakMove, speakParts, speakFlexible, speakClauses, zhCount, stop };

/**
 * sounds.js — Duolingo-style sound effects using Web Audio API.
 * All sounds are synthesized (no external files needed).
 * Supports a global mute toggle stored in localStorage.
 */

let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  // Resume if suspended (browsers require user gesture)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// --- Mute state ---
const MUTE_KEY = 'akka_muted'

export function isMuted() {
  return localStorage.getItem(MUTE_KEY) === 'true'
}

export function setMuted(muted) {
  localStorage.setItem(MUTE_KEY, muted ? 'true' : 'false')
}

export function toggleMute() {
  const next = !isMuted()
  setMuted(next)
  return next
}

// --- Helper: play a tone ---
function playTone(freq, duration, type = 'sine', volume = 0.3, delay = 0) {
  if (isMuted()) return
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = 0
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + duration + 0.05)
  } catch {
    // Silently fail if audio not available
  }
}

// --- Helper: play noise burst ---
function playNoise(duration, volume = 0.15, delay = 0) {
  if (isMuted()) return
  try {
    const ctx = getCtx()
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer

    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 800

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    source.start(ctx.currentTime + delay)
    source.stop(ctx.currentTime + delay + duration + 0.05)
  } catch {
    // Silently fail
  }
}

// ============================================================
// PUBLIC SOUND EFFECTS
// ============================================================

/** Correct answer — bright ascending ding ~0.3s */
export function playCorrect() {
  playTone(880, 0.15, 'sine', 0.25, 0)
  playTone(1175, 0.2, 'sine', 0.2, 0.08)
}

/** Wrong answer — low descending buzz ~0.3s */
export function playWrong() {
  playTone(220, 0.25, 'square', 0.12, 0)
  playTone(180, 0.25, 'square', 0.1, 0.08)
  playNoise(0.15, 0.08, 0)
}

/** Timer warning tick (3s) — rapid tick tick */
export function playTimerTick() {
  playTone(1000, 0.05, 'square', 0.15, 0)
}

/** Quiz complete — short positive melody ~1s */
export function playQuizComplete() {
  playTone(523, 0.15, 'sine', 0.2, 0)      // C5
  playTone(659, 0.15, 'sine', 0.2, 0.15)   // E5
  playTone(784, 0.15, 'sine', 0.2, 0.3)    // G5
  playTone(1047, 0.3, 'sine', 0.25, 0.45)  // C6
}

/** Perfect score 5/5 — fanfare celebration ~1.5s */
export function playPerfect() {
  playTone(523, 0.12, 'sine', 0.2, 0)       // C5
  playTone(659, 0.12, 'sine', 0.2, 0.1)     // E5
  playTone(784, 0.12, 'sine', 0.2, 0.2)     // G5
  playTone(1047, 0.2, 'sine', 0.25, 0.3)    // C6
  playTone(1175, 0.15, 'sine', 0.2, 0.5)    // D6
  playTone(1319, 0.35, 'sine', 0.25, 0.65)  // E6
  playTone(1047, 0.15, 'triangle', 0.15, 0.3)
  playTone(1319, 0.15, 'triangle', 0.15, 0.5)
  playTone(1568, 0.4, 'triangle', 0.12, 0.7)
}

/** Streak — fire whoosh sound */
export function playStreak() {
  if (isMuted()) return
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.value = 200
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3)
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.5)

    gain.gain.value = 0
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 600
    filter.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.15)
    filter.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.5)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.55)
  } catch {
    // Silently fail
  }
  playNoise(0.3, 0.06, 0)
}

/** Level up — epic ascending sound */
export function playLevelUp() {
  playTone(392, 0.15, 'sine', 0.2, 0)       // G4
  playTone(494, 0.15, 'sine', 0.2, 0.12)    // B4
  playTone(587, 0.15, 'sine', 0.2, 0.24)    // D5
  playTone(784, 0.2, 'sine', 0.25, 0.36)    // G5
  playTone(988, 0.2, 'sine', 0.2, 0.52)     // B5
  playTone(1175, 0.35, 'sine', 0.25, 0.68)  // D6
  // Harmony layer
  playTone(587, 0.3, 'triangle', 0.1, 0.36)
  playTone(784, 0.35, 'triangle', 0.1, 0.52)
}

/** Button tap — subtle click */
export function playTap() {
  playTone(600, 0.04, 'sine', 0.1, 0)
  playTone(800, 0.03, 'sine', 0.08, 0.01)
}

import type { LangCode } from '../types'
import { TTS_LANG } from './languages'

/** Prefer US English voices; avoid GB/AU when speaking English. */
const EN_US_NAME_HINTS = [
  'aria',
  'jenny',
  'guy',
  'sara',
  'michelle',
  'roger',
  'steffan',
  'zira',
  'mark',
  'david',
  'microsoft david',
  'microsoft zira',
  'google us english',
  'samantha',
  'alex',
  'en-us',
  'us english',
  'american',
]

const EN_AVOID_HINTS = ['en-gb', 'british', 'uk english', 'en-au', 'australian', 'en-in', 'indian']

let currentAudio: HTMLAudioElement | null = null
let currentObjectUrl: string | null = null

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function scoreVoice(voice: SpeechSynthesisVoice, preferredLang: string): number {
  const lang = normalize(voice.lang)
  const name = normalize(voice.name)
  const pref = normalize(preferredLang)
  const prefPrefix = pref.slice(0, 2)
  let score = 0

  if (lang === pref) score += 100
  else if (lang.startsWith(pref)) score += 80
  else if (lang.startsWith(prefPrefix)) score += 20
  else return -1

  if (pref.startsWith('en')) {
    if (lang === 'en-us' || lang.startsWith('en-us')) score += 50
    if (EN_US_NAME_HINTS.some((h) => name.includes(h.trim()) || lang.includes(h.trim()))) score += 30
    if (EN_AVOID_HINTS.some((h) => name.includes(h) || lang.includes(h))) score -= 80
  }

  if (voice.localService) score += 10
  if (voice.default) score += 5

  return score
}

function pickVoice(voices: SpeechSynthesisVoice[], preferredLang: string): SpeechSynthesisVoice | null {
  let best: SpeechSynthesisVoice | null = null
  let bestScore = -1
  for (const voice of voices) {
    const score = scoreVoice(voice, preferredLang)
    if (score > bestScore) {
      bestScore = score
      best = voice
    }
  }
  return bestScore >= 0 ? best : null
}

function getVoicesReady(): Promise<SpeechSynthesisVoice[]> {
  const existing = window.speechSynthesis.getVoices()
  if (existing.length) return Promise.resolve(existing)

  return new Promise((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', done)
      resolve(window.speechSynthesis.getVoices())
    }
    window.speechSynthesis.addEventListener('voiceschanged', done)
    window.setTimeout(done, 500)
  })
}

function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl)
    currentObjectUrl = null
  }
}

async function speakWithEdge(text: string, lang: LangCode): Promise<void> {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang }),
  })

  if (!res.ok) {
    let message = `语音服务失败 (${res.status})`
    try {
      const data = await res.json()
      if (data?.error) message = String(data.error)
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  const blob = await res.blob()
  if (!blob.size) throw new Error('未收到音频数据')

  stopAudio()
  const url = URL.createObjectURL(blob)
  currentObjectUrl = url
  const audio = new Audio(url)
  currentAudio = audio

  await new Promise<void>((resolve, reject) => {
    audio.onended = () => resolve()
    audio.onerror = () => reject(new Error('音频播放失败'))
    audio.play().catch(reject)
  })
}

async function speakWithSystem(text: string, lang: LangCode): Promise<void> {
  if (!window.speechSynthesis) {
    throw new Error('当前环境不支持语音合成')
  }

  window.speechSynthesis.cancel()

  const preferredLang = TTS_LANG[lang]
  const voices = await getVoicesReady()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = preferredLang
  utter.rate = 0.95

  const matched = pickVoice(voices, preferredLang)
  if (matched) {
    utter.voice = matched
    utter.lang = matched.lang || preferredLang
  }

  await new Promise<void>((resolve, reject) => {
    utter.onend = () => resolve()
    utter.onerror = () => reject(new Error('系统朗读失败'))
    window.speechSynthesis.speak(utter)
  })
}

/** Prefer Edge neural TTS (e.g. en-US-JennyNeural); fall back to system voices. */
export async function speakText(text: string, lang: LangCode): Promise<void> {
  if (!text.trim()) return
  stopSpeaking()

  try {
    await speakWithEdge(text, lang)
  } catch (edgeErr) {
    console.warn('[tts] Edge TTS unavailable, fallback to system:', edgeErr)
    await speakWithSystem(text, lang)
  }
}

export function stopSpeaking(): void {
  stopAudio()
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

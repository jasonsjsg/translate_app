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

  // Prefer local / default higher-quality voices when tied
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
    // Fallback if event never fires
    window.setTimeout(done, 500)
  })
}

export async function speakText(text: string, lang: LangCode): Promise<void> {
  if (!text.trim()) return
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    throw new Error('当前浏览器不支持语音合成')
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

  window.speechSynthesis.speak(utter)
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

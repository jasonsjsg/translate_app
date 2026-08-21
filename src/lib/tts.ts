import type { LangCode } from '../types'
import { TTS_LANG } from './languages'

export function speakText(text: string, lang: LangCode): void {
  if (!text.trim()) return
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    throw new Error('当前浏览器不支持语音合成')
  }

  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = TTS_LANG[lang]
  utter.rate = 0.95

  const voices = window.speechSynthesis.getVoices()
  const matched = voices.find((v) => v.lang.toLowerCase().startsWith(utter.lang.toLowerCase().slice(0, 2)))
  if (matched) utter.voice = matched

  window.speechSynthesis.speak(utter)
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

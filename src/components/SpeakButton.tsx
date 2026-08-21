import { useState } from 'react'
import type { LangCode } from '../types'
import { speakText, stopSpeaking } from '../lib/tts'

interface Props {
  text: string
  lang: LangCode
  className?: string
}

export function SpeakButton({ text, lang, className = '' }: Props) {
  const [busy, setBusy] = useState(false)

  const onSpeak = async () => {
    try {
      setBusy(true)
      await speakText(text, lang)
      window.setTimeout(() => setBusy(false), Math.min(8000, Math.max(1200, text.length * 80)))
    } catch (err) {
      setBusy(false)
      alert(err instanceof Error ? err.message : '发音失败')
    }
  }

  return (
    <button
      type="button"
      className={`btn-ghost ${className}`}
      onClick={onSpeak}
      onDoubleClick={() => stopSpeaking()}
      title="点击朗读，双击停止"
      disabled={!text.trim()}
    >
      {busy ? '朗读中…' : '🔊 发音'}
    </button>
  )
}

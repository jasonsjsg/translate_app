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
    if (busy) {
      stopSpeaking()
      setBusy(false)
      return
    }
    try {
      setBusy(true)
      await speakText(text, lang)
    } catch (err) {
      alert(err instanceof Error ? err.message : '发音失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      className={`btn-ghost ${className}`}
      onClick={onSpeak}
      onDoubleClick={() => {
        stopSpeaking()
        setBusy(false)
      }}
      title="点击朗读（Edge 美式神经网络），再次点击或双击停止"
      disabled={!text.trim()}
    >
      {busy ? '朗读中…' : '🔊 发音'}
    </button>
  )
}

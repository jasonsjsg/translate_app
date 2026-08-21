import fs from 'fs'
import os from 'os'
import path from 'path'
import { EdgeTTS } from 'node-edge-tts'
import { randomUUID } from 'crypto'

/** Neural voices (Edge). English defaults to US. */
export const EDGE_VOICES = {
  zh: { voice: 'zh-CN-XiaoxiaoNeural', lang: 'zh-CN' },
  en: { voice: 'en-US-JennyNeural', lang: 'en-US' },
  de: { voice: 'de-DE-KatjaNeural', lang: 'de-DE' },
  fr: { voice: 'fr-FR-DeniseNeural', lang: 'fr-FR' },
  ja: { voice: 'ja-JP-NanamiNeural', lang: 'ja-JP' },
  ko: { voice: 'ko-KR-SunHiNeural', lang: 'ko-KR' },
  ru: { voice: 'ru-RU-SvetlanaNeural', lang: 'ru-RU' },
}

/**
 * @param {string} text
 * @param {keyof typeof EDGE_VOICES} lang
 * @returns {Promise<Buffer>}
 */
export async function synthesizeEdgeMp3(text, lang) {
  const trimmed = String(text || '').trim()
  if (!trimmed) throw new Error('朗读文本为空')
  if (trimmed.length > 2000) throw new Error('朗读文本过长（最多 2000 字）')

  const cfg = EDGE_VOICES[lang] || EDGE_VOICES.en
  const outPath = path.join(os.tmpdir(), `translate-tts-${randomUUID()}.mp3`)

  const tts = new EdgeTTS({
    voice: cfg.voice,
    lang: cfg.lang,
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
    timeout: 25000,
  })

  try {
    await tts.ttsPromise(trimmed, outPath)
    const buf = fs.readFileSync(outPath)
    if (!buf?.length) throw new Error('未生成音频')
    return buf
  } finally {
    try {
      fs.unlinkSync(outPath)
    } catch {
      /* ignore */
    }
  }
}

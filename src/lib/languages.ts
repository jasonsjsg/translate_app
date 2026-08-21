import type { LangCode, TranslateStyle } from '../types'

export const LANGUAGES: Array<{ code: LangCode; label: string; native: string }> = [
  { code: 'zh', label: '中文', native: '中文' },
  { code: 'en', label: '英语', native: 'English' },
  { code: 'de', label: '德语', native: 'Deutsch' },
  { code: 'fr', label: '法语', native: 'Français' },
  { code: 'ja', label: '日语', native: '日本語' },
  { code: 'ko', label: '韩语', native: '한국어' },
  { code: 'ru', label: '俄语', native: 'Русский' },
]

export const STYLE_OPTIONS: Array<{ value: TranslateStyle; label: string; hint: string }> = [
  { value: 'literal', label: '直译', hint: '尽量贴近原文结构' },
  { value: 'sense', label: '意译', hint: '自然达意（默认）' },
  { value: 'colloquial', label: '口语', hint: '日常对话口吻' },
  { value: 'formal', label: '书面', hint: '正式书面表达' },
  { value: 'technical', label: '专业', hint: '术语与专业语境' },
]

export const TTS_LANG: Record<LangCode, string> = {
  zh: 'zh-CN',
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ru: 'ru-RU',
}

export const PHONETIC_HINT: Record<Exclude<LangCode, 'zh'>, string> = {
  en: 'IPA',
  de: 'IPA',
  fr: 'IPA',
  ja: '假名 / 罗马音',
  ko: '罗马音',
  ru: 'IPA / 转写',
}

export function langLabel(code: LangCode | 'auto'): string {
  if (code === 'auto') return '自动检测'
  return LANGUAGES.find((l) => l.code === code)?.label ?? code
}

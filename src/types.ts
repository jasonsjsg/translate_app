export type LangCode = 'zh' | 'en' | 'de' | 'fr' | 'ja' | 'ko' | 'ru'

export type TranslateStyle =
  | 'literal'
  | 'sense'
  | 'colloquial'
  | 'formal'
  | 'technical'

export type ProviderKind =
  | 'openai'
  | 'deepseek'
  | 'qwen'
  | 'zhipu'
  | 'ollama'
  | 'custom'

export interface LlmProfile {
  id: string
  name: string
  provider: ProviderKind
  baseUrl: string
  apiKey: string
  model: string
  enabled: boolean
}

export interface AppSettings {
  /** 'auto' or a profile id */
  selectedModel: 'auto' | string
  profiles: LlmProfile[]
}

export interface TranslateRequest {
  text: string
  sourceLang: LangCode | 'auto'
  targetLang: LangCode
  style: TranslateStyle
  selectedModel: 'auto' | string
  profiles: LlmProfile[]
}

export interface TranslateResult {
  translation: string
  phonetic: string | null
  phoneticLabel: string | null
  alternatives: string[]
  examples: Array<{ source: string; target: string }>
  pos: string | null
  detectedSourceLang: LangCode
  style: TranslateStyle
  modelUsed: string
  providerUsed: string
}

export interface TranslateResponse {
  ok: true
  data: TranslateResult
}

export interface TranslateErrorResponse {
  ok: false
  error: string
}

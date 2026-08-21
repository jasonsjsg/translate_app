import type { AppSettings, LlmProfile, ProviderKind } from '../types'

const STORAGE_KEY = 'translate_app_settings_v1'

export const PROVIDER_PRESETS: Record<
  ProviderKind,
  { label: string; baseUrl: string; model: string; needsKey: boolean }
> = {
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    needsKey: true,
  },
  deepseek: {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    needsKey: true,
  },
  qwen: {
    label: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    needsKey: true,
  },
  zhipu: {
    label: '智谱',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    needsKey: true,
  },
  ollama: {
    label: 'Ollama 本地',
    baseUrl: 'http://127.0.0.1:11434/v1',
    model: 'llama3.2',
    needsKey: false,
  },
  custom: {
    label: '自定义 OpenAI 兼容',
    baseUrl: 'https://api.example.com/v1',
    model: 'gpt-4o-mini',
    needsKey: true,
  },
}

export function createDefaultProfiles(): LlmProfile[] {
  return (Object.keys(PROVIDER_PRESETS) as ProviderKind[]).map((provider) => {
    const preset = PROVIDER_PRESETS[provider]
    return {
      id: `preset-${provider}`,
      name: preset.label,
      provider,
      baseUrl: preset.baseUrl,
      apiKey: '',
      model: preset.model,
      enabled: false,
    }
  })
}

export function defaultSettings(): AppSettings {
  return {
    selectedModel: 'auto',
    profiles: createDefaultProfiles(),
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSettings()
    const parsed = JSON.parse(raw) as AppSettings
    if (!parsed.profiles?.length) return defaultSettings()
    return {
      selectedModel: parsed.selectedModel || 'auto',
      profiles: parsed.profiles,
    }
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function isProfileReady(profile: LlmProfile): boolean {
  if (!profile.enabled) return false
  if (!profile.baseUrl.trim() || !profile.model.trim()) return false
  const needsKey = PROVIDER_PRESETS[profile.provider]?.needsKey ?? true
  if (needsKey && !profile.apiKey.trim()) return false
  return true
}

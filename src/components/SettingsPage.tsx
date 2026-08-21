import { useMemo, useState } from 'react'
import type { AppSettings, LlmProfile, ProviderKind } from '../types'
import { PROVIDER_PRESETS, isProfileReady, saveSettings } from '../lib/storage'

interface Props {
  settings: AppSettings
  onChange: (next: AppSettings) => void
  onBack: () => void
}

export function SettingsPage({ settings, onChange, onBack }: Props) {
  const [draft, setDraft] = useState<AppSettings>(settings)
  const [saved, setSaved] = useState(false)

  const readyCount = useMemo(
    () => draft.profiles.filter(isProfileReady).length,
    [draft.profiles],
  )

  const updateProfile = (id: string, patch: Partial<LlmProfile>) => {
    setDraft((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
    setSaved(false)
  }

  const applyProviderPreset = (id: string, provider: ProviderKind) => {
    const preset = PROVIDER_PRESETS[provider]
    updateProfile(id, {
      provider,
      name: preset.label,
      baseUrl: preset.baseUrl,
      model: preset.model,
    })
  }

  const onSave = () => {
    saveSettings(draft)
    onChange(draft)
    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">模型设置</h1>
          <p className="mt-1 text-sm text-ink-500">
            支持 OpenAI 兼容接口。当前可用配置：{readyCount} 个。「自动」会按优先级选用已就绪模型。
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={onBack}>
          ← 返回翻译
        </button>
      </div>

      <div className="panel space-y-3 p-5">
        <label className="flex flex-col gap-1 text-sm text-ink-700">
          默认模型选择
          <select
            className="select"
            value={draft.selectedModel}
            onChange={(e) => {
              setDraft((prev) => ({ ...prev, selectedModel: e.target.value }))
              setSaved(false)
            }}
          >
            <option value="auto">自动</option>
            {draft.profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.model || '未填模型'})
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-ink-500">
          自动优先级：DeepSeek → 通义 → 智谱 → OpenAI → 自定义 → Ollama
        </p>
      </div>

      <div className="space-y-4">
        {draft.profiles.map((profile) => {
          const ready = isProfileReady(profile)
          return (
            <div key={profile.id} className="panel space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-ink-900">{profile.name}</h2>
                  <span className={`tag ${ready ? 'bg-emerald-50 text-emerald-700' : ''}`}>
                    {ready ? '可用' : '未就绪'}
                  </span>
                </div>
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={profile.enabled}
                    onChange={(e) => updateProfile(profile.id, { enabled: e.target.checked })}
                  />
                  启用
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-ink-500">
                  提供商
                  <select
                    className="select"
                    value={profile.provider}
                    onChange={(e) =>
                      applyProviderPreset(profile.id, e.target.value as ProviderKind)
                    }
                  >
                    {(Object.keys(PROVIDER_PRESETS) as ProviderKind[]).map((key) => (
                      <option key={key} value={key}>
                        {PROVIDER_PRESETS[key].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-500">
                  显示名称
                  <input
                    className="input"
                    value={profile.name}
                    onChange={(e) => updateProfile(profile.id, { name: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-500 md:col-span-2">
                  API Base URL
                  <input
                    className="input"
                    value={profile.baseUrl}
                    onChange={(e) => updateProfile(profile.id, { baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-500">
                  模型名
                  <input
                    className="input"
                    value={profile.model}
                    onChange={(e) => updateProfile(profile.id, { model: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-500">
                  API Key {profile.provider === 'ollama' ? '（可选）' : ''}
                  <input
                    className="input"
                    type="password"
                    value={profile.apiKey}
                    onChange={(e) => updateProfile(profile.id, { apiKey: e.target.value })}
                    placeholder={profile.provider === 'ollama' ? '本地可留空' : 'sk-...'}
                    autoComplete="off"
                  />
                </label>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="btn-primary" onClick={onSave}>
          保存设置
        </button>
        {saved && <span className="text-sm text-emerald-700">已保存到本机</span>}
      </div>
    </div>
  )
}

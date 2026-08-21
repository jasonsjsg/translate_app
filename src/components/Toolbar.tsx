import type { LangCode, TranslateStyle } from '../types'
import { LANGUAGES, STYLE_OPTIONS, langLabel } from '../lib/languages'

interface Props {
  sourceLang: LangCode | 'auto'
  targetLang: LangCode
  style: TranslateStyle
  selectedModel: string
  modelOptions: Array<{ value: string; label: string }>
  onSourceChange: (v: LangCode | 'auto') => void
  onTargetChange: (v: LangCode) => void
  onStyleChange: (v: TranslateStyle) => void
  onModelChange: (v: string) => void
  onSwap: () => void
}

export function Toolbar({
  sourceLang,
  targetLang,
  style,
  selectedModel,
  modelOptions,
  onSourceChange,
  onTargetChange,
  onStyleChange,
  onModelChange,
  onSwap,
}: Props) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-ink-500">
          源语言
          <select
            className="select"
            value={sourceLang}
            onChange={(e) => onSourceChange(e.target.value as LangCode | 'auto')}
          >
            <option value="auto">自动检测</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="btn-ghost mt-5" onClick={onSwap} title="互换语言">
          ⇄
        </button>

        <label className="flex flex-col gap-1 text-xs text-ink-500">
          目标语言
          <select
            className="select"
            value={targetLang}
            onChange={(e) => onTargetChange(e.target.value as LangCode)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label} · {l.native}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-500">
          翻译程度
          <select
            className="select"
            value={style}
            onChange={(e) => onStyleChange(e.target.value as TranslateStyle)}
          >
            {STYLE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label} — {s.hint}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-ink-500">
          大模型
          <select
            className="select min-w-[12rem]"
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
          >
            <option value="auto">自动</option>
            {modelOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <div className="pb-2 text-xs text-ink-500">
          {langLabel(sourceLang)} → {langLabel(targetLang)}
        </div>
      </div>
    </div>
  )
}

import type { TranslateResult, TranslateStyle, LangCode } from '../types'
import { STYLE_OPTIONS } from '../lib/languages'
import { SpeakButton } from './SpeakButton'

interface Props {
  result: TranslateResult | null
  targetLang: LangCode
  loading: boolean
  error: string | null
}

function styleLabel(style: TranslateStyle) {
  return STYLE_OPTIONS.find((s) => s.value === style)?.label ?? style
}

export function ResultCard({ result, targetLang, loading, error }: Props) {
  if (loading) {
    return (
      <div className="panel min-h-[22rem] animate-pulse p-6 text-ink-500">正在翻译…</div>
    )
  }

  if (error) {
    return (
      <div className="panel min-h-[22rem] border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    )
  }

  if (!result) {
    return (
      <div className="panel flex min-h-[22rem] items-center justify-center p-6 text-ink-500">
        译文将显示在这里
      </div>
    )
  }

  const showPhonetic = targetLang !== 'zh' && result.phonetic

  return (
    <div className="panel min-h-[22rem] space-y-5 p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <span className="tag">{styleLabel(result.style)}</span>
        {result.pos && <span className="tag">{result.pos}</span>}
        <span className="tag">
          {result.providerUsed} · {result.modelUsed}
        </span>
      </div>

      <div>
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="text-2xl font-semibold leading-snug text-ink-900">{result.translation}</h2>
          <SpeakButton text={result.translation} lang={targetLang} />
        </div>
        {showPhonetic && (
          <p className="font-mono text-sm text-brand-700">
            <span className="mr-2 text-ink-500">{result.phoneticLabel || '音标'}</span>
            {result.phonetic}
          </p>
        )}
      </div>

      {result.alternatives.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-medium text-ink-700">其他译法</h3>
          <ul className="space-y-1 text-sm text-ink-700">
            {result.alternatives.map((alt) => (
              <li key={alt} className="rounded-md bg-ink-50 px-3 py-2">
                {alt}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.examples.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-medium text-ink-700">例句</h3>
          <ul className="space-y-3">
            {result.examples.map((ex) => (
              <li key={`${ex.source}-${ex.target}`} className="rounded-md border border-ink-100 p-3">
                <p className="text-sm text-ink-900">{ex.source}</p>
                <p className="mt-1 text-sm text-brand-700">{ex.target}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

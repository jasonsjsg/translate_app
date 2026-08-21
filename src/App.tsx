import { useMemo, useState } from 'react'
import type { AppSettings, LangCode, TranslateResult, TranslateStyle } from './types'
import { translateText } from './lib/api'
import { isProfileReady, loadSettings, saveSettings } from './lib/storage'
import { Toolbar } from './components/Toolbar'
import { ResultCard } from './components/ResultCard'
import { SettingsPage } from './components/SettingsPage'

type View = 'translate' | 'settings'

export default function App() {
  const [view, setView] = useState<View>('translate')
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [sourceLang, setSourceLang] = useState<LangCode | 'auto'>('auto')
  const [targetLang, setTargetLang] = useState<LangCode>('en')
  const [style, setStyle] = useState<TranslateStyle>('sense')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TranslateResult | null>(null)

  const modelOptions = useMemo(
    () =>
      settings.profiles.map((p) => ({
        value: p.id,
        label: `${p.name}${isProfileReady(p) ? '' : '（未就绪）'}`,
      })),
    [settings.profiles],
  )

  const onSwap = () => {
    if (sourceLang === 'auto') {
      setSourceLang(targetLang)
      setTargetLang('zh')
      return
    }
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
  }

  const onTranslate = async () => {
    if (!text.trim()) {
      setError('请输入要翻译的文本')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await translateText({
        text: text.trim(),
        sourceLang,
        targetLang,
        style,
        selectedModel: settings.selectedModel,
        profiles: settings.profiles,
      })
      setResult(data)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : '翻译失败')
    } finally {
      setLoading(false)
    }
  }

  const onSettingsChange = (next: AppSettings) => {
    setSettings(next)
    saveSettings(next)
  }

  if (view === 'settings') {
    return (
      <div className="app-shell">
        <SettingsPage
          settings={settings}
          onChange={onSettingsChange}
          onBack={() => setView('translate')}
        />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="border-b border-ink-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink-900">多语言翻译</h1>
            <p className="text-xs text-ink-500">中英德法日韩俄 · 有道式结果 · 可配大模型</p>
          </div>
          <button type="button" className="btn-ghost" onClick={() => setView('settings')}>
            设置
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <Toolbar
          sourceLang={sourceLang}
          targetLang={targetLang}
          style={style}
          selectedModel={settings.selectedModel}
          modelOptions={modelOptions}
          onSourceChange={setSourceLang}
          onTargetChange={setTargetLang}
          onStyleChange={setStyle}
          onModelChange={(v) => {
            const next = { ...settings, selectedModel: v }
            setSettings(next)
            saveSettings(next)
          }}
          onSwap={onSwap}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="panel flex min-h-[22rem] flex-col p-4">
            <textarea
              className="min-h-[16rem] flex-1 resize-none border-0 bg-transparent text-base text-ink-900 outline-none placeholder:text-ink-500"
              placeholder="输入要翻译的文本…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault()
                  void onTranslate()
                }
              }}
            />
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink-100 pt-3">
              <span className="text-xs text-ink-500">Ctrl + Enter 翻译</span>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost" onClick={() => setText('')}>
                  清空
                </button>
                <button type="button" className="btn-primary" onClick={() => void onTranslate()} disabled={loading}>
                  {loading ? '翻译中…' : '翻译'}
                </button>
              </div>
            </div>
          </section>

          <ResultCard result={result} targetLang={targetLang} loading={loading} error={error} />
        </div>
      </main>
    </div>
  )
}

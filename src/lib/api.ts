import type { TranslateRequest, TranslateResult } from '../types'

export async function translateText(payload: TranslateRequest): Promise<TranslateResult> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `翻译失败 (${res.status})`)
  }
  return data.data as TranslateResult
}

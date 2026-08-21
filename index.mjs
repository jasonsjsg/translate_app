import cors from 'cors'
import express from 'express'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_PORT = Number(process.env.PORT || 8787)

const LANGS = ['zh', 'en', 'de', 'fr', 'ja', 'ko', 'ru']

const STYLE_PROMPTS = {
  literal: '直译：尽量保留原文语序与结构，准确对应词汇。',
  sense: '意译：自然流畅，符合目标语表达习惯。',
  colloquial: '口语：日常对话口吻，可适度省略与口语化。',
  formal: '书面：正式、得体，适合公文或书面场景。',
  technical: '专业：使用领域术语，保持精确与一致。',
}

const LANG_NAMES = {
  zh: '中文',
  en: '英语',
  de: '德语',
  fr: '法语',
  ja: '日语',
  ko: '韩语',
  ru: '俄语',
}

const PHONETIC_RULES = {
  en: '给出国际音标 IPA，例如 /həˈləʊ/',
  de: '给出国际音标 IPA',
  fr: '给出国际音标 IPA',
  ja: '给出假名读音，并附 Hepburn 罗马音，格式如：こんにちは (konnichiwa)',
  ko: '给出修订版罗马音，例如 annyeonghaseyo',
  ru: '给出国际音标或拉丁转写',
}

const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  baseUrl: z.string(),
  apiKey: z.string(),
  model: z.string(),
  enabled: z.boolean(),
})

const requestSchema = z.object({
  text: z.string().min(1).max(8000),
  sourceLang: z.enum(['auto', 'zh', 'en', 'de', 'fr', 'ja', 'ko', 'ru']),
  targetLang: z.enum(['zh', 'en', 'de', 'fr', 'ja', 'ko', 'ru']),
  style: z.enum(['literal', 'sense', 'colloquial', 'formal', 'technical']),
  selectedModel: z.string(),
  profiles: z.array(profileSchema).min(1),
})

function needsApiKey(provider) {
  return provider !== 'ollama'
}

function isReady(profile) {
  if (!profile.enabled) return false
  if (!profile.baseUrl?.trim() || !profile.model?.trim()) return false
  if (needsApiKey(profile.provider) && !profile.apiKey?.trim()) return false
  return true
}

/** Auto: prefer cloud providers with keys, then ollama */
function resolveProfile(selectedModel, profiles) {
  const ready = profiles.filter(isReady)
  if (!ready.length) {
    throw new Error('没有可用的大模型配置。请到「设置」填写 API Key，或启用 Ollama 本地模型。')
  }

  if (selectedModel && selectedModel !== 'auto') {
    const hit = ready.find((p) => p.id === selectedModel)
    if (!hit) {
      throw new Error('所选模型未配置或不可用，请检查设置，或改用「自动」。')
    }
    return hit
  }

  const priority = ['deepseek', 'qwen', 'zhipu', 'openai', 'custom', 'ollama']
  for (const provider of priority) {
    const hit = ready.find((p) => p.provider === provider)
    if (hit) return hit
  }
  return ready[0]
}

function detectLang(text) {
  if (/[\u3040-\u30ff]/.test(text)) return 'ja'
  if (/[\uac00-\ud7af]/.test(text)) return 'ko'
  if (/[\u0400-\u04ff]/.test(text)) return 'ru'
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh'
  if (/[äöüß]/i.test(text)) return 'de'
  if (/[àâçéèêëîïôùûüÿœæ]/i.test(text)) return 'fr'
  return 'en'
}

function extractJson(content) {
  const trimmed = content.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('模型返回不是有效 JSON')
    return JSON.parse(match[0])
  }
}

async function callChat(profile, messages) {
  const url = `${profile.baseUrl.replace(/\/$/, '')}/chat/completions`
  const headers = {
    'Content-Type': 'application/json',
  }
  if (profile.apiKey?.trim()) {
    headers.Authorization = `Bearer ${profile.apiKey.trim()}`
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: profile.model,
      temperature: 0.3,
      messages,
    }),
  })

  const raw = await res.text()
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error(`模型接口返回非 JSON（HTTP ${res.status}）`)
  }

  if (!res.ok) {
    const msg = data?.error?.message || data?.message || raw.slice(0, 200)
    throw new Error(`模型调用失败：${msg}`)
  }

  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('模型未返回内容')
  return content
}

function buildPrompt({ text, sourceLang, targetLang, style }) {
  const needPhonetic = targetLang !== 'zh'
  const phoneticRule = needPhonetic
    ? `phonetic 字段必填：${PHONETIC_RULES[targetLang]}；phoneticLabel 填写音标类型名。`
    : '目标语是中文：phonetic 与 phoneticLabel 必须为 null。'

  return `你是专业多语言翻译助手，输出必须是严格 JSON，不要 markdown。

任务：将文本从「${LANG_NAMES[sourceLang] || sourceLang}」翻译到「${LANG_NAMES[targetLang]}」。
翻译程度：${STYLE_PROMPTS[style]}

要求：
1. translation：主译文
2. alternatives：另外 2 个可选译法（数组，可少于 2）
3. examples：1～2 条例句，每项含 source（源语）与 target（目标语）
4. pos：若原文是单词/短语则给词性（如 n. / v.），否则 null
5. ${phoneticRule}
6. detectedSourceLang：检测到的源语言代码（${LANGS.join('/')}）

只返回 JSON：
{
  "translation": "",
  "phonetic": null,
  "phoneticLabel": null,
  "alternatives": [],
  "examples": [{"source":"","target":""}],
  "pos": null,
  "detectedSourceLang": ""
}

待译文本：
"""
${text}
"""`
}

function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'translate_app' })
  })

  app.post('/api/translate', async (req, res) => {
    try {
      const parsed = requestSchema.parse(req.body)
      const sourceLang =
        parsed.sourceLang === 'auto' ? detectLang(parsed.text) : parsed.sourceLang

      if (sourceLang === parsed.targetLang) {
        return res.status(400).json({ ok: false, error: '源语言与目标语言相同' })
      }

      const profile = resolveProfile(parsed.selectedModel, parsed.profiles)
      const content = await callChat(profile, [
        {
          role: 'system',
          content: '你是严谨的翻译引擎，只输出合法 JSON。',
        },
        {
          role: 'user',
          content: buildPrompt({
            text: parsed.text,
            sourceLang,
            targetLang: parsed.targetLang,
            style: parsed.style,
          }),
        },
      ])

      const json = extractJson(content)
      const translation = String(json.translation || '').trim()
      if (!translation) throw new Error('译文为空')

      const needPhonetic = parsed.targetLang !== 'zh'
      const phonetic = needPhonetic ? (json.phonetic ? String(json.phonetic) : null) : null
      const phoneticLabel = needPhonetic
        ? json.phoneticLabel
          ? String(json.phoneticLabel)
          : PHONETIC_RULES[parsed.targetLang]?.split('：')[0] || '音标'
        : null

      res.json({
        ok: true,
        data: {
          translation,
          phonetic,
          phoneticLabel,
          alternatives: Array.isArray(json.alternatives)
            ? json.alternatives.map(String).filter(Boolean).slice(0, 3)
            : [],
          examples: Array.isArray(json.examples)
            ? json.examples
                .map((ex) => ({
                  source: String(ex?.source || ''),
                  target: String(ex?.target || ''),
                }))
                .filter((ex) => ex.source && ex.target)
                .slice(0, 2)
            : [],
          pos: json.pos ? String(json.pos) : null,
          detectedSourceLang: LANGS.includes(json.detectedSourceLang)
            ? json.detectedSourceLang
            : sourceLang,
          style: parsed.style,
          modelUsed: profile.model,
          providerUsed: profile.name || profile.provider,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const status = message.includes('没有可用') || message.includes('所选模型') ? 400 : 500
      res.status(status).json({ ok: false, error: message })
    }
  })

  if (process.env.SERVE_STATIC === '1') {
    const staticDir = process.env.STATIC_DIR
      ? path.resolve(process.env.STATIC_DIR)
      : path.join(__dirname, '..', 'dist')

    if (fs.existsSync(staticDir)) {
      app.use(express.static(staticDir))
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next()
        res.sendFile(path.join(staticDir, 'index.html'))
      })
    } else {
      console.warn(`[translate_app] STATIC_DIR not found: ${staticDir}`)
    }
  }

  return app
}

function listen(app, port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, '127.0.0.1', () => {
      const address = server.address()
      const actualPort = typeof address === 'object' && address ? address.port : port
      console.log(`[translate_app] API http://127.0.0.1:${actualPort}`)
      resolve({ server, port: actualPort })
    })
    server.on('error', reject)
  })
}

export async function startServer(preferredPort = DEFAULT_PORT) {
  const app = createApp()
  const candidates = [preferredPort, preferredPort + 1, preferredPort + 2, 0]

  let lastError
  for (const port of candidates) {
    try {
      return await listen(app, port)
    } catch (err) {
      lastError = err
      if (err?.code !== 'EADDRINUSE') throw err
    }
  }
  throw lastError || new Error('无法启动本地服务')
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  startServer().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

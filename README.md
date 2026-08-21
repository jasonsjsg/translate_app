# 多语言翻译 Agent

中 / 英 / 德 / 法 / 日 / 韩 / 俄 互译，参考有道词典结果结构。目标语非中文时展示音标并支持浏览器朗读。大模型可配置，默认「自动」选择。

## 功能

- 翻译程度：直译 / 意译 / 口语 / 书面 / 专业
- 结果：主译文、音标、发音、其他译法、例句、词性
- 大模型：自动 / OpenAI / DeepSeek / 通义 / 智谱 / Ollama / 自定义
- 密钥保存在浏览器 `localStorage`，不会写入仓库

## 环境要求

- Node.js **16.20+**（推荐 18+）
- 至少一个可用的 OpenAI 兼容 API，或本机 Ollama

## 启动

```bash
cd D:\translate_app
npm install
npm run dev
```

- 前端：http://127.0.0.1:5173
- API：http://127.0.0.1:8787

仅启动 API：

```bash
npm run server
```

## 使用步骤

1. 打开页面 → **设置**
2. 填写某一提供商的 API Key（或启用 Ollama）
3. 保存后返回，选择语言与翻译程度，点击翻译
4. 非中文译文可点 **🔊 发音**（浏览器 TTS）

## Cursor Skill

项目内置 Skill：`.cursor/skills/translate/SKILL.md`  
在 Cursor 中可自然语言请求翻译（需本地 API 已启动）。

## API

`POST /api/translate`

```json
{
  "text": "你好",
  "sourceLang": "auto",
  "targetLang": "en",
  "style": "sense",
  "selectedModel": "auto",
  "profiles": []
}
```

`profiles` 由前端设置页组装并随请求发送。

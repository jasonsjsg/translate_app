---
name: translate
description: >-
  多语言翻译助手（中英德法日韩俄）。在用户要求翻译、标注音标、改翻译程度
  （直译/意译/口语/书面/专业），或配置/切换大模型（含自动）时使用。
  调用本地 translate_app API：http://127.0.0.1:8787/api/translate。
---

# 多语言翻译 Skill
test
## 何时使用

- 用户要求把文本翻译成中/英/德/法/日/韩/俄
- 需要音标、罗马音、假名或朗读说明
- 指定翻译程度：直译、意译、口语、书面、专业
- 询问如何配置大模型或「自动」选型

## 前置条件

1. 仓库 `D:\translate_app` 已 `npm run dev` 或 `npm run server`
2. 用户在 Web 设置页配置过 API，或本机有 Ollama

若 API 未启动，先提示用户执行 `npm run server`。

## 调用方式

向 `http://127.0.0.1:8787/api/translate` 发送 POST JSON：

```json
{
  "text": "<原文>",
  "sourceLang": "auto",
  "targetLang": "en",
  "style": "sense",
  "selectedModel": "auto",
  "profiles": []
}
```

注意：`profiles` 若为空，服务端无法解析用户密钥。优先引导用户打开 http://127.0.0.1:5173 的设置页配置；或让用户提供一份已启用的 profile JSON。

### style 映射

| 用户说法 | style |
|---------|-------|
| 直译 | `literal` |
| 意译 / 默认 | `sense` |
| 口语 | `colloquial` |
| 书面 | `formal` |
| 专业 / 术语 | `technical` |

### 目标语非中文时

在回复中展示：

1. 译文
2. `phonetic` / `phoneticLabel`
3. 提示可在网页点击发音（浏览器 TTS）
4. 其他译法与例句（若有）

## 回复格式（中文）

```
译文：...
音标：...（非中文时）
程度：意译
模型：DeepSeek · deepseek-chat

其他译法：
- ...

例句：
- 源：...
  译：...
```

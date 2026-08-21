import { app, BrowserWindow, dialog, shell } from 'electron'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow = null
let httpServer = null

function resolveServerEntry() {
  return path.join(__dirname, '..', 'server', 'index.mjs')
}

async function startApi() {
  process.env.ELECTRON = '1'
  const preferredPort = Number(process.env.PORT || 8787)

  // Packaged app always embeds Express API + built UI on localhost.
  if (app.isPackaged) {
    process.env.SERVE_STATIC = '1'
    process.env.STATIC_DIR = path.join(app.getAppPath(), 'dist')
  } else if (process.env.VITE_DEV_SERVER) {
    process.env.SERVE_STATIC = '0'
  } else {
    process.env.SERVE_STATIC = '1'
    process.env.STATIC_DIR = path.join(__dirname, '..', 'dist')
  }

  const serverUrl = pathToFileURL(resolveServerEntry()).href
  const { startServer } = await import(serverUrl)
  const started = await startServer(preferredPort)
  httpServer = started.server
  return started.port
}

async function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 780,
    minWidth: 880,
    minHeight: 600,
    title: '多语言翻译',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  const devServer = process.env.VITE_DEV_SERVER
  if (!app.isPackaged && devServer) {
    await mainWindow.loadURL(devServer)
  } else {
    await mainWindow.loadURL(`http://127.0.0.1:${port}`)
  }
}

app.whenReady().then(async () => {
  try {
    const port = await startApi()
    await createWindow(port)
  } catch (err) {
    console.error('Failed to start app:', err)
    dialog.showErrorBox(
      '启动失败',
      `内置翻译服务未能启动。\n\n${err instanceof Error ? err.message : String(err)}\n\n请确认本机端口 8787～8789 未被占用后重试。`,
    )
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }
})

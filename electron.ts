import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import * as isDev from 'electron-is-dev'
import * as path from 'path'
import * as fs from 'fs';

const ffmpeg = require('fluent-ffmpeg');

// 1. GC가 일어나지 않도록 밖에 빼줌
let main_window: BrowserWindow

function create_window() {
  main_window = new BrowserWindow({
    width: 800,
    height: 600,
    transparent: true,
    // 이것들은 제가 사용하는 설정이니 각자 알아서 설정 하십시오.
    alwaysOnTop: false,
    center: true,
    fullscreen: false,
    kiosk: !isDev,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  // 3. and load the index.html of the app.
  if (isDev) {
    // 개발 중에는 개발 도구에서 호스팅하는 주소에서 로드
    main_window.loadURL('http://localhost:3000')
    main_window.webContents.openDevTools()
  } else {
    // 프로덕션 환경에서는 패키지 내부 리소스에 접근
    main_window.loadFile(path.join(__dirname, './build/index.html'))
  }

  // Emitted when the window is closed.
  main_window.on('closed', () => {
    main_window = undefined!
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', create_window)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('login', (event, msg) => {
  // dialog.showErrorBox('Login', 'Login Failed')
});

ipcMain.on('loadMp4', (event, inputPath) => {
  let proc = ffmpeg(inputPath);
  console.log(proc);
  proc.setFfmpegPath(process.env.FFMPEG_PATH !== undefined ? process.env.FFMPEG_PATH : "C:\\ffmpeg\\bin\\ffmpeg")
    .toFormat('mp3')
    .on('end', () => {
      console.log('done !');
    })
    .on('error', (err : any) => {
      console.log('error', err);
    })
    .saveToFile(path.join(__dirname,"output","output.mp3"));
});
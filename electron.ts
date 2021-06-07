import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as isDev from "electron-is-dev";
import * as path from "path";
import * as fs from "fs";
import SpeechToText from "./speech-to-text";

const ffmpeg = require("fluent-ffmpeg");

const STT = new SpeechToText();

let mainWindow: BrowserWindow;
let subtitleWindow: BrowserWindow;

function create_window() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    alwaysOnTop: false,
    center: true,
    fullscreen: false,
    kiosk: !isDev,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  subtitleWindow = new BrowserWindow({
    width: 1224,
    height: 70,
    transparent: true,
    frame: false,
    show:false,
    alwaysOnTop: true,
    center: true,
    fullscreen: false,
    kiosk: !isDev,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname,"./defaultForm/subtitle.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 3. and load the index.html of the app.
  if (isDev) {
    // 개발 중에는 개발 도구에서 호스팅하는 주소에서 로드
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
 
    subtitleWindow.loadFile(path.join(__dirname, "./defaultForm/subtitle.html"));
  } else {
    // 프로덕션 환경에서는 패키지 내부 리소스에 접근
    mainWindow.loadFile(path.join(__dirname, "./build/index.html"));
    subtitleWindow.loadFile(path.join(__dirname, "./defaultForm/subtitle.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = undefined!;
  });
  subtitleWindow.on("closed", () => {
    subtitleWindow = undefined!;
  });
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", create_window);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("login", (event, msg) => {
  // dialog.showErrorBox('Login', 'Login Failed')

});

ipcMain.on("Subtitle_Resize", (event, width,height) => {
  subtitleWindow.setSize(width,height);
});

ipcMain.on("start_SpeechToText", (event, msg) => {
  subtitleWindow.show();

  STT.onTrans = (subtitle, isFinal) => {
    console.log(subtitle);
    subtitleWindow.webContents.send("getSubtitle",{subtitle,isFinal});
  };

  STT.startStream();
});

ipcMain.on("stop_SpeechToText", (event, msg) => {
  subtitleWindow.hide();
  STT.stopStream();
  subtitleWindow.webContents.send("stop_record");
});

ipcMain.on("getAllResultText",(event,msg) => {
  mainWindow.webContents.send("getAllResultText",msg);
});

ipcMain.on("loadMp4", (event, inputPath) => {
  let proc = ffmpeg(inputPath);
  console.log(proc);
  proc
    .setFfmpegPath(
      process.env.FFMPEG_PATH !== undefined
        ? process.env.FFMPEG_PATH
        : "C:\\ffmpeg\\bin\\ffmpeg"
    )
    .toFormat("mp3")
    .on("end", () => {
      console.log("done !");
    })
    .on("error", (err: any) => {
      console.log("error", err);
    })
    .saveToFile(path.join(__dirname, "output", "output.mp3"));
});

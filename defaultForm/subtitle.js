window.electron = require("electron");

window.onload = () => {
  console.log(window.electron);

  const subtitleDom = document.getElementById("subtitle");

  let prev = 0;
  let allResultText = "";

  electron.ipcRenderer.on("stop_record", (event, msg) => {
 
    electron.ipcRenderer.send('getAllResultText',allResultText);
    allResultText = "";
  });


  electron.ipcRenderer.on("getSubtitle", (event, msg) => {
    const { subtitle, isFinal } = msg;
    console.log(isFinal);
    const token = subtitle.split(" ");
    console.log(token.length, Math.floor(token.length / 10) * 10);
    if (token.length > 10) {
      subtitleDom.innerText = token.slice(prev, prev + 10).join(" ");
      prev = Math.floor(token.length / 10) * 10;
    } else {
      subtitleDom.innerText = subtitle;
      prev = 0;
    }

    if (isFinal) {
      allResultText += subtitle + " ";
    }
  });
};

import React, { useEffect, useState } from "react";
import { Button, Upload, message } from "antd";
import styled from "styled-components";
import { PlayCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { ipcRenderer } = window.require("electron");
const { Dragger } = Upload;

const props = {
  accept: "video/mp4",
  name: "file",
  customRequest() {
    return null;
  },
  onChange(info: { file: any; fileList: any }) {
    const { status } = info.file;
    console.log(info.file.originFileObj.path);
    ipcRenderer.send("loadMp4", info.file.originFileObj.path);

    if (status !== "uploading") {
      console.log(info.file, info.fileList);
    }
    if (status === "done") {
      message.success(`${info.file.name} file uploaded successfully.`);
    } else if (status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
  },
};

const StyleMain = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  .textWrapper {
    .text {
      margin-left: 30px;
    }
    .resultText {
      display: block;
      border-radius: 5px;
      width: 700px;
      height: 150px;
      margin: 0px 20px 20px 20px;
      padding: 20px;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }
  }
  .record {
    display: flex;
    justify-content: center;
  }
`;
const StylePlay = styled(PlayCircleOutlined)`
  font-size: 50px;
  cursor: pointer;
  &:hover {
    color: #eccc3c;
  }
`;

const StyleComplete = styled(CheckCircleOutlined)`
  font-size: 50px;
  cursor: pointer;
  &:hover {
    color: #eccc3c;
  }
`;
function Main() {
  const [isRecordStart, SetIsRecordStart] = useState(false);
  const [recognizeText, SetRecognizeText] = useState("");
  const [transText, SetTransText] = useState("");

  const record = () => {
    if (!isRecordStart) {
      ipcRenderer.send("start_SpeechToText");
    } else {
      ipcRenderer.send("stop_SpeechToText");
    }
    SetIsRecordStart(!isRecordStart);
  };

  useEffect(() => {
    ipcRenderer.on("getAllResultText", (event, msg) => {
      SetRecognizeText(msg);
    });
    return () => {
      ipcRenderer.removeAllListeners("getAllResultText");
    };
  }, []);

  return (
    <StyleMain>
      <div className="textWrapper">
        <p className="text">인식 텍스트</p>
        <div className="resultText">{recognizeText}</div>
      </div>
      <div className="textWrapper">
        <p className="text">요약 텍스트</p>
        <div className="resultText">{transText}</div>
      </div>

      <div className="record" onClick={record}>
        {!isRecordStart ? <StylePlay /> : <StyleComplete />}
      </div>
    </StyleMain>
  );
}

export default Main;

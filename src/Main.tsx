import React from 'react';
import { Button, Upload, message } from 'antd';
import styled from "styled-components";
import { PlayCircleOutlined } from '@ant-design/icons';

const { ipcRenderer } = window.require('electron');
const { Dragger } = Upload;

const props = {
    accept: 'video/mp4',
    name: 'file',
    customRequest() {
        return null
    },
    onChange(info: { file: any, fileList: any }) {
        const { status } = info.file;
        console.log(info.file.originFileObj.path);
        ipcRenderer.send('loadMp4', info.file.originFileObj.path);

        
        if (status !== 'uploading') {
            console.log(info.file, info.fileList);
        }
        if (status === 'done') {
            message.success(`${info.file.name} file uploaded successfully.`);
        } else if (status === 'error') {
            message.error(`${info.file.name} file upload failed.`);
        }
    },
};

function Main() {
    return (
        <div style={{ width: '100vh' }}>
            <Dragger {...props} style={{ margin: '20px' }}>
                <p className="ant-upload-drag-icon">
                    <PlayCircleOutlined />
                </p>
                <p className="ant-upload-text">MP4 파일 불러오기</p>

            </Dragger>
        </div>
    )
}

export default Main;
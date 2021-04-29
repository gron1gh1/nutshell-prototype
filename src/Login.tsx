import React from 'react';
import styled from 'styled-components';
import { Button, Form, Input } from 'antd';
import { Link } from 'react-router-dom';

const { ipcRenderer } = window.require('electron');

const LoginBG = styled.div`
  background: #ffbd59;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Logo = styled.img`
  width: 70%;
`;

const StyleForm = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 50px;
`

function LoginForm() {
  return (
    <StyleForm>
      <Input placeholder="Username" />
      <Input.Password placeholder="Password" />
      <Link to={'/main'}>
        <Button onClick={() => ipcRenderer.send('login', 'aa')} type="primary" htmlType="submit" style={{ marginTop: '10px', width: '300px' }}>
          Login & Sign Up
      </Button>
      </Link>
    </StyleForm>
  )
}

function Login() {
  return (
    <LoginBG>
      <Logo src={'login_background.png'} alt="logo" />
      <LoginForm />
    </LoginBG>
  );
}

export default Login;

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'antd/dist/antd.css';
import Login from './Login';
import Main from './Main';
import { Route, BrowserRouter } from 'react-router-dom';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Route exact path="/" component={Login} />
      <Route path="/main" component={Main} />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);


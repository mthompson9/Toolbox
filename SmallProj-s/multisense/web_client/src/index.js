import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import {withRouter} from "react-router-dom";

import {
    BrowserRouter as Router,
    Route,
    Link
  } from 'react-router-dom'


const AppRouted = withRouter(App)

ReactDOM.render(  <Router><AppRouted /></Router>, document.getElementById('root'));
registerServiceWorker();

// if (module.hot) {
//     module.hot.accept();
// }
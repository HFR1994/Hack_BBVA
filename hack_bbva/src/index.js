import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { Switch, Route, BrowserRouter} from 'react-router-dom'
import registerServiceWorker from './registerServiceWorker';
import Terminos from "./terminos";
import Politica from "./politicas";

ReactDOM.render(
    <BrowserRouter>
        <Switch>
            <Route exact path='/' component={App}/>
            <Route path='/terminos' component={Terminos}/>
            <Route path='/politicas' component={Politica}/>
        </Switch>
    </BrowserRouter>
    , document.getElementById('root'));
registerServiceWorker();

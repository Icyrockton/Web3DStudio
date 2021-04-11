import React, {createRef, useEffect, useRef} from 'react'
import './App.css'
import {BrowserRouter, Switch, Route} from "react-router-dom";
import {Web3D} from "./core/web3D";
import {notification} from "antd";

function App() {

    return (
        <BrowserRouter>
            <Switch>
                <Route path={"/computer"}>
                    <h1>Computer</h1>
                </Route>
                <Route path={"/"}>
                    <Web3D/>
                </Route>
            </Switch>
        </BrowserRouter>
    )
}



export default App

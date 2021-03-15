import React, {createRef, useEffect, useRef} from 'react'
import './App.css'
import {Web3DStudio} from './web3DStudio';
import CollegeUi from "./components/GUI/college/collegeUi";
import useCollegeUiState from "./components/GUI/college/collegeUiState";
import ReceptionistUi from "./components/GUI/receptionist/receptionistUi";
import useReceptionistUiState from "./components/GUI/receptionist/receptionistUiState";
import useTaskUiState from "./components/GUI/task/taskUiState";
import TaskUi from "./components/GUI/task/taskUi";
import PlayerUi from "./components/GUI/player/playerUi";
import usePlayerState from "./components/GUI/player/playerUiState";
import usePlayerUiState from "./components/GUI/player/playerUiState";
import BookShelfUi from "./components/GUI/bookShelf/bookShelfUi";
import useBookShelfUiState from "./components/GUI/bookShelf/bookShelfUiState";
import NotePad from "./components/notepad/notePad";
import PracticeTableUi from "./components/GUI/practiceTable/practiceTableUi";
import usePracticeTableUiState from "./components/GUI/practiceTable/practiceTableUiState";
import {BrowserRouter, Switch, Route} from "react-router-dom";
import {Web3D} from "./core/web3D";

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
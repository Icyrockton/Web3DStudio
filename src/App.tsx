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

function App() {

    const canvas = useRef<HTMLCanvasElement>(null!)
    useEffect(() => {
        const web3DStudio = new Web3DStudio(canvas.current)
    })

    const collegeUiState = useCollegeUiState;
    const receptionistUiState = useReceptionistUiState;
    const taskUiState = useTaskUiState;
    const playerUiState = usePlayerUiState;
    const bookShelfUiState = useBookShelfUiState;
    const practiceTableUiState = usePracticeTableUiState;
    return (
        <React.Fragment>
            <canvas id="renderCanvas" ref={canvas}/>
            <CollegeUi uiState={collegeUiState}/>
            <ReceptionistUi receptionistUiState={receptionistUiState}/>
            <TaskUi taskUiState={taskUiState}/>
            <PlayerUi uiState={playerUiState}/>
            <BookShelfUi uiState={bookShelfUiState}/>
            <PracticeTableUi uiState={practiceTableUiState}/>
            <NotePad/>
        </React.Fragment>
    )
}

export default App
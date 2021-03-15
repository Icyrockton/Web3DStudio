import React, {useEffect, useRef} from "react";
import {Web3DStudio} from "../web3DStudio";
import useCollegeUiState from "../components/GUI/college/collegeUiState";
import useReceptionistUiState from "../components/GUI/receptionist/receptionistUiState";
import useTaskUiState from "../components/GUI/task/taskUiState";
import usePlayerUiState from "../components/GUI/player/playerUiState";
import useBookShelfUiState from "../components/GUI/bookShelf/bookShelfUiState";
import usePracticeTableUiState from "../components/GUI/practiceTable/practiceTableUiState";
import CollegeUi from "../components/GUI/college/collegeUi";
import ReceptionistUi from "../components/GUI/receptionist/receptionistUi";
import TaskUi from "../components/GUI/task/taskUi";
import PlayerUi from "../components/GUI/player/playerUi";
import BookShelfUi from "../components/GUI/bookShelf/bookShelfUi";
import PracticeTableUi from "../components/GUI/practiceTable/practiceTableUi";
import NotePad from "../components/notepad/notePad";


export const Web3D =()=>{
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
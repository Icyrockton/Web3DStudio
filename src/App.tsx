import React, { createRef, useEffect, useRef } from 'react'
import './App.css'
import { Web3DStudio } from './web3DStudio';
import CollegeUi from "./components/GUI/college/collegeUi";
import useCollegeUiState from "./components/GUI/college/collegeUiState";
import ReceptionistUi from "./components/GUI/receptionist/receptionistUi";
import useReceptionistUiState from "./components/GUI/receptionist/receptionistUiState";
import useTaskUiState from "./components/GUI/task/taskUiState";
import TaskUi from "./components/GUI/task/taskUi";
function App(){

    const canvas=useRef<HTMLCanvasElement>(null!)
    useEffect(()=>{
        const web3DStudio = new Web3DStudio(canvas.current)
    })

    const collegeUiState = useCollegeUiState;
    const receptionistUiState = useReceptionistUiState;
    const taskUiState = useTaskUiState;

    return (
        <React.Fragment>
            <canvas id="renderCanvas" ref={canvas}></canvas>
            <CollegeUi uiState={collegeUiState}/>
            <ReceptionistUi receptionistUiState={receptionistUiState} />
            <TaskUi taskUiState={taskUiState}/>
        </React.Fragment>
    )
}

export default App
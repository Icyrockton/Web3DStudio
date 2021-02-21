import React, { createRef, useEffect, useRef } from 'react'
import './App.css'
import { Web3DStudio } from './web3DStudio';
import CollegeUi from "./components/GUI/collegeUi";
import useCollegeUiState from "./components/GUI/collegeUiState";
function App(){

    const canvas=useRef<HTMLCanvasElement>(null!)
    useEffect(()=>{
        const web3DStudio = new Web3DStudio(canvas.current)
    })

    const collegeUiState = useCollegeUiState;
    return (
        <React.Fragment>
            <canvas id="renderCanvas" ref={canvas}></canvas>
            <CollegeUi uiState={collegeUiState}/>
        </React.Fragment>
    )
}

export default App
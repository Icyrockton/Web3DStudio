import React, { createRef, useEffect, useRef } from 'react'
import './App.css'
import { Web3DStudio } from './web3DStudio';
function App(){

    const canvas=useRef<HTMLCanvasElement>(null!)
    useEffect(()=>{
        const web3DStudio = new Web3DStudio(canvas.current)
    })    
    return (
        <canvas id="renderCanvas" ref={canvas}></canvas>
    )
}

export default App
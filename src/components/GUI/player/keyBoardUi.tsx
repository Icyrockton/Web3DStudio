import React, {useState} from "react"
import classes from "./keyBoardUi.module.css"
import {observer} from "mobx-react-lite";
import {PlayerState} from "./playerUiState";



type KeyBoardUiProps={
    uiState:PlayerState
}


//键位提示
export const KeyBoardUi =observer<KeyBoardUiProps>((props)=>{
    const uiState = props.uiState;
        return (
            <div className={`${classes.keyboardArea } ${uiState.keyBoardHintShowing? classes.keyboardAreaShow:""}`}>
                <h3 className={classes.title}>按键提示</h3>
                <img src={"/img/keyboardHint.png"} className={classes.keyboardImg}/>
                <h3>1.控制人物的左右移动</h3>
                <h3>2.使用书架/练习台</h3>
                <h3>3.控制人物的左右移动</h3>
                <div className={classes.button} onClick={()=>uiState.setKeyBoardHintShow(false)}>
                    我知道了
                </div>
            </div>
        )
    }
)

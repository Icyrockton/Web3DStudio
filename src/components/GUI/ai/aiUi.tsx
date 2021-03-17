import {AiUiState} from "./aiUiState";
import {observer} from "mobx-react-lite";
import React from "react";
import classes from "../receptionist/receptionistUi.module.css";


type AiUiProps = {
    uiState: AiUiState
}

const AiUi = observer<AiUiProps>((props: AiUiProps) => {
    const uiState = props.uiState;
    return (
        <div className={`${classes.bg} ${uiState.isShowingDialog ? "" : classes.none}`}>
            <div className={`${classes.content} ${classes.unSkew}`}>
                <img src={uiState.dialog.avatarURL} alt="" className={classes.image}/>
                <h2 className={classes.right}>职务：{uiState.dialog.position} 岗位：{uiState.dialog.title}</h2>
                <h1 style={{textAlign:"center"}}>{uiState.dialog.info}</h1>
            </div>
        </div>
    )
})

export default AiUi

import {ReceptionistUiState} from "./receptionistUiState";
import {observer} from "mobx-react-lite";
import React from "react";
import 'antd/dist/antd.css';
import classes from './receptionistUi.module.css'

type ReceptionUiProps = {
    receptionistUiState: ReceptionistUiState
}

const ReceptionistUiComponent=(props:ReceptionUiProps) => {
    const uiState = props.receptionistUiState;
    return (
        <>
            <div className={`${classes.bg} ${uiState.isShowingDescription ? classes.bgShow : ""}`}>
                <div className={`${classes.content} ${classes.unSkew}`}>
                    <img src={uiState.description.avatarURL} alt="" className={classes.image}/>
                    <h2 className={classes.right}>职务：{uiState.description.position} 岗位：{uiState.description.title}</h2>
                    <h1 style={{textAlign:"center"}}>{uiState.description.info}</h1>
                </div>
            </div>
        </>


    )
}
const ReceptionistUi = observer<ReceptionUiProps>(ReceptionistUiComponent)

export default ReceptionistUi

import {PracticeTableUiState} from "./practiceTableUiState";
import {observer} from "mobx-react-lite";
import React from "react";
import classes from "./practiceTableUi.module.css"
import {Button, Tooltip} from "antd";
import {CloseSquareOutlined} from "@ant-design/icons";

type PracticeTableUiProps = {
    uiState: PracticeTableUiState
}

const PracticeTableUi = observer<PracticeTableUiProps>((props) => {

    const uiState = props.uiState;
    const close = () => {
        uiState.setEBookReaderShowing(false)
        uiState.currentEBook?.moveToOriginStepOne()
        //uiState.setShelfShowing(true) //显示书架的关闭
    }
    return (<>

            <div className={`${classes.eBookReaderClose} ${uiState.eBookReaderShowing ? "" : classes.none}`}>
                <Tooltip title={"关闭电子书"}>
                    <Button type="primary" icon={<CloseSquareOutlined style={{fontSize: "40px"}} onClick={close}/>}
                            className={classes.closeButton} />
                </Tooltip>
            </div>
            <div className={`${classes.eBookReaderArea} ${uiState.eBookReaderShowing ? "" : classes.none}`}>

            </div>
        </>
    )
})

export default PracticeTableUi
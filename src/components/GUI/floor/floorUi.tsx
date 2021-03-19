import {observer} from "mobx-react-lite";
import React from "react";
import classes from "./floorUi.module.css"
import {FloorUiState} from "./floorUiState";
import {Button, Tooltip} from "antd";
import {FormOutlined} from "@ant-design/icons";

type FloorUiProps = {
    uiState: FloorUiState
}


const FloorUi = observer<FloorUiProps>(props => {
    const uiState = props.uiState;

    const floorButton = () => {
        const totalNumber = uiState.floorTotalNumber;
        let content = []
        content.push(
            (
                <div className={classes.selectFloorDiv}>
                    <Tooltip title={`查看所有楼层`} placement={"left"}>
                        <Button shape={"circle"}
                                className={classes.selectFloorButton} onClick={()=>uiState.goToFloor(-1)}>
                            All
                        </Button>
                    </Tooltip>
                </div>
            )
        )
        for (let i = totalNumber; i > 0; i--) {
            content.push(
                (
                    <div className={classes.selectFloorDiv}>
                        <Tooltip title={`前往楼层${i}`} placement={"left"}>
                            <Button shape={"circle"} onClick={()=>uiState.goToFloor(i)}
                                    className={classes.selectFloorButton}>
                                {i}
                            </Button>
                        </Tooltip>
                    </div>
                )
            )
        }
        return content
    }
    return (
        <>
            <div className={`${classes.selectFloor}  ${uiState.uiShowing ? "" : classes.none}`}>
                {
                    floorButton()
                }
            </div>
        </>
    )
})

export default FloorUi

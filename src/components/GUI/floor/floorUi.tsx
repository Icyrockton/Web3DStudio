import {observer} from "mobx-react-lite";
import React from "react";
import classes from "./floorUi.module.css"
import useFloorUiState, {FloorUiState} from "./floorUiState";
import {Button, Tooltip} from "antd";
import {FormOutlined, SendOutlined} from "@ant-design/icons";
import {CollegeStudio, Floor} from "../../../core/college/collegeManager";
import Avatar from "antd/es/avatar/avatar";

type FloorUiProps = {
    uiState: FloorUiState
}
type SingleFloorUiProps = {
    floor: Floor
}

const SingleFloor = (props: SingleFloorUiProps) => {
    const floor = props.floor;

    const studios = () => {
        return floor.studios.map(studio => (
            <>
                <div className={classes.singleFloorStudio}>
                    <div className={classes.studio}>
                        <Avatar src={studio.logoURL} size={"large"}>
                        </Avatar>
                        <h4> {studio.name}</h4>
                    </div>
                </div>
            </>
        ))
    }

    const playSound = () => {
        useFloorUiState.collegeManager?.playFloorSelectSound()
    }
    const floorUiState = useFloorUiState;
    return (
        <div className={classes.singleFloor}>
            <div className={classes.singleFloorTitle} onMouseEnter={playSound}>
                <h2>{floor.floorNumber}楼</h2>
                <div>
                    <Tooltip title={`前往楼层${floor.floorNumber}`} placement={"right"}>
                        <SendOutlined style={{fontSize: "2.0em"}}
                                      onClick={() => floorUiState.goToFloor(floor.floorNumber)}/>
                    </Tooltip>
                </div>
            </div>
            <div className={classes.singleFloorStudios}>
                {studios()}
            </div>
        </div>
    )
}

type StudioInfoUiProps = {
    info: CollegeStudio | null
}
const StudioInfoUi = (props: StudioInfoUiProps) => {
    const info = props.info;
    if (!info) {
        return (
            <>
                空
            </>
        )
    }
    return (
        <>
            <img src={info.logoURL} className={classes.studioInfoImage} />
            <h1 className={classes.studioInfoTitle}>{info.name}</h1>
            <br/>
            <h2 className={classes.studioInfoDescription}>{info.description}</h2>
        </>
    )
}

const FloorUi = observer<FloorUiProps>(props => {
    const uiState = props.uiState;

    const playSound = () => {
        useFloorUiState.collegeManager?.playFloorSelectSimpleSound()
    }

    const floorButton = () => {
        const totalNumber = uiState.floorTotalNumber;
        let content = []
        content.push(
            (
                <div className={classes.selectFloorDiv}>
                    <Tooltip title={`查看所有楼层`} placement={"left"}>
                        <Button shape={"circle"} onMouseEnter={playSound}
                                className={classes.selectFloorButton} onClick={() => uiState.goToFloor(-1)}>
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
                            <Button shape={"circle"} onClick={() => uiState.goToFloor(i)}
                                    className={classes.selectFloorButton} onMouseEnter={playSound}>
                                {i}
                            </Button>
                        </Tooltip>
                    </div>
                )
            )
        }
        return content
    }
    const mouseEnter = () => {  //相机往外增大一点
        uiState.collegeManager?.playFloorSelectSound()
        uiState.onMouseEnterVisitButton()
    }
    const mouseLeave = () => { //相机返回原来的位置
        uiState.onMouseLeaveVisitButton()
    }
    const visit = () => { //游览
        uiState.collegeManager?.playButtonHitSound()
        uiState.goToVisit()
    }
    const visitStudio = () => { //进入工作室
        uiState.collegeManager?.playButtonHitSound()
        uiState.goToStudio()
    }
    const everyFloorContent = () => {
        const floors = uiState.collegeFloors?.floors;
        return floors?.slice().reverse().map(floor => {
            return (
                <>
                    <SingleFloor floor={floor}/>
                </>
            )
        })
    }
    return (
        <>
            {/*右侧UI*/}
            <div className={`${classes.selectFloor}  ${uiState.uiShowing ? classes.selectFloorShow : ""}`}>
                {
                    floorButton()
                }
            </div>

            {/*浏览该层楼*/}
            <div className={`${classes.visitUiArea} ${uiState.visitUiShowing ? classes.visitUiShowing : ""}`}
                 onMouseEnter={mouseEnter} onMouseLeave={mouseLeave} onClick={visit}>
                游览该层楼
            </div>

            {/*左侧UI*/}
            <div
                className={`${classes.everyFloorUi} ${uiState.everyFloorUiShowing ? classes.everyFloorUiShowing : ""}`}>
                {everyFloorContent()}
            </div>

            {/*进入工作室*/}
            <div
                className={`${classes.visitStudioUiArea} ${uiState.visitStudioUiShowing ? classes.visitStudioUiShowing : ""}`}
                onMouseEnter={() => useFloorUiState.collegeManager?.playFloorSelectSound()}
                onClick={visitStudio}>
                进入工作室
            </div>

            {/*   工作室简介*/}
            <div
                className={`${classes.studioInfoUiArea} ${uiState.studioInfoShowing ? classes.studioInfoUiShowing : ""}`}>
                <StudioInfoUi info={uiState.studio}/>
            </div>
        </>
    )
})

export default FloorUi

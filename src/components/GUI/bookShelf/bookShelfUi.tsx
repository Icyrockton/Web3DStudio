import {BookShelfUiState} from "./bookShelfUiState";
import {observer} from "mobx-react-lite";
import React from "react";
import classes from "./bookShelfUi.module.css"
import {Button, Tooltip} from "antd";
import {CloseSquareOutlined} from "@ant-design/icons";
import ReactPlayer from "react-player";
import usePlayerUiState from "../player/playerUiState";
import {StudyType} from "../task/taskUiState";

type BookShelfUiProps = {
    uiState: BookShelfUiState
}

const BookShelfUi = observer<BookShelfUiProps>(props => {
    const uiState = props.uiState;
    const close = () => {
        uiState.setVideoShowing(false)
        uiState.currentBook?.moveToOriginStepOne()
        uiState.setShelfShowing(true) //显示书架的关闭
    }
    const closeShelf = () => {
        uiState.setShelfShowing(false)
        uiState.web3DStudio?.setBookShelfShow(false)
        uiState.playerManager?.player.acceptInput()
    }
    const playerUiState = usePlayerUiState;
    const onVideoProgress = (state: {
        played: number  //played代表当前播放的百分比  0~1的范围
        playedSeconds: number
        loaded: number
        loadedSeconds: number
    }) => {
        if (uiState.currentBookDetail) {
            playerUiState.updateCurrentSubTaskProgress(StudyType.video, uiState.currentBookDetail.uuid,state.played * 100)
        }
    }
    return <>
        <div className={`${classes.blackBg} ${uiState.videoShowing ? classes.blackBgShow : "" }`}></div>
        <div className={`${classes.videoArea} ${uiState.videoShowing ? "" : classes.none}`}>
            {/*关闭按钮*/}
            <div className={`${classes.closeButtonArea}`}>
                <Tooltip title={"合上书籍"}>
                    <Button type="primary" icon={<CloseSquareOutlined style={{fontSize: "1.5vw"}} onClick={close}/>}
                            className={classes.closeButton}/>
                </Tooltip>
            </div>

            {/*视频播放器*/}
            <div className={classes.videoPlayerArea}>
                <ReactPlayer playing={uiState.videoShowing}
                             width={"100%"}
                             height={"100%"}
                             controls
                             url={uiState.currentBookDetail?.videoURL}
                             onProgress={onVideoProgress}
                             loop={false}/>
            </div>

            <div className={classes.videoNameArea}>
                <h1 className={classes.videoName}>{uiState.currentBookDetail?.videoName}</h1>
            </div>
        </div>

        <div className={`${classes.shelfArea} ${uiState.shelfShowing ? "" : classes.none}`}>
            <Tooltip title={"关闭书架"}>
                <Button type={"primary"} icon={<CloseSquareOutlined style={{fontSize: "1.5vw"}} onClick={closeShelf}/>}
                        className={classes.shelfCloseButton}/>
            </Tooltip>
        </div>
    </>
})

export default BookShelfUi

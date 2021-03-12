import {BookShelfUiState} from "./bookShelfUiState";
import {observer} from "mobx-react-lite";
import React from "react";
import classes from "./bookShelfUi.module.css"
import {Button, Tooltip} from "antd";
import {CloseSquareOutlined} from "@ant-design/icons";
import ReactPlayer from "react-player";

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
    }
    return <>
        <div className={`${classes.videoArea} ${uiState.videoShowing ? "" : classes.none}`}>
            {/*关闭按钮*/}
            <div className={`${classes.closeButtonArea}`}>
                <Tooltip title={"合上书籍"}>
                    <Button type="primary" icon={<CloseSquareOutlined style={{fontSize: "40px"}} onClick={close}/>}
                            className={classes.closeButton}/>
                </Tooltip>
            </div>

            {/*视频播放器*/}
            <div className={classes.videoPlayerArea}>
                <ReactPlayer width={"100%"} height={"100%"} controls url={uiState.currentBookDetail?.videoURL}/>
            </div>

            <div className={classes.videoNameArea}>
                <h1 className={classes.videoName}>{uiState.currentBookDetail?.videoName}</h1>
            </div>
        </div>

        <div className={`${classes.shelfArea} ${uiState.shelfShowing ? "" : classes.none}`}>
            <Tooltip title={"关闭书架"}>
                <Button type={"primary"} icon={<CloseSquareOutlined style={{fontSize: "50px"}} onClick={closeShelf}/>}
                        className={classes.shelfCloseButton}/>
            </Tooltip>
        </div>
    </>
})

export default BookShelfUi
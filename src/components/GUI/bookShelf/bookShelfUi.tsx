import {BookShelfUiState} from "./bookShelfUiState";
import {observer} from "mobx-react-lite";
import React from "react";
import classes from "./bookShelfUi.module.css"
import {Button, Tooltip} from "antd";
import {CloseSquareOutlined} from "@ant-design/icons";

type BookShelfUiProps = {
    uiState: BookShelfUiState
}

const BookShelfUi = observer<BookShelfUiProps>(props => {
    const uiState = props.uiState;
    return <>
        <div className={`${classes.closeButtonArea} ${uiState.videoShowing ? "" : classes.none}`}>
            <Tooltip title={"合上书籍"}>
                <Button type="primary"   icon={ <CloseSquareOutlined style={{fontSize:"40px"}} /> } className={classes.closeButton} />
            </Tooltip>
        </div>
    </>
})

export default BookShelfUi
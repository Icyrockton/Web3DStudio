import {AchievementItem, AchievementUiState} from "./achievementUiState";
import {observer} from "mobx-react-lite";
import React, {useEffect} from "react";
import classes from './achievementUi.module.css'
import {Button, Tooltip} from "antd";
import Icon from "@ant-design/icons";
import usePlayerUiState from "../player/playerUiState";


type AchievementUiProps = {
    uiState: AchievementUiState
}

export const AchievementUi = observer<AchievementUiProps>(props => {
    const uiState = props.uiState;
    //${uiState.navToMapShowing ? "" : classes.none}

    const topContent = () => {
        const imageData = ["img/svgIcon/learning.svg", "img/svgIcon/concentration.svg", "img/svgIcon/creativity.svg"]
        const label = ["学习力", "专注力", "创造力"]
        return imageData.map((value, index) =>
            <div className={classes.topItem}>
                <div className={classes.roundImage}>
                    <img src={value} className={classes.svgIcon}/>
                </div>
                <h3 className={classes.topItemLabel}>{label[index]}</h3>
            </div>
        )
    }

    const createItem= (item:AchievementItem)=>{
        return (
            <div className={classes.bottomItem}>
                <div className={`${classes.bottomItemIcon} ${item.finished? classes.bottomItemIconFinished :""}`}>
                    <img src={item.iconURL}/>
                </div>
                <div className={`${classes.bottomItemText} ${item.finished? classes.bottomItemTextFinished :""}`}>
                    <h3 className={`${classes.bottomItemTitle} ${item.finished? classes.bottomItemTitleFinished :""}`}>{item.title}</h3>
                    <p>{item.description}</p>
                </div>
            </div>
        )
    }

    const bottomContent = () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9]
        const list = uiState.achievementList;
        if (list) {
            let minRow = Math.min(list.creativity.length, list.learning.length, list.concentration.length)
            minRow = Math.max(3,minRow )//最多三行
            let content = []
            for (let i = 0; i < minRow; i++) {
                content.push(createItem(list.learning[i]))
                content.push(createItem(list.concentration[i]))
                content.push(createItem(list.creativity[i]))
            }
            return  (
                content
            )
        }
        else
            return  <>暂无数据</>
    }
    return (<>
        <div className={`${classes.achievementButtonArea} ${uiState.achievementOpenUiShowing ? "" : classes.none}  `}>
            <Tooltip title={"打开成就面板"}>
                <Button icon={<Icon component={AchievementSVG}/>} shape={"circle"}
                        onClick={() => uiState.achievementCamera()}
                        onMouseEnter={ ()=> usePlayerUiState.studioManager?.playSelectSound()}
                        className={classes.openButton}/>
            </Tooltip>
        </div>

        <div className={`${classes.cameraMoveInButtonArea} ${uiState.achievementOpenUiShowing ? "" : classes.none}  `}>
            <Tooltip title={"拉远/近镜头"}>
                <Button icon={<Icon component={CameraMoveInSVG}/>} shape={"circle"}
                        onClick={() => uiState.cameraMoveInOrOut()}
                        onMouseEnter={ ()=> usePlayerUiState.studioManager?.playSelectSound()}
                        className={classes.openButton}/>
            </Tooltip>
        </div>

        <section
            className={`${classes.achievementTab} ${uiState.achievementUiShowing ? classes.achievementTabShow : ""}`}>
            <div className={`${classes.achievementTopTab}`}>
                {topContent()}
            </div>

            <div className={`${classes.achievementBottomTab}`}>
                {bottomContent()}
            </div>
        </section>
    </>)
})


const AchievementSVG = () => (
    <svg className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
         p-id="9261" width="60%" height="60%">
        <path d="M448.8 622.8h126.5v126.5H448.8z" fill="#FFB300" p-id="9262"></path>
        <path d="M609.7 796.8H414.3v-61.2c0-11.5 9.4-20.9 20.9-20.9h153.7c11.5 0 20.9 9.4 20.9 20.9v61.2z"
              fill="#FFCA28" p-id="9263"></path>
        <path
            d="M708.1 1016.2H315.9c-11.5 0-20.9-9.4-20.9-20.9V817.2c0-11.5 9.4-20.9 20.9-20.9h392.3c11.5 0 20.9 9.4 20.9 20.9v178.1c-0.1 11.6-9.4 20.9-21 20.9z"
            fill="#333333" p-id="9264" data-spm-anchor-id="a313x.7781069.0.i4" className=""></path>
        <path
            d="M638.3 964H385.7c-5.8 0-10.4-4.7-10.4-10.4V852.7c0-5.8 4.7-10.4 10.4-10.4h252.6c5.8 0 10.4 4.7 10.4 10.4v100.8c0 5.8-4.6 10.5-10.4 10.5z"
            fill="#CFD8DC" p-id="9265"></path>
        <path
            d="M257.2 115.8v284.8c-83.8-11.7-148.5-83.8-148.5-170.8v-114h148.5m52.2-52.2H98.2c-23.1 0-41.8 18.7-41.8 41.8v124.5C56.4 354 157 454.6 281.1 454.6h28.3v-391z m605.9 52.2v108.8c0 88-64.4 161.3-148.5 175.2v-284h148.5m10.5-52.2H714.6v390.9h23.1c126.9 0 229.8-102.9 229.8-229.8V105.4c0.1-23.1-18.7-41.8-41.7-41.8z"
            fill="#FFB300" p-id="9266"></path>
        <path
            d="M512 647.9c-162.7 0-294.6-131.9-294.6-294.6V27.6c0-10.9 8.9-19.8 19.8-19.8h549.5c10.9 0 19.8 8.9 19.8 19.8v325.7C806.6 516 674.7 647.9 512 647.9z"
            fill="#FFCA28" p-id="9267"></path>
        <path
            d="M787.3 458.4L640.1 265 433.6 413l167 221.4c43.9-14.5 74.6-33.9 103.9-58.3 34.9-29.1 62.9-67.8 82.8-117.7z"
            fill="#FFB806" p-id="9268"></path>
        <path
            d="M522.3 178.3l31.3 63.3c1.5 3.1 4.5 5.2 7.9 5.7l69.9 10.2c8.6 1.2 12 11.8 5.8 17.8l-50.6 49.3c-2.5 2.4-3.6 5.9-3 9.2l11.9 69.6c1.5 8.5-7.5 15-15.2 11L512.9 379l-67.4 35.4c-7.7 4-16.6-2.5-15.2-11l11.9-69.6c0.6-3.4-0.5-6.8-3-9.2l-50.6-49.3c-6.2-6-2.8-16.6 5.8-17.8l69.9-10.2c3.4-0.5 6.3-2.6 7.9-5.7l31.3-63.3c3.9-7.8 15-7.8 18.8 0z"
            fill="#FFF8E1" p-id="9269"></path>
    </svg>

)


const CameraMoveInSVG = () => (
    <svg className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
         p-id="2126" width="60%" height="60%">
        <path
            d="M538 837.95h-44.92c-28.44 0-52.69-20.6-57.27-48.66l-16.84-175.93h-3.75a42.689 42.689 0 0 1-25.83-9.36 32.941 32.941 0 0 1-13.85-30.32l18.34-138.5c2.77-29.1 28.09-50.78 57.27-49.04h20.96c10.51 0.07 20.58 4.23 28.07 11.6l14.6 12.73 20.96-12.73c6.11-3.7 13.07-5.76 20.21-5.99h20.96c28.44 0 52.69 20.6 57.27 48.66l18.34 131.76c0.72 8.89-0.96 17.81-4.86 25.83a16.94 16.94 0 0 1-3.74 4.87 40.428 40.428 0 0 1-28.08 11.6h-3.74l-16.47 174.81c-3.13 29.01-28.5 50.43-57.63 48.67zM514.04 379.02a95.8 95.8 0 0 1-69.39-25.93 95.855 95.855 0 0 1-30.18-67.65 95.797 95.797 0 0 1 30.18-67.66 95.883 95.883 0 0 1 69.39-25.93 95.823 95.823 0 0 1 69.4 25.93 95.878 95.878 0 0 1 30.18 67.66 95.796 95.796 0 0 1-30.18 67.65 95.823 95.823 0 0 1-69.4 25.93zM157.29 386.03h-60V139.99c0-23.16 18.84-42 42-42h244.83v60H157.29v228.04zM386.96 929.55H139.29c-23.16 0-42-18.84-42-42V639.96h60v229.59h229.67v60zM886.86 929.55H640.12v-60h228.73V641.67h60v245.88c0.01 23.16-18.84 42-41.99 42zM928.86 383.79h-60v-225.8H640.12v-60h246.73c23.16 0 42 18.84 42 42v243.8z"
            p-id="2127" fill="#000000"></path>
    </svg>
)

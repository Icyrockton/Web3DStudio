import {makeAutoObservable} from "mobx";
import {observer} from "mobx-react-lite";
import React from "react";
import {Card, Progress, Rate, Typography} from "antd";
import 'antd/dist/antd.css';
import Title from "antd/es/typography/Title";
import Paragraph from "antd/es/typography/Paragraph";
import Icon from "@ant-design/icons";
import classes from './subTaskUi.module.css'
import {StudyType, SubTask, SubTaskState} from "../task/taskUiState";

export class SubTaskUiState {

    subTask: SubTask | null = null
    showing: boolean = false

    constructor() {
        makeAutoObservable(this)
    }


    setSubTaskWithShowing(showing: boolean, subTask: SubTask) {
        this.showing = showing
        this.subTask = subTask
    }
}


export const useSubTaskUiState = new SubTaskUiState()


type SubTaskUiProps = {
    uiState: SubTaskUiState
}


const SubTaskUiComponent = (props: SubTaskUiProps) => {
    const uiState = props.uiState;
    const subTask = uiState.subTask;
    const subTaskType = (type: StudyType | undefined) => {
        switch (type) {
            case StudyType.video:
                return (<><Icon component={VideoSVG}/>&nbsp;&nbsp;观看视频</>)
            case StudyType.practice:
                return (<><Icon component={ExerciseSVG}/>&nbsp;&nbsp;课后练习</>)
            case StudyType.read:
                return (<><Icon component={ReadingSVG}/>&nbsp;&nbsp;阅读电子书籍</>)
            default:
                return "无"
        }
    }
    const subTaskState = (status: SubTaskState | undefined) => {
        switch (status) {
            case SubTaskState.UnFinished:
                return (
                    <Paragraph style={{color: "gray"}}>
                        未完成
                    </Paragraph>
                )
            case SubTaskState.Finished:
                return (<><span style={{color: "lightgreen"}}>
                        已完成
                    </span>
                        <br/>
                        评分等级&nbsp;&nbsp;: {subTask?.rate}分 <Rate value={subTask?.rate} disabled/>
                    </>
                )
            case SubTaskState.OnProgress:
                return <Paragraph style={{color: "orange"}}>
                    正在进行
                </Paragraph>
            default:
                return <Paragraph>未知</Paragraph>

        }
    }
    const subTaskProgressBar = () => {
        if (uiState.subTask?.status == SubTaskState.OnProgress) {
            return (<>
                    <Title level={5}>
                        子任务进度
                    </Title>
                    <Paragraph>
                        <Progress
                            strokeColor={{
                                "0%": "#f7797d",
                                "50%": "#FBD786",
                                "100%": "#C6FFDD"
                            }}
                            percent={subTask?.progress}
                            status={"active"} format={(percent => `${percent?.toFixed(0)}%`)}
                        />
                    </Paragraph></>
            )
        }
        else
            return null
    }

    return (

        <>
            <Card className={`${classes.subTaskUi} ${uiState.showing ? classes.subTaskUiShowing : ""}`} title={subTask?.name}>
                <div className={classes.subTaskUi}></div>
                <Typography>
                    <Title level={5}>
                        任务类型
                    </Title>
                    <Paragraph>
                        {subTaskType(subTask?.type)}
                    </Paragraph>
                    <Title level={5}>
                        任务描述
                    </Title>
                    <Paragraph>
                        {subTask?.description}
                    </Paragraph>
                    <Title level={5}>
                        任务状态
                    </Title>
                    {subTaskState(subTask?.status)}
                    {
                        subTaskProgressBar()
                    }
                </Typography>
            </Card>
        </>
    )
}

export const SubTaskUi = observer
    < SubTaskUiProps > (SubTaskUiComponent)


const ExerciseSVG = () => (
    <svg className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
         p-id="4151" id="mx_n_1615018481175" data-spm-anchor-id="a313x.7781069.0.i5" width="30" height="30">
        <path d="M680 260.352L450.112 658.56l-181.12-104.512 229.952-398.272z" fill="#1890FF" p-id="4152"
              data-spm-anchor-id="a313x.7781069.0.i7" className="selected"></path>
        <path
            d="M531.392 607.616l-38.784-22.4-42.432 73.408-47.04-27.072L632.96 233.216l47.04 27.136-43.264 74.944 38.784 22.4 54.464-94.336a22.4 22.4 0 0 0-8.192-30.592L501.952 105.792a22.592 22.592 0 0 0-30.656 8.192L219.072 551.04a21.952 21.952 0 0 0-2.752 9.856l-0.384-0.192 3.2 226.752 0.448 0.256a33.92 33.92 0 0 0 16.64 32.384 33.92 33.92 0 0 0 36.352-1.728l0.384 0.256 198.016-110.592-0.384-0.192a22.144 22.144 0 0 0 7.168-7.232l53.632-92.992z m33.984-413.44l48.192 27.84-229.888 398.336-48.128-27.776 229.824-398.4z m-66.432-38.336l47.04 27.2L316.16 581.376l-47.104-27.328 229.888-398.208z m-195.072 594.944l-41.664-24.192-0.448-124.928 149.76 86.528-107.648 62.592z"
            fill="" p-id="4153"></path>
        <path d="M585.28 514.112l-38.784-22.4 54.336-94.08 38.784 22.4z" fill="" p-id="4154"></path>
        <path d="M655.424 347.712m-22.4 0a22.4 22.4 0 1 0 44.8 0 22.4 22.4 0 1 0-44.8 0Z" fill=""
              p-id="4155"></path>
        <path d="M620.16 408.832m-22.4 0a22.4 22.4 0 1 0 44.8 0 22.4 22.4 0 1 0-44.8 0Z" fill="" p-id="4156"></path>
        <path d="M512.832 594.944m-22.4 0a22.4 22.4 0 1 0 44.8 0 22.4 22.4 0 1 0-44.8 0Z" fill=""
              p-id="4157"></path>
        <path d="M565.824 502.912m-22.4 0a22.4 22.4 0 1 0 44.8 0 22.4 22.4 0 1 0-44.8 0Z" fill=""
              p-id="4158"></path>
        <path d="M99.584 906.88m-22.4 0a22.4 22.4 0 1 0 44.8 0 22.4 22.4 0 1 0-44.8 0Z" fill="" p-id="4159"></path>
        <path
            d="M950.4 906.944c0 12.288-10.048 22.4-22.4 22.4H188.928a22.464 22.464 0 0 1-22.4-22.4v-0.064c0-12.288 10.112-22.4 22.4-22.4H928c12.288 0 22.4 10.112 22.4 22.464zM950.4 811.328c0 12.288-10.048 22.4-22.4 22.4H496.96a22.464 22.464 0 0 1-22.4-22.4v-0.064c0-12.288 10.112-22.4 22.4-22.4H928c12.288 0 22.4 10.048 22.4 22.464z"
            fill="#1890FF" p-id="4160" data-spm-anchor-id="a313x.7781069.0.i6" className="selected"></path>
    </svg>
)


const VideoSVG = () => (
    <svg className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
         p-id="5267" width="30" height="30">
        <path
            d="M644 574.8L471.2 461.7c-18.1-11.8-43.7-4.7-50.6 16.2-1.3 3.9-2 8-2 12.3v230.4c0 4.3 0.7 8.4 2 12.3 6.9 20.9 32.5 28 50.6 16.2L647.1 634c8.8-5.8 14.2-15.8 14.2-26.6 0-13.3-6.5-25.5-17.3-32.6zM633.3 904H596c-15.5 0-28 12.5-28 28s12.5 28 28 28h37.3c15.5 0 28-12.5 28-28s-12.5-28-28-28z"
            fill="#1890FF" p-id="5268"></path>
        <path
            d="M885.3 64H138.7C97.6 64 64 97.6 64 138.7v746.7c0 41.1 33.6 74.7 74.7 74.7h364c15.5 0 28-12.5 28-28s-12.5-28-28-28H157.3c-20.5 0-37.3-16.8-37.3-37.3v-560h784v560c0 20.5-16.8 37.3-37.3 37.3h-140c-15.5 0-28 12.5-28 28s12.5 28 28 28h158.7c41.1 0 74.7-33.6 74.7-74.7V138.7C960 97.6 926.4 64 885.3 64zM120 250.7v-93.3c0-20.5 16.8-37.3 37.3-37.3h27.9l75.4 130.7H120z m205.4 0L249.9 120h80l75.4 130.7h-79.9z m144.7 0L394.6 120h122L592 250.7H470.1z m186.6 0L581.3 120h117.4l75.4 130.7H656.7z m247.3 0h-65.3L763.3 120h103.4c20.5 0 37.3 16.8 37.3 37.3v93.4z"
            fill="#1890FF" p-id="5269"></path>
    </svg>
)

const ReadingSVG = () =>

    <svg className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
         p-id="6172" width="30" height="30">
        <path
            d="M863 942H500.3L309.7 822.6c-33.8-21.2-54.9-60.7-54.9-103V162.5c0-30.4 14.5-57.6 38.7-72.9 24.4-15.4 53.6-15.4 78-0.1L507 174.3h356c52.9 0 96 46.9 96 104.6v558.4c0 57.8-43.1 104.7-96 104.7z m-345.6-69.8H863c17.6 0 32-15.6 32-34.9V278.9c0-19.2-14.4-34.9-32-34.9H489.9l-150.3-94.1c-6.4-4-12-1.3-14.1 0-2.5 1.6-6.7 5.3-6.7 12.6v557.1c0 17.5 8.7 33.8 22.8 42.5l175.8 110.1z"
            fill="#1890FF" p-id="6173"></path>
        <path
            d="M508.8 942H161c-52.9 0-96-46.9-96-104.6V278.9c0-57.7 43.1-104.6 96-104.6h125.8v69.8H161c-17.6 0-32 15.6-32 34.9v558.4c0 19.2 14.4 34.9 32 34.9h347.8V942zM497.5 174.3h1v69.8h-1z"
            fill="#1890FF" p-id="6174"></path>
        <path d="M480 209.2h64v697.2h-64z" fill="#1890FF" p-id="6175"></path>
    </svg>

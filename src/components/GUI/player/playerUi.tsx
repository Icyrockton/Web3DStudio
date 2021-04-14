import usePlayerUiState, {PlayerState} from "./playerUiState";
import {observer} from "mobx-react-lite";
import React, {useEffect, useRef} from "react";
import {Staircase} from "../../../core/staircase/staircase";
import {ExerciseSVG, ReadingSVG, SubTaskUi, useSubTaskUiState, VideoSVG} from "./subTaskUi";
import classes from './playerUi.module.css'
import {Card, Progress, Rate, Typography} from "antd";
import Title from "antd/es/typography/Title";
import Paragraph from "antd/es/typography/Paragraph";
import {MiscUi} from "./miscUi";
import {StudyType, SubTaskState, Task} from "../task/taskUiState";
import Icon, {LoadingOutlined} from "@ant-design/icons";

type PlayerUiProps = {
    uiState: PlayerState
}

const PlayerUiComponent = (props: PlayerUiProps) => {
    const uiState = props.uiState;
    const subTaskUiState = useSubTaskUiState;
    const stairCaseCanvas = useRef<HTMLCanvasElement>(null!);
    useEffect(() => {
        if (uiState.isShowing) { //显示阶梯
            if (uiState.currentTask && uiState.currentTask.uuid > 0) {
                console.log('生成楼梯')
                let staircase = new Staircase(stairCaseCanvas.current, uiState.currentTask);
                const state = usePlayerUiState;
                state.setStairCase(staircase)

                return () => {
                    staircase.dispose()
                }
            }
        }

    }, [uiState.isShowing, uiState.currentTask])


    const icon = (studyType: StudyType) => {
        switch (studyType) {
            case StudyType.video:
                return (<><VideoSVG/>&nbsp;&nbsp;视频</>)
            case StudyType.practice:
                return (<><ExerciseSVG/>&nbsp;&nbsp;练习题</>)
            case StudyType.read:
                return (<><ReadingSVG/>&nbsp;&nbsp;电子书籍</>)
            default:
                return "无"
        }
    }

    const scoreInfoContent = () => {
        const scoreInfo = uiState.taskScoreInfo;
        if (scoreInfo) {
            const content = scoreInfo.subTask.map(subTask => {
                return (
                    <div className={classes.singleScoreInfo}>
                        <div className={classes.singleScoreInfoTitle}>{subTask.name} &nbsp;&nbsp;
                            {icon(subTask.type)}
                        </div>
                        <div className={classes.singleScoreInfoDescription}>
                            {subTask.description}
                        </div>
                        <div className={classes.singleScoreInfoScore}>
                            <Rate value={subTask.rate} disabled/>&nbsp;&nbsp; {subTask?.rate}分 &nbsp;&nbsp;
                        </div>
                    </div>
                )
            })
            return (
                <>
                    <div className={classes.scoreInfoContent}>
                        {content}
                    </div>
                    <div className={classes.divide}/>
                    <span className={classes.totalScore}>
                        总分: <Rate value={scoreInfo.rate} disabled/>&nbsp;&nbsp; {scoreInfo.rate}
                    </span>
                    <button className={classes.confirmButton} onClick={() => {
                        uiState.setScoreInfoShowing(false);
                        usePlayerUiState.studioManager?.playButtonHitSound()
                    }}
                            onMouseOver={() => usePlayerUiState.studioManager?.playSelectSound()}
                    >
                        我已查阅
                    </button>
                </>
            )
        }
    else
        {
            return (<div className={classes.loading}>
                <LoadingOutlined style={{fontSize: 35}} spin/>
                <h2>加载中...</h2>
            </div>)
        }
    }

    return (
        <>
            <div className={classes.playerUi}>
                {/*    这里要注意 task 需要被跟踪 传进去uiState.currentTask  否则任务更新的时候 不会重新生成楼梯*/}
                <div
                    className={`${classes.taskState} ${uiState.isHideSideBar ? classes.taskStateHide : ""} ${uiState.isShowing ? "" : classes.none}`}>
                    <TaskStateUi task={uiState.currentTask}/>
                </div>

                <canvas
                    className={`${classes.stairCase} ${uiState.isHideSideBar ? classes.stairCaseHide : ""}  ${uiState.isShowing ? "" : classes.none}`}
                    ref={stairCaseCanvas}/>

                <div className={classes.misc}>
                    <MiscUi/>
                </div>
            </div>


            <SubTaskUi uiState={subTaskUiState}/>

            {/*自言自语对话框*/}
            <div className={`${classes.bg} ${uiState.isShowingDialog ? classes.bgShow : ""}`}>
                <div className={`${classes.content} ${classes.unSkew}`}>
                    <img src={uiState.dialog.avatarURL} alt="" className={classes.imageLeft}/>
                    <h1 className={classes.infoContent}>{uiState.dialog.info}</h1>
                </div>
            </div>


            <div className={`${classes.miniMap} ${uiState.isMiniMapShowing ? "" : classes.none}`}>

            </div>


            <div
                className={`${classes.scoreInfo} ${uiState.scoreInfoShowing ? classes.scoreInfoShowing : ""} `}>
                <h1 className={classes.scoreInfoTitle}>得分详情</h1>
                <div className={classes.divide}/>
                {scoreInfoContent()}

            </div>
        </>
    )
}
const PlayerUi = observer
<PlayerUiProps>(PlayerUiComponent)

    export default PlayerUi


    type TaskStateUiProps = {
        task: Task | null
    }


    const TaskStateUi = observer((props: TaskStateUiProps) => {
        const task = props.task;
        if (task) {
        let finishedTask = task.subTask.filter(subTask => subTask.status == SubTaskState.Finished);
        console.log(`${finishedTask.length} - ${task.subTask.length}`)
        let progress = (finishedTask.length / task.subTask.length) * 100
        let score = 0 //完成的任务的评分
        finishedTask.forEach(subTask => {
        score += subTask.rate!
    })
        let totalScore = task.subTask.length * 5 //总的分数

        return (
        <Card className={classes.taskTab} title={"正在进行中"}>
        <Typography>
        <Title level={5}>
        任务名称
        </Title>
        <Paragraph>
    {task.name}
        </Paragraph>
        <Title level={5}>
        任务介绍
        </Title>
        <Paragraph>
    {task.description}
        </Paragraph>
        <Title level={5}>
        任务目的
        </Title>
        <Paragraph>
    {task.goal}
        </Paragraph>
        <Title level={5}>
        任务进度
        </Title>
        <Paragraph>
        <Progress
        strokeColor={{
        "0%": "#f7797d",
        "50%": "#FBD786",
        "100%": "#C6FFDD"
    }}
        percent={progress}
        status={"active"} format={(percent => `${percent?.toFixed(0)}%`)}
        />
        </Paragraph>
        <Title level={5}>
        任务总评分
        </Title>
        <Paragraph>
        当前获得分数: {score} 分 / 总分: {totalScore} 分
        </Paragraph>
        </Typography>
        </Card>
        )
    } else {
        return (
        <Card className={classes.taskTab} title={"当前未接到任务"}>
        </Card>
        )
    }
    })

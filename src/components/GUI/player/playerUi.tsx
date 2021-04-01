import usePlayerUiState, {PlayerState} from "./playerUiState";
import {observer} from "mobx-react-lite";
import React, {useEffect, useRef} from "react";
import {Staircase} from "../../../core/staircase/staircase";
import {SubTaskUi, useSubTaskUiState} from "./subTaskUi";
import classes from './playerUi.module.css'
import {Card, Progress, Typography} from "antd";
import Title from "antd/es/typography/Title";
import Paragraph from "antd/es/typography/Paragraph";
import {MiscUi} from "./miscUi";
import {SubTaskState, Task} from "../task/taskUiState";

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

    },[uiState.isShowing,uiState.currentTask])

    const content = (isShowing: boolean, currentTask: Task) => {
        if (isShowing) {

            return (
                <>
                    <div className={classes.taskState}>
                        <TaskStateUi task={currentTask}/>
                    </div>

                    <canvas className={classes.stairCase} ref={stairCaseCanvas}/>

                    <div className={classes.misc}>
                        <MiscUi/>
                    </div>

                </>
            )
        } else {
            return (
                <>

                </>
            )
        }
    }

    return (
        <>
            <div className={classes.playerUi}>
                {content(uiState.isShowing, uiState.currentTask)}
                {/*    这里要注意 task 需要被跟踪 传进去uiState.currentTask  否则任务更新的时候 不会重新生成楼梯*/}
            </div>
            <SubTaskUi uiState={subTaskUiState}/>

            {/*自言自语对话框*/}
            <div className={`${classes.bg} ${uiState.isShowingDialog ? "" : classes.none}`}>
                <div className={`${classes.content} ${classes.unSkew}`}>
                    <img src={uiState.dialog.avatarURL} alt="" className={classes.imageLeft}/>
                    <br/><br/>
                    <h1 style={{textAlign: "center"}}>{uiState.dialog.info}</h1>
                </div>
            </div>


            <div className={`${classes.miniMap} ${uiState.isMiniMapShowing ? "" : classes.none}`}>

            </div>
        </>
    )

}
const PlayerUi = observer<PlayerUiProps>(PlayerUiComponent)

export default PlayerUi


type  TaskStateUiProps = {
    task: Task
}


const TaskStateUi = observer((props: TaskStateUiProps) => {
    const task = props.task;
    let finishedTask = task.subTask.filter(subTask => subTask.status == SubTaskState.Finished);
    console.log(`${finishedTask.length} - ${task.subTask.length}`)
    let progress = (finishedTask.length / task.subTask.length) * 100
    let score = 0 //完成的任务的评分
    finishedTask.forEach(subTask => {
        score += subTask.rate!
    })
    let totalScore = task.subTask.length * 5 //总的分数
    if (props.task.uuid > 0) {
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

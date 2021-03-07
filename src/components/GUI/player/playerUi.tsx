import {PlayerState} from "./playerUiState";
import {observer} from "mobx-react-lite";
import React, {useEffect, useRef} from "react";
import {Staircase} from "../../../core/staircase/staircase";
import {Task} from "../task/taskUi";
import {SubTaskUi, useSubTaskUiState} from "./subTaskUi";
import classes from './playerUi.module.css'

type PlayerUiProps = {
    uiState: PlayerState
}

const PlayerUiComponent = (props: PlayerUiProps) => {
    const uiState = props.uiState;
    const subTaskUiState = useSubTaskUiState;
    const stairCaseCanvas = useRef<HTMLCanvasElement>(null!);
    useEffect(() => {
        if (uiState.isShowing) { //显示阶梯
            if (uiState.currentTask) {
                console.log('生成楼梯')
                let staircase = new Staircase(stairCaseCanvas.current, uiState.currentTask);
            }
        }

    })

    const content = (content: boolean, currentTask: Task) => {
        console.log('进入content')
        if (content) {

            return (
                <>
                    <div className={classes.taskState}>
                        <TaskStateUi task={uiState.currentTask}/>
                    </div>

                    <canvas className={classes.stairCase} ref={stairCaseCanvas}/>

                    <div className={classes.misc}>

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


        </>
    )

}
const PlayerUi = observer<PlayerUiProps>(PlayerUiComponent)

export default PlayerUi


type  TaskStateUiProps = {
    task: Task
}

const TaskStateUi = (props: TaskStateUiProps) => {
    if (props.task.uuid > 0) {
        return (<>
                <div className={classes.taskTab}>
                    <h1>当前有任务</h1>
                </div>
            </>
        )
    } else {
        return (
            <h1>当前无任务</h1>
        )
    }
}

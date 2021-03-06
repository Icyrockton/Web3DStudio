import {PlayerState} from "./playerUiState";
import {observer} from "mobx-react-lite";
import React, {useEffect, useRef} from "react";
import {Staircase} from "../../../core/staircase/staircase";
import {Task} from "../task/taskUi";
import {SubTaskUi, useSubTaskUiState} from "./subTaskUi";


type PlayerUiProps = {
    uiState: PlayerState
}


const PlayerUi = observer<PlayerUiProps>(props => {
    const uiState = props.uiState;

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
                    <div className={"taskState"}>

                    </div>

                    <canvas className={"stairCase"} ref={stairCaseCanvas}/>

                    <div className={"misc"}>

                    </div>

                    <style jsx>
                        {`
                          .taskState {
                            width: 100%;
                            height: 20%;
                            margin-top: 20%;
                            background: red;
                          }

                          .stairCase {
                            width: 100%;
                            height: 50%;
                            margin-top: 10%;
                          }

                          .misc {
                            width: 100%;
                            height: 10%;
                            margin-top: 10%;
                            background: blue;
                          }`}
                    </style>
                </>
            )
        } else {
            return (
                <>

                </>
            )
        }
    }

    const subTaskUiState = useSubTaskUiState;
    return (
        <>
            <div className={"playerUi"}>
                {content(uiState.isShowing,uiState.currentTask)}
            {/*    这里要注意 task 需要被跟踪 传进去uiState.currentTask  否则任务更新的时候 不会重新生成楼梯*/}
            </div>

            <SubTaskUi uiState={subTaskUiState}/>
            <style jsx>
                {
                    `
                      .playerUi {
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: 20%;
                        height: 100%;
                        //background: white;
                      }


                    `
                }
            </style>
        </>
    )

})

export default PlayerUi
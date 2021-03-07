import {makeAutoObservable} from "mobx";
import {StudyType, SubTask, SubTaskState, Task, TaskState} from "../task/taskUi";
import {fakeTask} from "../task/taskUiState";
import {Staircase} from "../../../core/staircase/staircase";

export interface Player {

}

export class PlayerState {

    staircase: Staircase | null = null
    isShowing: boolean = true
    currentTask: Task = {
        name: "空任务",
        uuid: -1,
        status: TaskState.NotAccept,
        description: "",
        goal: "",
        subTask: []
    }  //当前正在完成的任务
    currentSubTaskIndex: number = -1

    constructor() {
        makeAutoObservable(this, {staircase: false, setStairCase: false, currentSubTaskIndex: false})
    }

    public setCurrentTask(task: Task) { //设置当前任务
        this.isShowing = true
        this.currentTask = task
        task.subTask.forEach((subTask, index) => {
            if (subTask.status == SubTaskState.OnProgress) {
                this.currentSubTaskIndex = index
            }
        })
    }

    public setShowing(showing: boolean) {
        this.isShowing = showing
    }

    public setStairCase(staircase: Staircase) { //获取当前阶梯的实例
        this.staircase = staircase
    }


    //完成任务
    public finishSubTask(subTaskIndex: number, newState: SubTaskState = SubTaskState.Finished) {
        if (subTaskIndex >= this.currentTask.subTask.length)
            return
        this.currentTask.subTask[subTaskIndex].status = newState

        this.currentTask.subTask[subTaskIndex].rate =5
        //后台获取评价分数...
        if (this.staircase) {
            console.log('调用楼梯的moveNext')
            this.staircase.moveToNext()
        }

        //更新下一个子任务的状态为 OnProgress
        subTaskIndex++
        if (subTaskIndex >= this.currentTask.subTask.length)
            return;
        //调整任务状态
        this.currentTask.subTask[subTaskIndex].status = SubTaskState.OnProgress
        //调整当前子任务索引
        this.currentSubTaskIndex = subTaskIndex
    }


}

const usePlayerUiState = new PlayerState()



setTimeout(() => {
    console.log('更新子任务')
    usePlayerUiState.setCurrentTask(fakeTask[0])
}, 3000+4000)

setTimeout(() => {
    console.log('更新子任务')
    usePlayerUiState.finishSubTask(3)
}, 5000+4000)

setTimeout(() => {
    console.log('更新子任务')
    usePlayerUiState.finishSubTask(4)
}, 6000+4000)
setTimeout(() => {
    console.log('更新子任务')
    usePlayerUiState.finishSubTask(5)
}, 7000+4000)
setTimeout(() => {
    console.log('更新任务')
    // usePlayerUiState.setCurrentTask(fakeTask[1])
}, 8000+4000)
export default usePlayerUiState

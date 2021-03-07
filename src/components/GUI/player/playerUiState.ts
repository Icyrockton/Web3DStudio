import {autorun, makeAutoObservable} from "mobx";
import {SubTask, Task, TaskState} from "../task/taskUi";
import {fakeTask} from "../task/taskUiState";

export interface Player {
    
}
export class PlayerState {

    isShowing:boolean=true
    currentTask: Task = {
        name:"空任务",
        uuid:-1,
        status: TaskState.NotAccept ,
        description: "",
        goal: "",
        subTask: []
    }  //当前正在完成的任务


    constructor() {
        makeAutoObservable(this)
    }

    public setCurrentTask(task:Task){ //设置当前任务
        this.currentTask=task

    }

    public setShowing(showing:boolean){
        this.isShowing=showing
    }

}

const usePlayerUiState = new PlayerState()
setTimeout(()=>{
    usePlayerUiState.setShowing(true)
},2000)

setTimeout(()=>{
    console.log('设置任务')
    usePlayerUiState.setCurrentTask(fakeTask[0])
},3000)

export default usePlayerUiState

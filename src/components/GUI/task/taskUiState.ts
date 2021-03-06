import {StudyType, SubTaskState, Task, TaskState} from "./taskUi";
import {makeAutoObservable} from "mobx";



 export const fakeTask: Task[] = [{
    uuid: 1,
    name: '任务1',
    description: '从零入门Spring框架，学习IOC(DI)和AOP思想',
    status: TaskState.OnProgress,
    goal: "学习了解Spring框架,初识后端开发",
    subTask: [
        {
            status: SubTaskState.Finished,
            name: '子任务1',
            type: StudyType.video,
            description: '学习安装SpringBoot',
            rate: 4
        },
        {
            status: SubTaskState.Finished,
            name: '子任务2',
            type: StudyType.exercise,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3
        },
        {
            status: SubTaskState.Finished,
            name: '子任务2',
            type: StudyType.exercise,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3
        },
        {
            status: SubTaskState.OnProgress,
            name: '子任务2',
            type: StudyType.exercise,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3
        },
        {
            status: SubTaskState.UnFinished,
            name: '子任务2',
            type: StudyType.exercise,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3
        },
        {
            status: SubTaskState.UnFinished,
            name: '子任务2',
            type: StudyType.exercise,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3
        }
    ],
    rate: 3.5
}]


export class TaskUiState {
    isShowing: boolean = false
    taskList: Task[] = fakeTask
    constructor() {
        makeAutoObservable(this)
    }

    setShowing(showing:boolean){
        this.isShowing=showing
    }
}


const useTaskUiState = new TaskUiState();

export default useTaskUiState

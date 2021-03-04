import {Task, TaskState} from "./taskUi";
import {makeAutoObservable} from "mobx";


const fakeTask: Task[] = [
    {
        uuid: 1,
        name:'任务1',
        description:'从零入门Spring框架，学习IOC(DI)和AOP思想',
        status:TaskState.OnProgress,
        goal:"学习了解Spring框架,初识后端开发",
        subTask: [
            {
                status: TaskState.Finished,
                name:'子任务1',
                conditions :[] ,
                description:'学习安装SpringBoot',
                rate:4
            },
            {
                status: TaskState.OnProgress,
                name:'子任务2',
                conditions :[] ,
                description:'搭建一个基本的Restful风格的后端',
                rate:3
            }
        ],
        rate:3.5
    },
    {
        uuid: 2,
        name:'任务2',
        description:'从0入门编译器，手写C语言编译器',
        status:TaskState.OnProgress,
        goal:"深入了解JavaC的源代码，掌握编译器设计过程",
        subTask: []
    },
]


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

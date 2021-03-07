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
},

    {
        uuid: 2,
        description: "Java高并发学习，手写底层高并发控件",
        name: "Java高并发编程系列",
        goal: "从底层学习Java高并发的有关知识,了解高并发原理",
        status: TaskState.NotAccept,
        subTask: [
            {
                name: "synchronized",
                description: "了解synchronized底层所需要的基础知识synchronized的底层实现",
                type: StudyType.video,
                status: SubTaskState.Finished,
                rate: 5,
            },
            {
                name: "学习Java中的各种'锁'",
                description: "无锁、偏向锁、轻量级锁、重量级锁",
                type: StudyType.video,
                status: SubTaskState.OnProgress,
            },
            {
                name: "指令重排序",
                description: "Volatile如何解决指令重排序？",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
            }
        ]
    }
]


export class TaskUiState {
    isShowing: boolean = false
    taskList: Task[] = fakeTask

    constructor() {
        makeAutoObservable(this)
    }

    setShowing(showing: boolean) {
        this.isShowing = showing
    }
}


const useTaskUiState = new TaskUiState();

export default useTaskUiState

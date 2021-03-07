import {StudyType, SubTaskState, Task, TaskState} from "./taskUi";
import {makeAutoObservable} from "mobx";
import usePlayerUiState from "../player/playerUiState";


export const fakeTask: Task[] = [{
    uuid: 1,
    name: '任务1',
    description: '从零入门Spring框架，学习IOC(DI)和AOP思想',
    status: TaskState.Finished,
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
                status: SubTaskState.UnFinished,
            },
            {
                name: "学习Java中的各种'锁'",
                description: "无锁、偏向锁、轻量级锁、重量级锁",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
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
    num =10
    constructor() {
        makeAutoObservable(this)
    }

    setShowing(showing: boolean) {
        this.isShowing = showing
    }

    //接受任务 将任务的状态改为 --> OnProgress
    acceptTask(acceptTaskUUid: number) {

        this.taskList.forEach(task => {
            if (task.uuid == acceptTaskUUid) {
                console.log('接受新的任务')
                task.status = TaskState.OnProgress
                usePlayerUiState.setCurrentTask(task) //设置当前任务
                //虚拟人员
                const receptionistManager = usePlayerUiState.receptionistManager;
                //播放不同类型的接受任务声音
                switch (task.subTask[0].type){
                    case StudyType.video:
                        receptionistManager?.playVideoHintSound()
                        break
                    case StudyType.read:
                        receptionistManager?.playReadingHintSound()
                        break
                    case StudyType.exercise:
                        receptionistManager?.playExerciseHintSound()
                        break

                }
            }
        })
    }

    test() {
        this.num=Math.random()
        this.taskList.push({
            uuid: Math.random() * 1000,
            status: TaskState.NotAccept,
            goal: "",
            subTask: [],
            name: "Test",
            description: ""
        })
    }
    //未完成的任务
    get unAcceptTask(){
        return this.taskList.filter(task => task.status == TaskState.NotAccept)
    }
    //已完成的任务
    get finishedTask(){
        return this.taskList.filter(task => task.status == TaskState.Finished)
    }
}


const useTaskUiState = new TaskUiState();

export default useTaskUiState

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
            rate: 4,
            progress: 100,
            studyUuid : 0 ,
        },
        {
            status: SubTaskState.Finished,
            name: '子任务2',
            type: StudyType.exercise,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3,
            progress: 100,
            studyUuid : 0 ,

        },
        {
            status: SubTaskState.Finished,
            name: '子任务2',
            type: StudyType.exercise,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3,
            progress: 100,
            studyUuid : 0 ,
        },
        {
            status: SubTaskState.OnProgress,
            name: '子任务2',
            type: StudyType.exercise,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3,
            progress: 100,
            studyUuid : 0 ,
        },
        {
            status: SubTaskState.UnFinished,
            name: '子任务2',
            type: StudyType.exercise,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3,
            progress: 100,
            studyUuid : 0 ,
        },
        {
            status: SubTaskState.UnFinished,
            name: '子任务2',
            type: StudyType.exercise,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3,
            progress: 100,
            studyUuid : 0 ,
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
                name: "jvm内存模型",
                description: "解析jvm虚拟机底层的内存模型",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid : 1 ,
            },
            {
                name: "指令重排序",
                description: "解析jvm的指令重排序机制",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid : 2 ,
            },
            {
                name: "jvm内存屏障",
                description: "jvm内存屏障解析",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid : 3 ,
            }
        ]
    },
    {
        uuid: 3,
        description: "JVM虚拟机学习，快速入门JVM虚拟机",
        name: "JVM虚拟机系列",
        goal: "明白类加载器,堆,栈的区别.新生代,老年代是干什么的",
        status: TaskState.NotAccept,
        subTask: [
            {
                name: "JVM体系结构",
                description: "解析jvm虚拟机底层的内存模型",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid : 4 ,
            },
            {
                name: "类加载器及双亲委派机制",
                description: "解析jvm的类加载器",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid : 5 ,
            },
            {
                name: "Native，方法区",
                description: "解析jvm的方法区中有什么",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid : 6 ,
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

    //接受任务 将任务的状态改为 --> OnProgress
    acceptTask(acceptTaskUUid: number) {

        this.taskList.forEach(task => {
            if (task.uuid == acceptTaskUUid) {
                task.status = TaskState.OnProgress
                //虚拟人员
                const receptionistManager = usePlayerUiState.receptionistManager;
                const studioManager = usePlayerUiState.studioManager;
                //播放不同类型的接受任务声音
                if (task.subTask.length >= 1) {  //子任务的数量大于1
                    switch (task.subTask[0].type) {
                        case StudyType.video:
                            receptionistManager?.playVideoHintSound()
                            studioManager?.setHighLightBookShelf(true)
                            break
                        case StudyType.read:
                            receptionistManager?.playReadingHintSound()
                            break
                        case StudyType.exercise:
                            receptionistManager?.playExerciseHintSound()
                            break
                        default:
                            break
                    }
                    task.subTask[0].status = SubTaskState.OnProgress //正在进行第一个子任务
                }
                usePlayerUiState.setCurrentTask(task) //设置当前任务
            }
        })
    }

    //未完成的任务
    get unAcceptTask() {
        return this.taskList.filter(task => task.status == TaskState.NotAccept)
    }

    //已完成的任务
    get finishedTask() {
        return this.taskList.filter(task => task.status == TaskState.Finished)
    }


}


const useTaskUiState = new TaskUiState();

export default useTaskUiState

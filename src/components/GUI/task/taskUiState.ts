import {makeAutoObservable, runInAction} from "mobx";
import usePlayerUiState from "../player/playerUiState";
import useNavUiState from "../nav/navUiState";
import useWeb3DApi from "../../../network/web3dApi";


export enum SubTaskState {
    UnFinished="UnFinished", //未完成
    Finished="Finished", //完成
    OnProgress="OnProgress" // 正在进行
}

export enum TaskState { //任务的状态
    NotAccept="NotAccept", //还未接收任务
    OnProgress="OnProgress",//正在进行中
    Finished="Finished" //已完成的任务
}

export interface Task {
    uuid: number //任务的唯一id
    name: string //任务名称
    status: TaskState //任务的状态
    description: string //任务总览介绍
    goal: string //任务的目标
    subTask: SubTask[] //子任务
    rate?: number //总评分 1~5
}


export interface SubTask {
    name: string //子任务的名称
    status: SubTaskState //子任务的状态
    description: string // 子任务的描述
    progress: number //子任务的完成进度 0-100
    type: StudyType //子任务类型
    studyUuid: number // 要么是一本书的ID 要么是电子书的ID 要么是练习的ID
    rate?: number //子任务评分 1-5
}

export enum StudyType {
    video="video", //视频
    practice="practice", //课后练习
    read="read" //读书
}

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
            studyUuid: 0,
        },
        {
            status: SubTaskState.Finished,
            name: '子任务2',
            type: StudyType.practice,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3,
            progress: 100,
            studyUuid: 0,

        },
        {
            status: SubTaskState.Finished,
            name: '子任务2',
            type: StudyType.practice,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3,
            progress: 100,
            studyUuid: 0,
        },
        {
            status: SubTaskState.OnProgress,
            name: '子任务2',
            type: StudyType.practice,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3,
            progress: 100,
            studyUuid: 0,
        },
        {
            status: SubTaskState.UnFinished,
            name: '子任务2',
            type: StudyType.practice,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3,
            progress: 100,
            studyUuid: 0,
        },
        {
            status: SubTaskState.UnFinished,
            name: '子任务2',
            type: StudyType.practice,
            description: '搭建一个基本的Restful风格的后端',
            rate: 3,
            progress: 100,
            studyUuid: 0,
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
                name: "Java循环",
                status: SubTaskState.UnFinished,
                type: StudyType.practice,
                studyUuid: 1,
                progress: 0,
                description: "哈哈"
            },
            {
                name: "Java条件语句",
                status: SubTaskState.UnFinished,
                type: StudyType.practice,
                studyUuid: 2,
                progress: 0,
                description: "哈哈"
            },
            {
                name: "Java并发",
                status: SubTaskState.UnFinished,
                type: StudyType.practice,
                studyUuid: 3,
                progress: 0,
                description: "哈哈"
            },
            {
                name: "JVM内存模型",
                description: "解析jvm虚拟机底层的内存模型",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid: 1,
            },
            {
                name: "指令重排序",
                description: "解析jvm的指令重排序机制",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid: 4,
            },
            {
                name: "JVM内存屏障",
                description: "JVM内存屏障解析",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid: 8,
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
                studyUuid: 4,
            },
            {
                name: "类加载器及双亲委派机制",
                description: "解析jvm的类加载器",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid: 5,
            },
            {
                name: "Native，方法区",
                description: "解析jvm的方法区中有什么",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid: 6,
            }
        ]
    },
    {
        uuid: 4,
        description: "JAVA8有lambda等新特性...",
        name: "JAVA8系列",
        goal: "熟悉了解JAVA8的语法,能熟练应用于项目当中",
        status: TaskState.NotAccept,
        subTask: [
            {
                name: "Lambda表达式",
                description: "什么是lambda表达式",
                type: StudyType.read,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid: 1,
            },
            {
                name: "Java8实战",
                description: "Java8实战",
                type: StudyType.read,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid: 2,
            },
            {
                name: "Native，方法区",
                description: "解析jvm的方法区中有什么",
                type: StudyType.video,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid: 6,
            }
        ]
    }
]


export const fakeAiTask: Task[] = [{
    uuid: 1,
    name: '任务1',
    description: '从零入门机器学习',
    status: TaskState.NotAccept,
    goal: "学习机器学习的基本知识",
    subTask: [
        {
            status: SubTaskState.UnFinished,
            name: '子任务1',
            type: StudyType.video,
            description: '了解卷积神经网络',
            progress: 0,
            studyUuid: 21,
        },
        {
            status: SubTaskState.UnFinished,
            name: '子任务2',
            type: StudyType.video,
            description: '了解多元问题',
            progress: 0,
            studyUuid: 23,

        },
        {
            status: SubTaskState.UnFinished,
            name: '子任务3',
            type: StudyType.practice,
            description: '完成机器学习练习题',
            progress: 0,
            studyUuid: 11,
        },
        {
            status: SubTaskState.UnFinished,
            name: '子任务4',
            type: StudyType.read,
            description: '阅读深度学习电子书',
            progress: 0,
            studyUuid: 21,
        },
        {
            status: SubTaskState.UnFinished,
            name: '子任务5',
            type: StudyType.read,
            description: '阅读机器学习实战',
            progress: 0,
            studyUuid: 24,
        },

    ],
},

    {
        uuid: 2,
        description: "深度学习实战",
        name: "入门深度学习",
        goal: "从机器学习到深度学习的学习",
        status: TaskState.NotAccept,
        subTask: [
            {
                name: "子任务1",
                status: SubTaskState.UnFinished,
                type: StudyType.video,
                studyUuid: 21,
                progress: 0,
                description: "了解卷积神经网络"
            },
            {
                name: "子任务2",
                status: SubTaskState.UnFinished,
                type: StudyType.video,
                studyUuid: 25,
                progress: 0,
                description: "了解深度学习编程工具"
            },
            {
                name: "子任务3",
                status: SubTaskState.UnFinished,
                type: StudyType.practice,
                studyUuid: 3,
                progress: 0,
                description: "数据库安装"
            },
            {
                name: "子任务4",
                description: "完成深度学习面试题",
                type: StudyType.practice,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid: 12,
            },
            {
                name: "子任务5",
                description: "阅读TensorFlow深度学习",
                type: StudyType.read,
                status: SubTaskState.UnFinished,
                progress: 0,
                studyUuid: 26,
            },
            {
                status: SubTaskState.UnFinished,
                name: '子任务6',
                type: StudyType.read,
                description: '阅读深度学习电子书',
                progress: 0,
                studyUuid: 21,
            },
        ]
    },

]


export class TaskUiState {
    isShowing: boolean = false
    taskList: Task[] = []
    currentStudioUUid: number = -1

    constructor() {
        makeAutoObservable(this , {
            currentStudioUUid:false
        })
    }

    setShowing(showing: boolean) {
        this.updateTaskList()
        this.isShowing = showing
        if (!this.isShowing) {
            useNavUiState.navController?.focusCanvas() //聚焦canvas
        }
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
                            studioManager?.setHighlightPracticeTable(true)
                            break
                        case StudyType.practice:
                            receptionistManager?.playExerciseHintSound()
                            studioManager?.setHighlightPracticeTable(true)
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


   async  updateTaskList() {  //更新任务
       const response = await useWeb3DApi.getStudioTask(this.currentStudioUUid);
       runInAction(()=>{
           this.taskList = response.data
       })
    }
}


const useTaskUiState = new TaskUiState();

export default useTaskUiState

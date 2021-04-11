import {makeAutoObservable, runInAction} from "mobx";
import {EBookDetail, PracticeTable} from "../../../core/practiceTable/practiceTable";
import {EBook} from "../../../core/practiceTable/eBook";
import usePlayerUiState from "../player/playerUiState";
import {Web3DStudio} from "../../../web3DStudio";
import {StudyType, SubTask} from "../task/taskUiState";
import {PlayerManager} from "../../../core/player/playerManager";
import useNavUiState from "../nav/navUiState";
import useWeb3DApi from "../../../network/web3dApi";


const fakeEBooks: EBookDetail [] = [
    {
        uuid: 1,
        bookName: "Java8函数式编程",
        bookURL: "pdf/Functional_programming-22-25.pdf",
        textureImgURL: "img/bookCover/eBook/Functional_programming.png",
        thickness: 1.0
    },
    {
        uuid: 2,
        bookName: "Java8实战",
        bookURL: "pdf/java8practice-22-26.pdf",
        textureImgURL: "img/bookCover/eBook/java_practice.png",
        thickness: 1.0
    },
    {
        uuid: 3,
        bookName: "Java并发编程艺术",
        bookURL: "pdf/Concurrent_programming_art-15-19.pdf",
        textureImgURL: "img/bookCover/eBook/Concurrent_programming_art.png",
        thickness: 1.0
    },
    {
        uuid: 4,
        bookName: "深入理解Java虚拟机",
        bookURL: "pdf/DeepUnderstandingOfJVM-253-257.pdf",
        textureImgURL: "img/bookCover/eBook/DeepUnderstandingOfJVM.png",
        thickness: 1.0
    },
    {
        uuid: 5,
        bookName: "Java编程思想",
        bookURL: "pdf/java8practice-88-93.pdf",
        textureImgURL: "img/bookCover/eBook/think_in_java.png",
        thickness: 1.0
    },
    {
        uuid: 6,
        bookName: "Effective Java中文版",
        bookURL: "pdf/java8practice-88-93.pdf",
        textureImgURL: "img/bookCover/eBook/Effective_Java.png",
        thickness: 1.0
    }

]



const fakeAiEBooks: EBookDetail [] = [
    {
        uuid: 21,
        bookName: "深度学习",
        bookURL: "pdf/Functional_programming-22-25.pdf",
        textureImgURL: "img/bookCover/eBook/eBook_6.png",
        thickness: 1.0
    },
    {
        uuid: 22,
        bookName: "人工智能数学基础",
        bookURL: "pdf/java8practice-22-26.pdf",
        textureImgURL: "img/bookCover/eBook/eBook_2.png",
        thickness: 1.0
    },
    {
        uuid: 23,
        bookName: "机器学习",
        bookURL: "pdf/Concurrent_programming_art-15-19.pdf",
        textureImgURL: "img/bookCover/eBook/eBook_3.png",
        thickness: 1.0
    },
    {
        uuid: 24,
        bookName: "机器学习实战",
        bookURL: "pdf/DeepUnderstandingOfJVM-253-257.pdf",
        textureImgURL: "img/bookCover/eBook/eBook_4.png",
        thickness: 1.0
    },
    {
        uuid: 25,
        bookName: "机器学习要素",
        bookURL: "pdf/java8practice-88-93.pdf",
        textureImgURL: "img/bookCover/eBook/eBook_5.png",
        thickness: 1.0
    },
    {
        uuid: 26,
        bookName: "TensorFlow深度学习",
        bookURL: "pdf/java8practice-88-93.pdf",
        textureImgURL: "img/bookCover/eBook/eBook_1.png",
        thickness: 1.0
    },
    {
        uuid: 27,
        bookName: "统计学习要素",
        bookURL: "pdf/java8practice-88-93.pdf",
        textureImgURL: "img/bookCover/eBook/eBook_7.png",
        thickness: 1.0
    }

]



export enum PracticeSubTaskType {
    choice="choice", //选择题
    fillInBlank="fillInBlank", //填空题
    code= "code", //代码题目
    questions="question" //问答题目
}

export interface PracticeSubTask { //每一道题 ... 选择题 填空题 代码题
    type: PracticeSubTaskType //题目类型
    name: string //题目名称
    choice?: string[] //选择题的选项
    score: number //每道题的分数
}

export interface PracticeTask { //详细的练习任务
    uuid: number //练习题的UUID
    name: string //练习题名称
    description: string // 练习的描述
    subTasks: PracticeSubTask [] //所有题目
}

export interface PracticeAnswer { //答案
    answer: string
}

const fakePracticeTask: PracticeTask[] = [
    {
        uuid: 1,
        name: "Java循环练习题",
        description: "Java循环练习题",
        subTasks: [
            {
                name: "以下那个关键字不能用于循环",
                type: PracticeSubTaskType.choice,
                choice: ["while", "for", "forEach", "if"],
                score: 5
            },
            {
                name: "写出能用于循环的关键字",
                type: PracticeSubTaskType.fillInBlank,
                score: 5
            },
            {
                name: "写出Java语言1+2+3+...+100的代码",
                type: PracticeSubTaskType.code,
                score: 5
            },
            {
                name: "分析二重循环的时间复杂度",
                type: PracticeSubTaskType.questions,
                score: 5
            },
        ]
    },
    {
        uuid: 2,
        name: "Java条件语句练习题",
        description: "Java条件语句练习题",
        subTasks: [
            {
                name: "写出能用于条件语句的关键字",
                type: PracticeSubTaskType.fillInBlank,
                score: 5
            },
            {
                name: "以下那个关键字不能用于条件判断",
                type: PracticeSubTaskType.choice,
                choice: ["if", "else if", "else ", "while"],
                score: 5
            },
            {
                name: "写出输入一个年份判断是不是闰年的代码",
                type: PracticeSubTaskType.code,
                score: 5
            },
            {
                name: "解读下面代码的意思",
                type: PracticeSubTaskType.questions,
                score: 5
            },
        ]
    },
    {
        uuid: 3,
        name: "Java并发练习题",
        description: "Java并发练习题",
        subTasks: [
            {
                name: "Java中用到的线程调度算法是什么",
                type: PracticeSubTaskType.fillInBlank,
                score: 5
            },
            {
                name: "写出Java中各种锁的类型",
                type: PracticeSubTaskType.fillInBlank,
                score: 5
            },
            {
                name: "写一个程序，线程C在线程B后执行，线程B在线程A之后进行",
                type: PracticeSubTaskType.code,
                score: 5
            },
        ]
    }
]


const fakeAiPracticeTask: PracticeTask[] = [
    {
        uuid: 11,
        name: "1单元机器学习练习题",
        description: "人工智能工作室，机器学习练习题",
        subTasks: [
            {
                name: "回归和分类都是有监督学习问题",
                type: PracticeSubTaskType.choice,
                choice: ["对", "错"],
                score: 5
            },
            {
                name: "回归问题和分类问题都有可能发生过拟合",
                type: PracticeSubTaskType.choice,
                choice: ["对", "错"],
                score: 5
            },
            {
                name: "在神经网络模型VggNet中，使用两个级联的卷积核大小为3×3，stride=1的卷积层代替了一个5×5的卷积层，如果将stride设置为2，则此时感受野为",
                type: PracticeSubTaskType.choice,
                choice: ["7*7", "9*9","5*5","8*8"],
                score: 5
            },
            {
                name: "在网络训练时，loss在最初几个epoch没有下降，可能原因是",
                type: PracticeSubTaskType.questions,
                score: 5
            },
        ]
    },
    {
        uuid: 12,
        name: "深度学习面试题",
        description: "人工智能工作室，深度学习练习题",
        subTasks: [
            {
                name: "为什么必须在神经网络中引入非线性？",
                type: PracticeSubTaskType.questions,
                score: 5
            },
            {
                name: "说明解决神经网络中梯度消失问题的两种方法。",
                type: PracticeSubTaskType.questions,
                score: 5
            },
            {
                name: "在图像分类任务中，相较于使用密集神经网络（DenseNeuralNetwork，DNN），使用卷积神经网络（ConvolutionalNeuralNetwork，CNN）有哪些优势？",
                type: PracticeSubTaskType.questions,
                score: 5
            },
            {
                name: "解释Adam优化器的概念。",
                type: PracticeSubTaskType.questions,
                score: 5
            },

        ]
    },
    {
        uuid: 13,
        name: "2单元机器学习练习题",
        description: "人工智能工作室，机器学习练习题",
        subTasks: [
            {
                name: "期望、方差、协方差、相关系数总结",
                type: PracticeSubTaskType.fillInBlank,
                score: 5
            },
            {
                name: "监督学习、非监督学习、半监督学习、弱监督学习?",
                type: PracticeSubTaskType.fillInBlank,
                score: 5
            },
            {
                name: "常用分类算法的优缺点",
                type: PracticeSubTaskType.code,
                score: 5
            },
            {
                name: "在神经网络模型VggNet中，使用两个级联的卷积核大小为3×3，stride=1的卷积层代替了一个5×5的卷积层，如果将stride设置为2，则此时感受野为",
                type: PracticeSubTaskType.choice,
                choice: ["7*7", "9*9","5*5","8*8"],
                score: 5
            },
        ]
    }
]




export class PracticeTableUiState {

    eBooks: EBookDetail[] = []
    currentEBook: EBook | null = null //保存实例为了关闭书籍
    currentEBookDetail: EBookDetail = {
        uuid: -1,
        bookName: "Java工作室",
        bookURL: "pdf/Java.pdf",
        textureImgURL: "",
        thickness: 1.0
    } //书籍的信息

    currentPractice: SubTask | null = null //保存
    currentPracticeDetail: PracticeTask | null = null  //练习的详细数据结构 保存了练习的所有题目等...
    practiceAnswer: PracticeAnswer[] = []
    web3DStudio: Web3DStudio | null = null
    practiceTable: PracticeTable | null = null
    playerManager: PlayerManager | null = null;

    setPracticeTable(practiceTable: PracticeTable) {
        this.practiceTable = practiceTable
    }


    private async getPracticeTaskDetail(uuid: number) {
        const practice = await this.fetchPracticeTask(uuid);
        runInAction(() => {
            this.currentPracticeDetail = practice  //设置当前练习

            this.practiceAnswer.splice(0, this.practiceAnswer.length)
            for (let i = 0; i < this.currentPracticeDetail.subTasks.length; i++) {
                this.practiceAnswer.push({answer: ""})
            }
            console.log('找到练习任务', practice)
        })
    }

    setCurrentPractice(practiceTask: SubTask) {
        console.log('设置当前练习')
        this.currentPractice = practiceTask
        this.getPracticeTaskDetail(practiceTask.studyUuid)
    }


    async fetchPracticeTask(uuid: number) { //从服务器根据练习的uuid 获取所有练习的题目
        const response = await useWeb3DApi.getStudioPractice(uuid);
        return response.data
    }

    setEBookWithDetail(eBook: EBook, eBookDetail: EBookDetail) {
        this.currentEBook = eBook
        this.currentEBookDetail = eBookDetail
    }

    eBookReaderShowing: boolean = false //电子书显示
    practiceShowing: boolean = false //练习显示
    practiceTableShowing: boolean = false //练习台关闭按钮显示

    setPracticeTableShowing(showing: boolean,leave:boolean =false) { // leave代表离开
        this.practiceTableShowing = showing
        if (showing && this.playerManager){
            usePlayerUiState.studioManager?.clearPlayerState()
            this.playerManager?.player.blockInput() //阻止输入
            usePlayerUiState.studioManager?.startVague(true)
        }
        if ( leave &&!showing && this.playerManager) {
            this.playerManager.busy = false  //设置为非忙碌状态
            useNavUiState.navController?.focusCanvas() //聚焦canvas
        }
        if(!showing && leave){
            this.practiceShowing=false
            this.eBookReaderShowing=false
            usePlayerUiState.checkFinishedCurrentTask()
            usePlayerUiState.studioManager?.startVague(false)
        }
    }

    setEBookReaderShowing(showing: boolean) {
        this.eBookReaderShowing = showing
    }

    setPracticeShowing(showing: boolean) {
        this.practiceShowing = showing
        if (showing) {
            this.practiceTableShowing = false
        } else {
            this.practiceTableShowing = true
        }
    }


    constructor() {
        makeAutoObservable(this, {
            currentEBook: false,
            currentEBookDetail: false,
            setEBookWithDetail: false,
            fetchPracticeTask: false,
            practiceAnswer: false,
            submit: false,
            unFinishedPracticeCount: false,
            web3DStudio: false,
            practiceTable: false,
            setPracticeTable: false,
            playerManager:false
        })
    }


    submit() {
        const playerUiState = usePlayerUiState;
        console.log('提交的答案', this.practiceAnswer)
        //更新任务进度
        playerUiState.updateCurrentSubTaskProgress(StudyType.practice, this.currentPractice!.studyUuid, 100)
    }

    get unFinishedPracticeCount() { //返回未完成的题目数量
        let count = 0
        this.practiceAnswer.forEach(value => {
            if (value.answer == "")
                count++
        })
        return count
    }

    async updatePracticeTable(uuid:number){ //工作室的UUID
        const eBook = (await useWeb3DApi.getStudioEBook(uuid)).data;
        runInAction(()=>{
            this.eBooks = eBook
            if (this.practiceTable){
                this.practiceTable.updateEBook()
            }
        })
    }
}


const usePracticeTableUiState = new PracticeTableUiState()


export default usePracticeTableUiState

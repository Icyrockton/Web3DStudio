import {makeAutoObservable, runInAction} from "mobx";
import {Player} from "../../../core/player/player";
import usePlayerUiState from "../player/playerUiState";


export interface AchievementItem {  //成就项目
    iconURL: string //图标
    title: string //成就标题
    description: string //成就达成描述
    finished: boolean //是否完成
}

export interface AchievementList {  //成就列表
    uuid: number // 用户ID
    learning: AchievementItem[], //学习力
    concentration: AchievementItem[], //专注力
    creativity: AchievementItem[] //创造力
}

export const fakeAchievement: AchievementList = {
    uuid: 1,
    learning: [
        {
            iconURL: "img/svgIcon/learning/login.svg",
            title: "登录账号",
            description: "完成登录账号",
            finished: false
        },
        {
            iconURL: "img/svgIcon/learning/execute.svg",
            title: "执行任务",
            description: "完成一次完整的任务",
            finished: false
        },
        {
            iconURL: "img/svgIcon/learning/review.svg",
            title: "复习回顾",
            description: "与工作室内的人对话",
            finished: false
        }
    ],
    concentration: [
        {
            iconURL: "img/svgIcon/concentration/video.svg",
            title: "视频达人",
            description: "观看视频累计1小时",
            finished: true
        },
        {
            iconURL: "img/svgIcon/concentration/video.svg",
            title: "学霸",
            description: "完成的练习题累计50道",
            finished: false
        },
        {
            iconURL: "img/svgIcon/concentration/reading.svg",
            title: "满腹经纶",
            description: "阅读累计1小时",
            finished: false
        }
    ],
    creativity: [
        {
            iconURL: "img/svgIcon/creativity/note.svg",
            title: "记录小行家",
            description: "记录笔记达到5篇",
            finished: true
        },
        {
            iconURL: "img/svgIcon/creativity/communication.svg",
            title: "交际花",
            description: "向朋友推荐此网站",
            finished: false
        },
        {
            iconURL: "img/svgIcon/creativity/feedback.svg",
            title: "热心群众",
            description: "向网站反馈问题",
            finished: false
        }
    ]
}

export class AchievementUiState {

    achievementUiShowing: boolean = false //成就栏
    achievementOpenUiShowing: boolean = false //成就栏打开按钮
    player: Player | null = null
    achievementList: AchievementList | null = null

    setUiShowing(showing: boolean) {
        this.achievementUiShowing = showing
        if (showing){
            this.fetchAchievementList()
        }
    }

    setOpenUiShowing(openUiShowing: boolean) {
        this.achievementOpenUiShowing = openUiShowing
    }

    constructor() {
        makeAutoObservable(this, {
            player: false
        })
    }


    achievementCamera() {  //成就摄像机
        if (this.player) {
            this.player.achievementCamera()
            const uiOnOff = !this.achievementUiShowing
            this.setUiShowing(uiOnOff)
            usePlayerUiState.setHideSideBar(uiOnOff)
        }
    }

    cameraMoveInOrOut() { //镜头移进
        if (this.player) {
            this.player.cameraFarOrNear()
        }
    }

    async fetchAchievementList() {
        runInAction(() => {
            this.achievementList = fakeAchievement
        })
    }
}

const useAchievementUiState = new AchievementUiState()
export default useAchievementUiState


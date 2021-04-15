import {makeAutoObservable} from "mobx";


export interface ReceptionistDescription {
    avatarURL: string //虚拟人员的头像
    title: string //职务
    position: string //岗位
    info: string //显示的信息
}

export  const JAVA_ReceptionistDescription  :ReceptionistDescription = {
    avatarURL: "img/avatar/javaReceptionistAvatar.png",
    info: "Hi~，欢迎来到北京三维学院Java工作室，我是你的培训师姐，我叫李丹",
    position: "Java架构高级工程师",
    title: "高级工程师"
}


export  const AI_ReceptionistDescription:ReceptionistDescription = {
    avatarURL: "img/avatar/aiReceptionistAvatar.png",
    info: "Hi~，欢迎来到北京三维学院AI工作室，我是你的培训师姐，我叫赵雪",
    position: "人工智能部门经理",
    title: "神经网络高级工程师"
}



export class ReceptionistUiState {
    isShowingDescription: boolean = false //显示虚拟人员的职务，岗位等铭牌
    description : ReceptionistDescription ={
        avatarURL:"",
        title:"",
        position:"",
        info:""
    } as ReceptionistDescription
    constructor() {
        makeAutoObservable(this)
    }

    setDescription(description:ReceptionistDescription){
        this.description=description
    }

    setDescriptionShow(show: boolean) {
        this.isShowingDescription = show
    }


}


const useReceptionistUiState = new ReceptionistUiState()

export default useReceptionistUiState

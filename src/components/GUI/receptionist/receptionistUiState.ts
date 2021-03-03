import {makeAutoObservable} from "mobx";


export interface ReceptionistDescription {
    avatarURL: string //虚拟人员的头像
    title: string //职务
    position: string //岗位
    info: string //显示的信息
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
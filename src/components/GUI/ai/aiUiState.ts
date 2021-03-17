import {Ai} from "../../../core/ai/ai";
import {StudioAIDialog} from "../../../core/studio/Studio";
import {makeAutoObservable} from "mobx";

export class AiUiState {
    isShowingDialog: boolean = false
    count : number = 0 //计数
    dialog:StudioAIDialog ={
        avatarURL:"",
        position:"",
        title:"",
        info:""
    }as StudioAIDialog

    constructor() {
        makeAutoObservable(this,{count:false})
    }
    setDialogInfo(dialog:StudioAIDialog){
        if (this.count ==0)
            this.dialog = dialog
    }
    setDialogShowing(showing:boolean){
        if (showing && !this.count) {
            this.isShowingDialog = showing
            this.count ++
        }
        if (!showing){
            this.isShowingDialog = showing
            this.count --
        }
    }
}


const useAiUiState= new AiUiState()

export default  useAiUiState

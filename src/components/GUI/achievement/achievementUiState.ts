import {makeAutoObservable} from "mobx";
import {Player} from "../../../core/player/player";


export class AchievementUiState {

    achievementUiShowing:boolean = true //成就栏
    achievementOpenUiShowing:boolean =true //成就栏打开按钮
    player:Player | null = null

    setUiShowing(showing:boolean){
        this.achievementUiShowing = showing
    }

    setOpenUiShowing(openUiShowing:boolean){
        this.achievementOpenUiShowing = openUiShowing
    }

    constructor() {
        makeAutoObservable(this,{
            player:false
        })
    }



    achievementCamera() {  //成就摄像机
        if (this.player){
            this.player.achievementCamera()
            this.setUiShowing(!this.achievementUiShowing)
        }
    }

    cameraMoveInOrOut() { //镜头移进
        if (this.player){
            this.player.cameraFarOrNear()
        }
    }
}

const useAchievementUiState= new AchievementUiState()
export default useAchievementUiState


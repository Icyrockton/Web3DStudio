import {makeAutoObservable} from "mobx";
import {IState} from "../../../core/IState";


export class NavUiState {

    navShowing:boolean =false
    navToMapShowing:boolean = false
    navToCollegeShowing:boolean = false
    navController:IState | null =null
    currentCollegeId:number = -1 //当前所在的学院ID
    setNavToMapShowing(showing:boolean){
        this.navToMapShowing = showing
    }
    setNavToCollegeShowing(showing:boolean){
        this.navToCollegeShowing=showing
    }
    setNavShowing(showing:boolean){
        this.navShowing=showing
    }

    constructor() {
        makeAutoObservable(this,{
            navController:false,
            currentCollegeId:false
        })
    }

    navToMap(){
        if (this.navController){
            this.navController.goToCollegeMap()
        }
    }
    navToCollege(){
        if(this.navController && this.currentCollegeId >= 0){
            this.navController.goToCollege(this.currentCollegeId)
        }
    }
}

const useNavUiState = new NavUiState();

export default useNavUiState

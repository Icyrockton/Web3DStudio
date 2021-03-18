import {makeAutoObservable} from "mobx";
import {CollegeManager} from "../../../core/college/collegeManager";


export class FloorUiState {
    uiShowing:boolean = true
    collegeManager:CollegeManager|null = null
    floorTotalNumber = 0 //楼层的总数
    constructor() {
        makeAutoObservable(this,{
            collegeManager : false,
            goToFloor:false
        })
    }

    setFloorUiShowing(showing:boolean){
        this.uiShowing=showing
    }

    setFloorTotalNumber(num: number){
        this.floorTotalNumber = num
    }

    goToFloor(i: number) { //前往楼层
        console.log('前往楼层',i)
        if (this.collegeManager){
            this.collegeManager.goToFloor(i)
        }
    }
}


const useFloorUiState= new FloorUiState()

export default useFloorUiState

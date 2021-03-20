import {makeAutoObservable} from "mobx";
import {CollegeManager} from "../../../core/college/collegeManager";


export class FloorUiState {
    uiShowing: boolean = true
    visitUiShowing: boolean = false
    collegeManager: CollegeManager | null = null
    floorTotalNumber = 0 //楼层的总数
    constructor() {
        makeAutoObservable(this, {
            collegeManager: false,
            goToFloor: false,
            onMouseEnterVisitButton:false,
            onMouseLeaveVisitButton:false,
            goToVisit: false
        })
    }

    setFloorUiShowing(showing: boolean) {
        this.uiShowing = showing
    }
    setVisitUiShowing(showing:boolean){
        this.visitUiShowing = showing
    }

    setFloorTotalNumber(num: number) {
        this.floorTotalNumber = num
    }

    goToFloor(i: number) { //前往楼层
        console.log('前往楼层', i)
        if (this.collegeManager) {
            this.collegeManager.goToFloor(i)
        }
    }

    onMouseEnterVisitButton() {
        if (this.collegeManager){
            this.collegeManager.cameraSmoothOut()
        }
    }

    onMouseLeaveVisitButton() {
        if (this.collegeManager){
            this.collegeManager.cameraSmoothIn()

        }
    }

    goToVisit() {
        if (this.collegeManager){
            this.collegeManager.visitFloor()
        }
    }
}


const useFloorUiState = new FloorUiState()

export default useFloorUiState

import {makeAutoObservable} from "mobx";
import {CollegeFloors, CollegeManager} from "../../../core/college/collegeManager";


export class FloorUiState {
    uiShowing: boolean = true //右侧的点击楼层
    everyFloorUiShowing: boolean = true //左侧简单的楼层介绍
    visitUiShowing: boolean = false //显示游览该层的UI
    collegeManager: CollegeManager | null = null
    floorTotalNumber = 0 //楼层的总数
    collegeFloors: CollegeFloors | null = null

    constructor() {
        makeAutoObservable(this, {
            collegeManager: false,
            goToFloor: false,
            onMouseEnterVisitButton: false,
            onMouseLeaveVisitButton: false,
            goToVisit: false
        })
    }

    setFloorUiShowing(showing: boolean) {
        this.uiShowing = showing
    }

    setVisitUiShowing(showing: boolean) {
        this.visitUiShowing = showing
    }

    setEveryFloorUiShowing(showing: boolean) {
        this.everyFloorUiShowing = showing
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
        if (this.collegeManager) {
            this.collegeManager.cameraSmoothOut()
        }
    }

    onMouseLeaveVisitButton() {
        if (this.collegeManager) {
            this.collegeManager.cameraSmoothIn()

        }
    }

    goToVisit() {
        if (this.collegeManager) {
            this.collegeManager.visitFloor()
        }
    }

    setFloorInfo(collegeFloors: CollegeFloors) {
        this.collegeFloors = collegeFloors
    }
}


const useFloorUiState = new FloorUiState()

export default useFloorUiState

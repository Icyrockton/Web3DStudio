import {makeAutoObservable} from "mobx";
import {CollegeFloors, CollegeManager, CollegeStudio} from "../../../core/college/collegeManager";


export class FloorUiState {
    uiShowing: boolean = false //右侧的点击楼层
    everyFloorUiShowing: boolean = false //左侧简单的楼层介绍
    visitUiShowing: boolean = false //显示游览该层的UI
    visitStudioUiShowing:boolean =false //显示浏览工作室的UI
    collegeManager: CollegeManager | null = null
    floorTotalNumber = 0 //楼层的总数
    collegeFloors: CollegeFloors | null = null
    studioInfoShowing:boolean =false
    studio:CollegeStudio | null = null
    setStudioInfoShowing(showing: boolean) {
        this.studioInfoShowing = showing
    }
    setStudioInfo(studio:CollegeStudio){
        this.studio = studio
    }

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

    setVisitStudioUiShowing(showing: boolean) {
        this.visitStudioUiShowing = showing
    }

    setEveryFloorUiShowing(showing: boolean) {
        this.everyFloorUiShowing = showing
    }

    setFloorTotalNumber(num: number) {
        this.floorTotalNumber = num
    }

    goToFloor(i: number) { //前往楼层
        if (this.collegeManager) {
            this.collegeManager.goToFloor(i)
        }
    }

    goToStudio(){
        if (this.collegeManager){
            this.collegeManager.goToStudio()
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

import {College, Studio} from "./collegeMap/college";


export interface IState {
    goToCollegeMap():void//进入地图
    goToCollege(collegeName: string):void //进入学院
    goToStudio(studio: Studio):void//进入工作室
}
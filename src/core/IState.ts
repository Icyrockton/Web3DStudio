import {College, SimpleStudio} from "./collegeMap/college";
import {Studio} from "./studio/Studio";


export interface IState {
    goToCollegeMap():void//进入地图
    goToCollege(collegeName: string):void //进入学院

    goToStudio(studio: Studio):void//进入工作室
    setBookShelfShow(showing:boolean) : void //打开书架
}
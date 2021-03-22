import {College, SimpleStudio} from "./collegeMap/college";
import {Studio} from "./studio/Studio";


export interface IState {
    goToCollegeMap():void//进入地图
    goToCollege(collegeUUid: number):void //进入学院
    goToStudio(studioUUid: number):void//进入工作室 传过来工作室的ID
    setBookShelfShow(showing:boolean) : void //打开书架
    setPracticeTableShow(showing:boolean) : void //打开练习台
}

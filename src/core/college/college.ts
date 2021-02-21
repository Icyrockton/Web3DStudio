import { Vector3 } from "@babylonjs/core";


export enum CollegePosition {  //学院的位置
    A = "building_1",
    B = "building_2",
    C = "building_3",
    D = "building_4",
    E = "building_5",
}

export interface College {  
    name: string
    modelUrl: string
    position: CollegePosition
    scale:Vector3
    rotation:Vector3
}

export interface CollegeDescription{ //学院描述信息
    name:string //学院名称 
    position:string  //学院位置
    description:'' //学院描述
    studios:'' //学院含有的工作室
}
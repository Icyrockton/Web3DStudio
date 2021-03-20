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

export interface SimpleStudio {
    name:string //工作室名称
    logoUrl:string //工作室LOGO
    description:string //工作室描述
}

export interface CollegeDescription{ //学院描述信息
    name:string //学院名称
    position:string  //学院位置
    description:string //学院描述
    studios:SimpleStudio[] //学院含有的工作室
    imgUrl:string //学院的照片
}

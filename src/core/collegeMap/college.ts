import {Vector3} from "@babylonjs/core";


export enum CollegePosition {  //学院的位置
    A = "building_1",
    B = "building_2",
    C = "building_3",
    D = "building_4",
    E = "building_5",
}

export interface College {  //摆放模型的信息
    uuid: number  //学院的id
    name: string //学院的名称
    modelUrl: string //学院的模型URL
    position: CollegePosition //学院的位置
    scale: number[] //缩放大小
    rotation: number[] //缩放大小
}

export interface SimpleStudio {
    uuid: number  //工作室的id
    name: string //工作室名称
    logoUrl: string //工作室LOGO
    description: string //工作室描述
}

export interface CollegeDescription { //学院的描述信息
    uuid:number //学院的ID
    name: string //学院名称
    position: string  //学院真实位置 (北京，成都，这种）
    description: string //学院描述
    studios: SimpleStudio[] //学院含有的工作室
    imgUrl: string //学院的照片
}

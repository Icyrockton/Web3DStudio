import {Vector3} from "@babylonjs/core";



export interface RotateCamera {
    mesh:string //地面mesh的名称
    rotate:number //绕y轴旋转的角度 0~360
}

export interface Studio {
    name:string //工作室名称
    modelURL:string //模型的URL位置
    playerModelURL:string //玩家模型的URL位置
    description:string //模型的描述
    playerSpawn:string //玩家的出生点的transformNode名称
    collisionBox:string[] //碰撞盒子的Mesh名称
    groundName:string //地面Mesh名称
    directionalLightPosition:Vector3 //平行光的位置
    rotateCamera:RotateCamera[] //相机的自动旋转
    receptionistConfig:ReceptionistConfig //虚拟人员配置文件
}

export interface ReceptionistConfig {
    receptionistModelURL:string //虚拟人员模型的URL位置
    receptionistSpawn:string //接待员的出生点的transformNode名称
    receptionistRotateYAxis:number //绕y轴旋转的角度
    distanceTrigger:number //当玩家与虚拟人员在distanceTrigger这个距离以内时，触发对应的事件
    greetingSoundURL:string //玩家进入工作室后的问候语..
    introductionSoundURL:string //接任务的问候语
}
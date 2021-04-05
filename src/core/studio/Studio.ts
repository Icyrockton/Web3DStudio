import {TransformNode, Vector3} from "@babylonjs/core";



export interface RotateCamera {
    mesh:string //地面mesh的名称
    rotate:number //绕y轴旋转的角度 0~360
}

export interface Studio {
    uuid:number
    name:string //工作室名称
    modelURL:string //模型的URL位置
    playerModelURL:string //玩家模型的URL位置
    playerAvatarURL:string //玩家头像位置
    playerRotateYAxis:number //玩家绕Y轴的位置 在初始位置时
    description:string //模型的描述
    playerSpawn:string //玩家的出生点的transformNode名称
    miniMap:string  //小地图的mesh名称
    collisionBox:string[] //碰撞盒子的Mesh名称
    groundName:string //地面Mesh名称
    receiveShadowName:string [] //需要接受阴影的Mesh名称
    groundLightMapUrl:string //lightmap 贴图地址
    bookShelfStartName:string //所有书架的统一起始的Mesh名称
    practiceTableStartName:string //练习台的统一起始的Mesh名称
    directionalLightPosition:number[] //平行光的位置
    directionalLightDirection:number[] //平行光的方向
    rotateCamera:RotateCamera[] //相机的自动旋转
    receptionistConfig:ReceptionistConfig //虚拟人员配置文件
    studioAIs:StudioAI[]
}

export interface ReceptionistConfig {
    receptionistModelURL:string //虚拟人员模型的URL位置
    receptionistSpawn:string //接待员的出生点的transformNode名称
    receptionistRotateYAxis:number //绕y轴旋转的角度
    distanceTrigger:number //当玩家与虚拟人员在distanceTrigger这个距离以内时，触发对应的事件
    greetingSoundURL:string //玩家进入工作室后的问候语..
    introductionSoundURL:string //接任务的问候语
}


//路径信息
export interface StudioAIPath {
    nodeName:string  //点的位置
    residenceTime:number //在该点的滞留时间
}

//工作室中的AI
export interface StudioAI {
    name:string //AI的名称
    idleAnimationGroupName:string //空闲状态动画名称
    walkAnimationGroupName:string //走路动画名称
    leftTurnAnimationGroupName:string //走路动画名称
    rightTurnAnimationGroupName:string //走路动画名称
    modelURL:string //模型的地址
    avatarURL: string //AI的头像
    miniMapAvatarURL:string //小地图的头像
    title: string //职务
    position: string //岗位
    info: string[] //显示的提示信息
    infoSoundURL: string[] //显示的提示信息的声音URL
    path:StudioAIPath[]
}

export interface StudioAIDialog {
    avatarURL: string //AI的头像
    title: string //职务
    position: string //岗位
    info:string //信息

}

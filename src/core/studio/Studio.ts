

export interface Studio {
    name:string //工作室名称
    modelURL:string //模型的URL位置
    playerModelURL:string //玩家的URL位置
    description:string //模型的描述
    playerSpawn:string //玩家的出生点的transformNode名称
    receptionistSpawn:string //接待员的出生点的transformNode名称
    collisionBox:string[] //碰撞盒子的Mesh名称
    groundName:string //地面Mesh名称
}
import {
    AbstractMesh,
    Matrix,
    MeshBuilder,
    Quaternion,
    Scene,
    SceneLoader,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {Studio} from "./Studio";
import {Player, PlayerAssets} from "../player/player";
import {InputController} from "../player/inputController";
import {PlayerManager} from "../player/playerManager";


 export class StudioManager {
    private _studio: Studio;
    private _scene: Scene;
    private _playerSpawn ?: TransformNode //玩家的出生点
    private _receptionistSpawn  ?: TransformNode //接待员的出生点
    static PlayerModelUrl = "src/assets/model/player.glb"
    static PlayerCollisionBoxWidth = 0.7
    static PlayerCollisionBoxHeight = 1.8
    static PlayerCollisionBoxDepth = 0.5
    private _playerManager!: PlayerManager;

    constructor(scene: Scene, studio: Studio) {
        this._scene = scene;
        this._studio = studio;
        this._scene.collisionsEnabled = true //打开碰撞
    }

    async load() {
        this.setUpLight()
        this.setUpCamera()
        await this.loadModel() //加载地图模型
        await this.setUpPlayer() //加载玩家模型


    }

    private setUpLight() {
        this._scene.createDefaultLight()
    }

    private setUpCamera() {
        this._scene.createDefaultCamera()
    }

    private async loadModel() {
        let model = await SceneLoader.ImportMeshAsync("", this._studio.modelURL, undefined, this._scene)
        let transformNodes=model.transformNodes
        let meshes=model.meshes
        //找到玩家的出生点
        this._playerSpawn = transformNodes.find(node => node.name == this._studio.playerSpawn)
        //找到接待员的出生点
        this._receptionistSpawn = transformNodes.find(node => node.name == this._studio.receptionistSpawn)


        console.log('设置碰撞盒子')
        this.setUpCollisionBox(meshes) //设置碰撞盒子

    }

    private setUpCollisionBox(meshes: AbstractMesh[]) { //设置碰撞盒子
        meshes.forEach(mesh=>{
            if (this._studio.collisionBox.find(collision=> collision==mesh.name)){
                mesh.isVisible=false //不可见
                mesh.checkCollisions =true //碰撞检测
            }
        })

        //设置地面为可见的
        let ground = meshes.find(mesh=>mesh.name==this._studio.groundName);
        if(ground){
            ground.isVisible=true
        }
    }

    private async setUpPlayer() { //设置玩家
        this._playerManager = new PlayerManager(this._scene, this._studio.playerModelURL);
        await this._playerManager.loadPlayer()
        //设置玩家的位置
        if(this._playerSpawn){
            this._playerManager.setPlayerPosition(this._playerSpawn.position)
        }else{
            console.log('没有设置玩家的起始位置')
        }
    }

}
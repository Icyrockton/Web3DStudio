import {AbstractMesh, Matrix, MeshBuilder, Quaternion, Scene, SceneLoader, Vector3} from "@babylonjs/core";
import {Player, PlayerAssets} from "./player";
import {InputController} from "./inputController";
import {PlayerManager} from "./playerManager";
import {VisitPlayer} from "./visitPlayer";
import {CollegeManager} from "../college/collegeManager";
import {CollegeFloor} from "../college/collegeFloor";

export class VisitPlayerManager {
    private _scene: Scene;
    private _playerModelURL: string;
    public player!: VisitPlayer;

    private _collisionBox!: AbstractMesh

    constructor(scene: Scene, playerModelURL: string) {
        this._scene = scene;
        this._playerModelURL = playerModelURL;
    }

    async loadPlayer() {

        let playerImport = await SceneLoader.ImportMeshAsync("", this._playerModelURL, undefined, this._scene)
        playerImport.meshes.forEach(mesh => {
            mesh.isPickable = false //全部设置为不可拾取
        })
        //创建碰撞盒子
        let collisionBox = MeshBuilder.CreateBox("playerCollisionBox", {
            width: PlayerManager.PlayerCollisionBoxWidth,
            height: PlayerManager.PlayerCollisionBoxHeight,
            depth: PlayerManager.PlayerCollisionBoxDepth
        });
        collisionBox.bakeTransformIntoVertices(Matrix.Translation(0, PlayerManager.PlayerCollisionBoxHeight / 2, 0))
        collisionBox.isVisible = false //不可见
        collisionBox.isPickable = false //不可拾取
        collisionBox.checkCollisions = true //检查碰撞
        //碰撞的椭球体
        //https://doc.babylonjs.com/divingDeeper/cameras/camera_collisions
        collisionBox.ellipsoid = new Vector3(PlayerManager.PlayerCollisionBoxWidth / 2, PlayerManager.PlayerCollisionBoxHeight / 2, PlayerManager.PlayerCollisionBoxDepth / 2)
        //现在玩家的原点位于(0,0,0)的位置 原始的碰撞椭球体的中心与玩家的原点重合 我们需要将碰撞椭球体沿y轴向上移动 移动到玩家的中心
        collisionBox.ellipsoidOffset = new Vector3(0, PlayerManager.PlayerCollisionBoxHeight / 2, 0)

        collisionBox.rotationQuaternion = new Quaternion(0, 0, 0, 0)
        this._collisionBox = collisionBox
        let playerAssets = {
            collisionBox: collisionBox,
            animationGroups: playerImport.animationGroups
        } as PlayerAssets

        let playerMesh = playerImport.meshes[0]; //Player的模型对象
        playerMesh.parent = collisionBox
        playerMesh.isPickable = false

        let player = new VisitPlayer(playerAssets, this._scene);
        this.player = player
    }

    public placePlayerAtFloor(floorNum: number) { //放置player在某层楼上
        const y = (floorNum - 1) * CollegeFloor.HEIGHT  // y方向上的位置

        this._collisionBox.position.set(0, y, 0) //设置位置
    }

    public invisible() { //将玩家隐藏
        const meshes = this._collisionBox.getChildMeshes();
        meshes.forEach(mesh=>{
            mesh.isVisible =false
        })
    }

    public visible() { //将玩家显示
        const meshes = this._collisionBox.getChildMeshes();
        meshes.forEach(mesh=>{
            mesh.isVisible =true
        })
    }
}

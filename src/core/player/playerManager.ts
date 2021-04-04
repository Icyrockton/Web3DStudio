import {Player, PlayerAssets} from "./player";
import {
    AbstractMesh,
    Matrix,
    MeshBuilder,
    Quaternion,
    Scene,
    SceneLoader,
    ShadowGenerator,
    Vector3
} from "@babylonjs/core";
import {InputController} from "./inputController";
import {RotateCamera} from "../studio/Studio";


export class PlayerManager {
    get currentAIName(): string {
        return this._currentAIName;
    }

    set currentAIName(value: string) {
        this._currentAIName = value;
    }

    static PlayerCollisionBoxWidth = 0.7
    static PlayerCollisionBoxHeight = 1.8
    static PlayerCollisionBoxDepth = 0.5
    private _scene: Scene;
    private _playerModelURL: string;
    public player!: Player;
    private _collisionBox!: AbstractMesh
    static CollisionBoxWidth = 0.7
    static CollisionBoxHeight = 1.8
    static CollisionBoxDepth = 0.5
    private _busy:boolean = false  //忙碌   打开工作台.. 图书... 不允许AI产生对话
    private _currentAIName:string ="" //和交谈的AI
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
            animationGroups: playerImport.animationGroups,
            avatarMiniMapURL : "img/miniMap/player.png"
        } as PlayerAssets

        let playerMesh = playerImport.meshes[0]; //Player的模型对象
        playerMesh.parent = collisionBox
        playerMesh.isPickable = false

        let playerController = new InputController(this._scene);
        let player = new Player(playerAssets, this._scene, playerController);
        this.player = player

    }



    public set playerPosition(position: Vector3){
        this._collisionBox.position.set(-position.x, position.y, position.z)
    }

    public get playerPosition(): Vector3 {
        return this._collisionBox.position
    }

    setUpRotateCamera(rotateCamera: RotateCamera[]) {
        rotateCamera.forEach(value => {
            let mesh = this._scene.getMeshByName(value.mesh);
            if (mesh) {
                mesh.isVisible = false

                this._scene.registerBeforeRender(() => {
                    if (mesh!.intersectsMesh(this._collisionBox, false, false)) {
                        this.player.rotateCameraAroundYAxis(value.rotate)
                    }


                })
            }
        })
    }

    get busy(): boolean {
        return this._busy;
    }
    set busy(value: boolean) {
        this._busy = value;
    }

    setUpShadow(_shadowGenerator: ShadowGenerator) {
        this.player.setUpShadow(_shadowGenerator)
    }
}

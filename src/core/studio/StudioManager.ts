import {
    AbstractMesh, ArcRotateCamera, DirectionalLight, HemisphericLight, KeyboardEventTypes, KeyboardInfo,
    Matrix,
    MeshBuilder,
    Quaternion, RenderTargetTexture,
    Scene,
    SceneLoader, ShadowGenerator,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {Studio} from "./Studio";
import {Player, PlayerAssets} from "../player/player";
import {InputController} from "../player/inputController";
import {PlayerManager} from "../player/playerManager";
import {ReceptionistManager} from "../receptionist/receptionistManager";
import {AdvancedDynamicTexture} from "@babylonjs/gui";
import useReceptionistUiState, {ReceptionistDescription} from "../../components/GUI/receptionist/receptionistUiState";
import useTaskUiState from "../../components/GUI/task/taskUiState";
import usePlayerUiState from "../../components/GUI/player/playerUiState";


export class StudioManager {
    private _studio: Studio;
    private _scene: Scene;
    private _playerSpawn ?: TransformNode //玩家的出生点
    private _receptionistSpawn  ?: TransformNode //接待员的出生点
    static PlayerModelUrl = "src/assets/model/receptionist.glb"
    static PlayerCollisionBoxWidth = 0.7
    static PlayerCollisionBoxHeight = 1.8
    static PlayerCollisionBoxDepth = 0.5
    private _playerManager!: PlayerManager;
    private _directionalLight!: DirectionalLight
    private _receptionManager!: ReceptionistManager;

    constructor(scene: Scene, studio: Studio) {
        this._scene = scene;
        this._studio = studio;
        this._scene.collisionsEnabled = true //打开碰撞
    }

    async load() {
        this.setUpLight()
        this.setUpCamera()
        await this.loadModel() //加载地图模型
        this.setUpShadow() //设置阴影
        await this.setUpPlayer() //加载玩家模型
        await this.setUpReceptionist() //加载虚拟人员模型
        this.setUpRotateCamera() //设置自动旋转相机
        // let arcRotateCamera = new ArcRotateCamera("arc",0,0,10,Vector3.Zero(),this._scene);
        // arcRotateCamera.attachControl()
        // this._scene.activeCamera = arcRotateCamera

    }

    private setUpLight() {
        const hemisphericLight = new HemisphericLight("hemisphericLight", Vector3.Up(), this._scene);
        hemisphericLight.intensity = 0.5
        this._directionalLight = new DirectionalLight("directionalLight", new Vector3(1, -2, 1), this._scene)
        this._directionalLight.position = this._studio.directionalLightPosition
    }

    private setUpCamera() {
        this._scene.createDefaultCamera()
    }

    private async loadModel() {
        let model = await SceneLoader.ImportMeshAsync("", this._studio.modelURL, undefined, this._scene)
        let transformNodes = model.transformNodes
        let meshes = model.meshes
        //找到玩家的出生点
        this._playerSpawn = transformNodes.find(node => node.name == this._studio.playerSpawn)
        //找到接待员的出生点
        this._receptionistSpawn = transformNodes.find(node => node.name == this._studio.receptionistConfig.receptionistSpawn)


        console.log('设置碰撞盒子')
        this.setUpCollisionBox(meshes) //设置碰撞盒子

    }

    private setUpCollisionBox(meshes: AbstractMesh[]) { //设置碰撞盒子
        meshes.forEach(mesh => {
            if (this._studio.collisionBox.find(collision => collision == mesh.name)) {
                mesh.isVisible = false //不可见
                mesh.checkCollisions = true //碰撞检测
            }
        })

        //设置地面为可见的
        let ground = meshes.find(mesh => mesh.name == this._studio.groundName);
        if (ground) {
            ground.isVisible = true
        }
    }

    private async setUpPlayer() { //设置玩家
        this._playerManager = new PlayerManager(this._scene, this._studio.playerModelURL);
        await this._playerManager.loadPlayer()
        //设置玩家的位置
        if (this._playerSpawn) {
            this._playerManager.playerPosition = this._playerSpawn.position
        } else {
            console.log('没有设置玩家的起始位置')
        }
    }

    private setUpShadow() {
        const shadowGenerator = new ShadowGenerator(1024, this._directionalLight);
        shadowGenerator.usePercentageCloserFiltering = true //使用PCF阴影
        shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH //高质量
        shadowGenerator.getShadowMap()!.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE //只计算一次light map
        this._scene.meshes.forEach(mesh => {
            if (mesh.name == this._studio.groundName) {
                return
            }
            shadowGenerator.addShadowCaster(mesh, false) //添加到shadowGenerator
        })

        let ground = this._scene.getMeshByName(this._studio.groundName); //地面
        if (ground) {
            ground.receiveShadows = true //地面接受阴影
        }
    }

    private setUpRotateCamera() {
        this._playerManager.setUpRotateCamera(this._studio.rotateCamera)
    }

    private async setUpReceptionist() {
        this._receptionManager = new ReceptionistManager(this._scene, this._studio.receptionistConfig)
        usePlayerUiState.setReceptionistManager(this._receptionManager) //设置玩家的虚拟人员
        await this._receptionManager.loadReceptionist()
        //设置虚拟人员的位置
        if (this._receptionistSpawn) {
            this._receptionManager.receptionistPosition = this._receptionistSpawn.position
        }
        //旋转虚拟人员
        this._receptionManager.receptionist.setUpRotateAlongYAxis(this._studio.receptionistConfig.receptionistRotateYAxis)

        //设置虚拟人员的谈话UI
        AdvancedDynamicTexture.CreateFullscreenUI("")


        const receptionistUiState = useReceptionistUiState; //UI状态

        let description = {
            avatarURL: "src/assets/img/avatar/javaReceptionistAvatar.png",
            info: "Hi~，欢迎来到北京三维学院Java工作室，我是你的培训师姐，我叫李丹",
            position: "Java架构高级工程师",
            title: "高级工程师"
        } as ReceptionistDescription
        receptionistUiState.setDescription(description)

        //设置  如果玩家在length距离以内,触发问候事件
        this._receptionManager.triggerOnceWhenDistanceLessThan(this._studio.receptionistConfig.distanceTrigger, this._playerManager, () => {
            this._receptionManager.playGreeting() //问候语
            receptionistUiState.setDescriptionShow(true)
        })

        this._receptionManager.triggerOnceWhenDistanceMoreThan(this._studio.receptionistConfig.distanceTrigger, this._playerManager, () => {
            receptionistUiState.setDescriptionShow(false)
        })


        //虚拟人员始终面向玩家
        this._scene.registerBeforeRender(() => {
            this._receptionManager.receptionist.lookAt(this._playerManager.playerPosition)
        })

    }



}
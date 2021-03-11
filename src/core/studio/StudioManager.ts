import {
    AbstractMesh,
    ArcRotateCamera,
    Color3,
    DirectionalLight,
    HemisphericLight,
    HighlightLayer,
    KeyboardEventTypes,
    KeyboardInfo,
    Matrix,
    Mesh,
    MeshBuilder, Observer,
    Quaternion,
    RenderTargetTexture,
    Scene,
    SceneLoader,
    ShadowGenerator, Sound,
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
import {DistanceHelper} from "../../utils/distanceHelper";
import {Web3DStudio} from "../../web3DStudio";
import {IState} from "../IState";


interface StudioSound {
    bookShelf: Sound
}

type CurrentArea = "BookShelf" | null

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
    private _bookShelfMesh: Mesh[] = []
    private _sound!: StudioSound
    private _web3DStudio: IState;

    constructor(scene: Scene, studio: Studio,web3DStudio:IState) {
        this._scene = scene;
        this._studio = studio;
        this._web3DStudio = web3DStudio;
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
        this.setUpSound() //设置声音
        this.setUpBookShelf() //设置书架
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

        meshes.forEach(mesh => {
            if (mesh.name.startsWith(this._studio.bookShelfStartName) && mesh instanceof Mesh) {
                this._bookShelfMesh.push(mesh)
            }


        })

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

    private _highlightBookShelf: boolean = true

    private _currentArea: CurrentArea = null //当前所在区域 为了键盘事件

    private setUpBookShelf() {

        this._bookShelfMesh.forEach(bookShelf => {
            bookShelf.renderOutline = true
            const sourceColor = Color3.FromHexString("#1FA2FF")
            const targetColor = Color3.FromHexString("#A6FFCB")
            bookShelf.outlineColor = sourceColor


            bookShelf.outlineWidth = 3
            let up = true
            let down = false
            //边框动画
            this._scene.registerBeforeRender(() => {
                if (this._highlightBookShelf) {
                    if (up) { //向target进行过渡
                        bookShelf.outlineWidth += 0.05
                        bookShelf.outlineColor = Color3.Lerp(bookShelf.outlineColor, targetColor, 0.02)
                        if (bookShelf.outlineWidth > 5) {
                            up = false
                            down = true
                        }
                    }
                    if (down) { //向source进行过渡
                        bookShelf.outlineColor = Color3.Lerp(bookShelf.outlineColor, sourceColor, 0.02)

                        bookShelf.outlineWidth -= 0.05
                        if (bookShelf.outlineWidth < 3) {
                            up = true
                            down = false
                        }
                    }
                }
            })


            //距离按键。。进入

            const distanceHelper = new DistanceHelper(this._scene, bookShelf, this._playerManager);
            const playerUiState = usePlayerUiState; //Ui 状态
            distanceHelper.triggerOnceWhenDistanceLessThan(1.5, () => {
                this._currentArea = "BookShelf" //当前所在位置为 图书架
                playerUiState.setDialogShowing(true) //打开对话框
                if (!this._sound.bookShelf.isPlaying)
                    this._sound.bookShelf.play()//播放一次
                playerUiState.setDialogInfo({
                    avatarURL: this._studio.playerAvatarURL,
                    title: "视频图书架",
                    info: "这里是Java工作室的电子视频图书架,按E键可以打开书架"
                })

                //注册键盘的监听器
                if (!this.keyBoardObserver) {
                    this.keyBoardObserver = this._scene.onKeyboardObservable.add(this.keyboardEventHandler)
                }

            })

            distanceHelper.triggerOnceWhenDistanceMoreThan(1.5, () => {
                this._currentArea=null //设置位置为null
                playerUiState.setDialogShowing(false) //关闭对话框
                if (this.keyBoardObserver) { //如果走出了这个范围的话 清除键盘的监听器
                    this._scene.onKeyboardObservable.remove(this.keyBoardObserver) //清除这个监听器
                }
            })
        })

    }


    private keyBoardObserver: Observer<KeyboardInfo> | null | undefined
    private keyboardEventHandler = (kbInfo: KeyboardInfo) => {
        switch (kbInfo.type) {
            case KeyboardEventTypes.KEYDOWN:
                switch (kbInfo.event.key) {
                    case 'E':
                    case "e":
                        if (this._currentArea == "BookShelf") {
                            console.log('书架范围内按E')
                            this._web3DStudio.setBookShelfShow(true)
                        } else {

                        }
                }
        }
    }


    private setUpSound() {
        const bookShelf = new Sound("", "src/assets/sound/java/bookShelf.mp3", this._scene, () => {
        }, {loop: false, autoplay: false});
        this._sound = {
            bookShelf: bookShelf

        } as StudioSound
    }
}
import {
    KeyboardEventTypes,
    KeyboardInfo,
    Observer,
    Scene,
    SceneLoader,
    ShadowGenerator,
    Sound,
    Vector3
} from "@babylonjs/core";
import {Receptionist, ReceptionistAsset} from "./receptionist";
import {Player} from "../player/player";
import {PlayerManager} from "../player/playerManager";
import {AdvancedDynamicTexture, TextBlock, Rectangle} from "@babylonjs/gui";
import {ReceptionistConfig} from "../studio/Studio";
import useTaskUiState from "../../components/GUI/task/taskUiState";
import {AbstractMesh} from "@babylonjs/core/Meshes/abstractMesh";


export class ReceptionistManager {
    private _scene: Scene;
    private _receptionistModelURL: string;
    public receptionist!: Receptionist
    private _receptionistConfig: ReceptionistConfig;
    private _firstGreetingSound?: Sound
    private _introductionSound?: Sound
    private _videoHintSound?: Sound
    private _exerciseHintSound?: Sound
    private _readingHintSound?: Sound
    private _taskFinishedHintSound?: Sound
    private _firstGreetingSoundHasPlayed: boolean = false
    private _mesh?:AbstractMesh
    constructor(scene: Scene, receptionistConfig: ReceptionistConfig) {
        this._scene = scene;
        this._receptionistModelURL = receptionistConfig.receptionistModelURL;
        this._receptionistConfig = receptionistConfig
    }

    async loadReceptionist() { //加载接待员
        let receptionistImport = await SceneLoader.ImportMeshAsync("", this._receptionistModelURL, undefined, this._scene);
        let meshes = receptionistImport.meshes; //网格对象
        let animationGroup = receptionistImport.animationGroups;
        let assets = {
            receptionistMesh: meshes[0],
            greetingAnimation: animationGroup[0]
        } as ReceptionistAsset
        this._mesh = meshes[0]  //虚拟人员的Mesh
        this.receptionist = new Receptionist(assets, this._scene);
        this.setUpSound()
        this.setUpReceptionistUI() //设置UI
    }

    public set receptionistPosition(position: Vector3) {
        this.receptionist.position.set(-position.x, position.y, position.z)
    }

    public get receptionistPosition() {
        return this.receptionist.position
    }


    private _triggeredLessThan: boolean = false

    //当与玩家的距离小于length时 触发对应的func事件   触发一次
    public triggerOnceWhenDistanceLessThan(length: number, playerManager: PlayerManager, func: () => void) {
        this._scene.registerBeforeRender(() => {
            const distance = playerManager.playerPosition.subtract(this.receptionistPosition).length()
            if (!this._triggeredLessThan && distance < length) {
                this._triggeredLessThan = true
                //注册键盘的监听器
                if (!this.keyBoardObserver) {
                    this.keyBoardObserver = this._scene.onKeyboardObservable.add(this.keyboardEventHandler)
                }
                func()
            }
        })
        this._scene.registerAfterRender(() => {
            const distance = playerManager.playerPosition.subtract(this.receptionistPosition).length()
            if (distance > length) {
                this._triggeredLessThan = false
                if (this.keyBoardObserver) { //如果走出了这个范围的话 清除键盘的监听器
                    this._scene.onKeyboardObservable.remove(this.keyBoardObserver) //清除这个监听器
                    this.keyBoardObserver = null
                }
            }
        })
    }

    private _triggeredMoreThan: boolean = false

    public triggerOnceWhenDistanceMoreThan(length: number, playerManager: PlayerManager, func: () => void) {
        this._scene.registerBeforeRender(() => {
            const distance = playerManager.playerPosition.subtract(this.receptionistPosition).length()
            if (!this._triggeredMoreThan && distance > length) {
                this._triggeredMoreThan = true
                func()
            }
        })
        this._scene.registerAfterRender(() => {
            const distance = playerManager.playerPosition.subtract(this.receptionistPosition).length()
            if (distance < length) {
                this._triggeredMoreThan = false

            }
        })
    }


    //小于length时 始终触发
    public triggerWhenDistanceLessThan(length: number, playerManager: PlayerManager, func: () => void) {
        this._scene.registerBeforeRender(() => {
            const distance = playerManager.playerPosition.subtract(this.receptionistPosition).length()
            if (distance < length) {
                func()
            }
        })
    }


    public setUpReceptionistUI() { //设置虚拟人员的UI
        const ui = AdvancedDynamicTexture.CreateFullscreenUI("ReceptionistUI", true);

        const textBlock = new TextBlock();
        textBlock.text = "按E键打开任务面板" //按键提示
        const rectangle = new Rectangle();
        rectangle.width = "200px"
        rectangle.height = "40px"
        rectangle.cornerRadius = 20
        rectangle.color = "black"
        rectangle.thickness = 3
        rectangle.fontFamily = "Microsoft Yahei"
        rectangle.background = "white"
        rectangle.addControl(textBlock)

        ui.addControl(rectangle)
        rectangle.linkWithMesh(this.receptionist)
        rectangle.linkOffsetY = -180 //向上偏移
    }

    private setUpSound() {
        this._firstGreetingSound = new Sound("greetingSound", this._receptionistConfig.greetingSoundURL, this._scene, null, {
            autoplay: false,
            loop: false
        })
        this._introductionSound = new Sound("introductionSound", this._receptionistConfig.introductionSoundURL, this._scene, null, {
            autoplay: false,
            loop: false
        })
        this._videoHintSound = new Sound("videoHintSound", "sound/taskHint/videoHint.mp3", this._scene, null, {
            autoplay: false,
            loop: false
        })
        this._exerciseHintSound = new Sound("exerciseHintSound", "sound/taskHint/exerciseHint.mp3", this._scene, null, {
            autoplay: false,
            loop: false
        })
        this._readingHintSound = new Sound("readingHintSound", "sound/taskHint/readingHint.mp3", this._scene, null, {
            autoplay: false,
            loop: false
        })
        this._taskFinishedHintSound = new Sound("taskFinishedHintSound", "sound/taskHint/taskFinishedHint.mp3", this._scene, null, {
            autoplay: false,
            loop: false
        })
    }

    public playVideoHintSound() {
        this._videoHintSound?.play()
    }

    public playReadingHintSound() {
        this._readingHintSound?.play()
    }

    public playExerciseHintSound() {
        this._exerciseHintSound?.play()
    }

    public playTaskFinishedHintSound() {
        this._taskFinishedHintSound?.play()
    }

    public playGreeting() {
        //播放声音
        if (this._firstGreetingSound && !this._firstGreetingSound.isPlaying) {
            if (!this._firstGreetingSoundHasPlayed) {
                this._firstGreetingSoundHasPlayed = true
                this._firstGreetingSound.play()
            } else {
                if (!this._introductionSound?.isPlaying) {
                    this._introductionSound?.play()
                }
            }
        }

        this.receptionist.playGreetingAnimation()
    }


    private keyBoardObserver: Observer<KeyboardInfo> | null | undefined
    private keyboardEventHandler = (kbInfo: KeyboardInfo) => {

        const taskUiState = useTaskUiState; //UI界面状态
        switch (kbInfo.type) {
            case KeyboardEventTypes.KEYDOWN:
                switch (kbInfo.event.key) {
                    case 'E':
                    case "e":
                        taskUiState.setShowing(true) //显示UI界面
                }
        }
    }

    setUpShadow(_shadowGenerator: ShadowGenerator) {
        if (this._mesh){
            const childMeshes = this._mesh.getChildMeshes();
            childMeshes.forEach(mesh=>{
                _shadowGenerator.addShadowCaster(mesh)
            })
        }
    }
}

import {Scene, SceneLoader, Sound, Vector3} from "@babylonjs/core";
import {Receptionist, ReceptionistAsset} from "./receptionist";
import {Player} from "../player/player";
import {PlayerManager} from "../player/playerManager";
import {AdvancedDynamicTexture, TextBlock, Rectangle} from "@babylonjs/gui";
import {ReceptionistConfig} from "../studio/Studio";


export class ReceptionistManager {
    private _scene: Scene;
    private _receptionistModelURL: string;
    public receptionist!: Receptionist
    private _receptionistConfig: ReceptionistConfig;
    private _greetingSound?: Sound

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
                func()
            }
        })
        this._scene.registerAfterRender(() => {
            const distance = playerManager.playerPosition.subtract(this.receptionistPosition).length()
            if (distance > length) {
                this._triggeredLessThan = false
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
        console.log(this._receptionistConfig.greetingSoundURL)
        this._greetingSound = new Sound("greetingSound", this._receptionistConfig.greetingSoundURL, this._scene, null, {
            autoplay: false,
            loop: false
        })

    }

    public playGreeting() {
        //播放声音
        if (this._greetingSound && !this._greetingSound.isPlaying) {
            this._greetingSound.play()
        }

        this.receptionist.playGreetingAnimation()
    }
}
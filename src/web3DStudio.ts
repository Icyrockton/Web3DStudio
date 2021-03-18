import {ArcRotateCamera, Engine, Scene, SceneLoader, Vector2, Vector3} from "@babylonjs/core";
import {LoadingScene} from "./core/loadingScene";
import {ResourceManager} from "./utils/resourceManager";
import {__DEBUG__} from './global'
import "@babylonjs/inspector";
import {CollegeMapManager} from "./core/collegeMap/collegeMapManager";
import {IState} from "./core/IState";
import {College, SimpleStudio} from "./core/collegeMap/college";
import {CollegeFloors, CollegeManager} from "./core/college/collegeManager";
import {StudioManager} from "./core/studio/StudioManager";
import {ReceptionistConfig, Studio} from "./core/studio/Studio";
import {BookShelf} from "./core/bookShelf/bookShelf";
import useBookShelfUiState from "./components/GUI/bookShelf/bookShelfUiState";
import {PracticeTable} from "./core/practiceTable/practiceTable";
import usePracticeTableUiState from "./components/GUI/practiceTable/practiceTableUiState";
import {fakeCollegeFloors} from "./core/college/collegeFloorApi";

//定义不同的状态 初始化,选择学院,选择工作室,进入工作室后
export enum State { init, chooseCollege, chooseStudio, studio }


export class Web3DStudio implements IState {


    private _bookShelfShowing: boolean = false //书架显示
    private _practiceTableShowing: boolean = false //练习台显示
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _scene: Scene
    private _state: State = State.init
    private _bookShelf: BookShelf | null = null
    private _practiceTable: PracticeTable | null = null

    /*
        Web3DStudio 构造函数
    */
    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;

        this._engine = new Engine(this._canvas, true, {stencil: true})  //开启抗锯齿
        this._scene = new Scene(this._engine);//初始化场景

        SceneLoader.ShowLoadingScreen = false //关闭默认的loading UI

        this.setBookShelfScene()
        this.setPracticeTableScene()

        this.setDebugUI()
        this.run()//运行渲染函数

        this.setLoadingAnimation() //开启加载动画


    }

    setDebugUI() {
        if (__DEBUG__) {
            window.addEventListener('keydown', (event) => {
                if (event.ctrlKey && event.keyCode === 73) {  //ALT+I 打开debug layer
                    if (this._scene.debugLayer.isVisible()) {
                        this._scene.debugLayer.hide()
                    } else {
                        console.log('打开debug tab');
                        this._scene.debugLayer.show()
                    }
                }
            })
        }
    }


    run() {
        this._engine.runRenderLoop(() => {
            this._scene.render()
            //图书架渲染
            if (this._bookShelfShowing) {
                if (this._bookShelf == null) {
                    this._bookShelf = new BookShelf(this._engine)
                } else {
                    this._bookShelf.render()
                }
            }
            //练习台渲染
            if (this._practiceTableShowing) {
                if (this._practiceTable == null) {
                    this._practiceTable = new PracticeTable(this._engine)
                    const practiceTableUiState = usePracticeTableUiState;
                    practiceTableUiState.practiceTable = this._practiceTable
                } else {
                    this._practiceTable.render()
                }
            }
        })
        window.addEventListener('resize', _ => {
            this._engine.resize() //监听窗口调整大小事件
        })
    }


    private loadingScene?: LoadingScene


    async setLoadingAnimation() { //设置加载动画

        this.loadingScene = new LoadingScene(this._scene)

        // await this.goToCollegeMap() //切换到地图场景


        //暂时直接
        await  this.goToCollege(fakeCollegeFloors)

        //暂时直接


        // let fakeStudio = {
        //     name: "java工作室",
        //     modelURL: "src/assets/model/studio/java_studio.glb",
        //     playerModelURL: "src/assets/model/player.glb",
        //     description: "java工作室 一个学习高并发的工作室",
        //     playerSpawn: "playerSpawn",
        //     collisionBox: ["collision", "ground"],
        //     groundName: "ground",
        //     playerAvatarURL: "src/assets/img/avatar/playerAvatar.png",
        //     directionalLightPosition: new Vector3(-10, 10, -10),
        //     bookShelfStartName: "BookShelf",
        //     practiceTableStartName: "PracticeTable",
        //     receptionistConfig: {
        //         receptionistModelURL: "src/assets/model/receptionist.glb",
        //         receptionistSpawn: "receptionistSpawn",
        //         receptionistRotateYAxis: Math.PI / 2,
        //         distanceTrigger: 2,
        //         greetingSoundURL: "src/assets/sound/javaGreeting.mp3",
        //         introductionSoundURL: "src/assets/sound/javaIntroduction.mp3"
        //     } as ReceptionistConfig,
        //     rotateCamera: [
        //         {mesh: "cameraRotate_1", rotate: 0},
        //         {mesh: "cameraRotate_2", rotate: -Math.PI / 2},
        //         {mesh: "cameraRotate_3", rotate: Math.PI / 2},
        //         {mesh: "cameraRotate_4", rotate: 0},
        //         {mesh: "cameraRotate_5", rotate: Math.PI},
        //     ],
        //     studioAIs: [
        //         {
        //             name: "黄奥",
        //             info: ["同学，你今天Java学习的怎么样了", "JDK是JAVA的开发工具包"],
        //             infoSoundURL:["src/assets/sound/java/ai/Java学习的怎么样了.mp3","src/assets/sound/java/ai/JDK是JAVA的开发工具包.mp3"],
        //             title: "Java高级工程师",
        //             position: "Java高级工程师",
        //             modelURL: "src/assets/model/ai/ai_1.glb",
        //             idleAnimationGroupName: "Idle",
        //             walkAnimationGroupName: "Walk",
        //             leftTurnAnimationGroupName: "LeftTurn",
        //             rightTurnAnimationGroupName: "RightTurn",
        //             avatarURL: "src/assets/img/avatar/ai_1.png",
        //             path: [
        //                 {
        //                     nodeName: "aiPath-1.001",
        //                     residenceTime: 4000,
        //                 }, {
        //                     nodeName: "aiPath-1.002",
        //                     residenceTime: 4000,
        //                 },
        //                 {
        //                     nodeName: "aiPath-1.003",
        //                     residenceTime: 6000,
        //                 },
        //                 {
        //                     nodeName: "aiPath-1.004",
        //                     residenceTime: 4000,
        //                 }
        //             ]
        //         },
        //         {
        //             name: "余少",
        //             info: ["你还记得jvm有多少种垃圾收集器吗", "你还记得字节码是什么吗"],
        //             infoSoundURL:["src/assets/sound/java/ai/jvm有多少种垃圾收集器.mp3","src/assets/sound/java/ai/字节码是什么.mp3"],
        //             title: "Java高级工程师",
        //             position: "Java高级工程师",
        //             modelURL: "src/assets/model/ai/ai_2.glb",
        //             idleAnimationGroupName: "Idle",
        //             walkAnimationGroupName: "Walk",
        //             leftTurnAnimationGroupName: "LeftTurn",
        //             rightTurnAnimationGroupName: "RightTurn",
        //             avatarURL: "src/assets/img/avatar/ai_2.png",
        //             path: [
        //                 {
        //                     nodeName: "aiPath-2.001",
        //                     residenceTime: 5000,
        //                 }, {
        //                     nodeName: "aiPath-2.002",
        //                     residenceTime: 4000,
        //                 }, {
        //                     nodeName: "aiPath-2.003",
        //                     residenceTime: 3000,
        //                 }, {
        //                     nodeName: "aiPath-2.004",
        //                     residenceTime: 6000,
        //                 }
        //             ]
        //         },
        //         {
        //             name: "黄笨蛋",
        //             info: ["for循环的lambda形式是什么呢", "生产者消费者问题"],
        //             infoSoundURL:["src/assets/sound/java/ai/for循环的lambda形式是什么呢.mp3","src/assets/sound/java/ai/生产者消费者问题.mp3"],
        //             title: "Java高级工程师",
        //             position: "Java高级工程师",
        //             modelURL: "src/assets/model/ai/ai_3.glb",
        //             idleAnimationGroupName: "Idle",
        //             walkAnimationGroupName: "Walk",
        //             leftTurnAnimationGroupName: "LeftTurn",
        //             rightTurnAnimationGroupName: "RightTurn",
        //             avatarURL: "src/assets/img/avatar/ai_3.png",
        //             path: [
        //                 {
        //                     nodeName: "aiPath-3.001",
        //                     residenceTime: 5000,
        //                 }, {
        //                     nodeName: "aiPath-3.002",
        //                     residenceTime: 4000,
        //                 }, {
        //                     nodeName: "aiPath-3.003",
        //                     residenceTime: 5000,
        //                 }, {
        //                     nodeName: "aiPath-3.004",
        //                     residenceTime: 2000,
        //                 }
        //             ]
        //         },
        //
        //     ]
        // } as Studio

        // await this.goToStudio(fakeStudio)
    }


    async goToCollegeMap() {
        let mapScene = new Scene(this._engine)

        let manager = new CollegeMapManager(mapScene, this._canvas, this)
        await manager.load()

        this._scene.dispose()
        this._scene = mapScene


        //this._scene.debugLayer.show()
    }


    async goToCollege(collegeFloors: CollegeFloors) {
        let collegeScene = new Scene(this._engine)
        let manager = new CollegeManager(collegeScene, this , collegeFloors)
        await manager.load()

        this._scene.dispose()
        this._scene = collegeScene
        this._scene.debugLayer.show()
    }


    async goToStudio(studio: Studio) {
        console.log('进入工作室')
        let studioScene = new Scene(this._engine)

        let manager = new StudioManager(studioScene, studio, this)
        await manager.load()
        this._scene.dispose()
        this._scene = studioScene
        this._scene.debugLayer.show()
    }

    private setBookShelfScene() {
        const bookShelfUiState = useBookShelfUiState;
        bookShelfUiState.web3DStudio = this //注入web3DStudio
    }

    setBookShelfShow(showing: boolean): void {
        this._bookShelfShowing = showing
        if (this._bookShelfShowing) { //显示关闭UI
            const bookShelfUiState = useBookShelfUiState;
            bookShelfUiState.setShelfShowing(true) //显示关闭UI
        }
    }

    setPracticeTableShow(showing: boolean): void {
        this._practiceTableShowing = showing
        if (this._practiceTableShowing) {
            const practiceTableUiState = usePracticeTableUiState;
            practiceTableUiState.setPracticeTableShowing(true) //显示关闭UI
        }
    }


    private setPracticeTableScene() {
        const practiceTableUiState = usePracticeTableUiState;
        practiceTableUiState.web3DStudio = this //注入web3DStudio
    }
}

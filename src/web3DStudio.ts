import {ArcRotateCamera, Engine, Scene, SceneLoader, Vector2, Vector3} from "@babylonjs/core";
import {LoadingScene} from "./core/loadingScene";
import {ResourceManager} from "./utils/resourceManager";
import {__DEBUG__} from './global'
import "@babylonjs/inspector";
import {CollegeMapManager} from "./core/collegeMap/collegeMapManager";
import {IState} from "./core/IState";
import {College, SimpleStudio} from "./core/collegeMap/college";
import {CollegeManager} from "./core/college/collegeManager";
import {StudioManager} from "./core/studio/StudioManager";
import {ReceptionistConfig, Studio} from "./core/studio/Studio";

//定义不同的状态 初始化,选择学院,选择工作室,进入工作室后
export enum State { init, chooseCollege, chooseStudio, studio }


export class Web3DStudio implements IState {

    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _scene: Scene
    private _state: State = State.init

    /*
        Web3DStudio 构造函数
    */
    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;

        this._engine = new Engine(this._canvas, true)  //开启抗锯齿
        this._scene = new Scene(this._engine);//初始化场景
        SceneLoader.ShowLoadingScreen = false //关闭默认的loading UI

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
        })
        window.addEventListener('resize', _ => {
            this._engine.resize() //监听窗口调整大小事件
        })
    }


    private loadingScene?: LoadingScene


    async setLoadingAnimation() { //设置加载动画

        this.loadingScene = new LoadingScene(this._scene)

        //await this.goToCollegeMap() //切换到地图场景

        //暂时直接
        //await  this.goToCollege("北京三维学院")

        //暂时直接


        let fakeStudio = {
            name: "java工作室",
            modelURL: "src/assets/model/studio/java_studio.glb",
            playerModelURL: "src/assets/model/player.glb",
            description: "java工作室 一个学习高并发的工作室",
            playerSpawn: "playerSpawn",
            collisionBox: ["collision", "ground"],
            groundName: "ground",
            directionalLightPosition: new Vector3(-10, 10, -10),
            receptionistConfig: {
                receptionistModelURL: "src/assets/model/receptionist.glb",
                receptionistSpawn: "receptionistSpawn",
                receptionistRotateYAxis: Math.PI / 2,
                distanceTrigger:3,
                greetingSoundURL:"src/assets/sound/javaGreeting.mp3"
            } as ReceptionistConfig,
            rotateCamera: [
                {mesh: "cameraRotate_1", rotate: 0},
                {mesh: "cameraRotate_2", rotate: -Math.PI / 2},
                {mesh: "cameraRotate_3", rotate: Math.PI / 2},
                {mesh: "cameraRotate_4", rotate: 0},
                {mesh: "cameraRotate_5", rotate: Math.PI},
            ]
        } as Studio

        await this.goToStudio(fakeStudio)
    }


    async goToCollegeMap() {
        let mapScene = new Scene(this._engine)

        let manager = new CollegeMapManager(mapScene, this._canvas, this)
        await manager.load()

        this._scene.dispose()
        this._scene = mapScene


        //this._scene.debugLayer.show()
    }


    async goToCollege(collegeName: string) {
        let collegeScene = new Scene(this._engine)
        let manager = new CollegeManager(collegeScene)
        await manager.load()

        this._scene.dispose()
        this._scene = collegeScene
        this._scene.debugLayer.show()
    }


    async goToStudio(studio: Studio) {
        console.log('进入工作室')
        let studioScene = new Scene(this._engine)

        let manager = new StudioManager(studioScene, studio)
        await manager.load()
        this._scene.dispose()
        this._scene = studioScene
        this._scene.debugLayer.show()
    }

}
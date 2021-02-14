import { ArcRotateCamera, Engine, Scene, SceneLoader, Vector2, Vector3 } from "@babylonjs/core";
import { LoadingScene } from "./core/loadingScene";
import { ResourceManager } from "./utils/resourceManager";
import { __DEBUG__ } from './global'
import "@babylonjs/inspector";
import { CollegeManager } from "./core/college/collegeManager";

//定义不同的状态 初始化,选择学院,选择工作室,进入工作室后
export enum State { init, chooseCollege, chooseStudio, studio }


export class Web3DStudio {

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
        SceneLoader.ShowLoadingScreen = false
        this._scene.debugLayer.show()
        
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
                    }
                    else {
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


        let mapScene = new Scene(this._engine)

        let manager = new CollegeManager(mapScene,this._canvas)
        await manager.load()

        this._scene.dispose()
        this._scene = mapScene


        this._scene.debugLayer.show()

        let name = new Vector2(0,0)
        console.log(name.length());
        
    }

    loadResource() {



    }
}
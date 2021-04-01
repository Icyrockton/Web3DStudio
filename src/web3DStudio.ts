import {Engine, Scene, SceneLoader} from "@babylonjs/core";
import {LoadingScene} from "./core/loadingScene";
import {__DEBUG__} from './global'
import "@babylonjs/inspector";
import {CollegeMapManager} from "./core/collegeMap/collegeMapManager";
import {IState} from "./core/IState";
import {CollegeManager} from "./core/college/collegeManager";
import {BookShelf} from "./core/bookShelf/bookShelf";
import useBookShelfUiState from "./components/GUI/bookShelf/bookShelfUiState";
import {PracticeTable} from "./core/practiceTable/practiceTable";
import usePracticeTableUiState from "./components/GUI/practiceTable/practiceTableUiState";
import {fakeCollegeFloors} from "./core/college/collegeFloorApi";
import useFloorUiState from "./components/GUI/floor/floorUiState";
import {fakeCollegeMap} from "./core/collegeMap/collegeMapApi";
import {StudioManager} from "./core/studio/StudioManager";
import {fakeStudio} from "./core/studio/StudioApi";
import usePlayerUiState from "./components/GUI/player/playerUiState";
import useNavUiState from "./components/GUI/nav/navUiState";

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
    private loadingScene: LoadingScene

    /*
        Web3DStudio 构造函数
    */
    constructor(canvas: HTMLCanvasElement) {
        SceneLoader.ShowLoadingScreen = false //关闭默认的loading UI
        this._canvas = canvas;
        this._engine = new Engine(this._canvas, true, {stencil: true})  //开启抗锯齿
        this._scene = new Scene(this._engine);//初始化场景
        this.loadingScene = new LoadingScene(this._scene)
        useNavUiState.navController =this //注入controller
        this.setBookShelfScene()
        this.setPracticeTableScene()

        this.setDebugUI()
        this.run()//运行渲染函数

        this.setLoadingAnimation() //开启加载动画


    }

    setDebugUI() {
        if (__DEBUG__) {
            window.addEventListener('keydown', (event) => {
                if ((event.ctrlKey && event.keyCode === 73) || (event.shiftKey && event.keyCode === 73)) {  //CTRL+I 打开debug layer
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
                    this._bookShelf.render()
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
                    this._practiceTable.render()
                } else {
                    this._practiceTable.render()
                }
            }
        })
        window.addEventListener('resize', _ => {
            this._engine.resize() //监听窗口调整大小事件
        })
    }


    async setLoadingAnimation() { //设置加载动画

        //await this.goToCollegeMap() //切换到地图场景


        //暂时直接
         // await  this.goToCollege(1)

        //暂时直接


       await this.goToStudio(1)
    }

    focusCanvas(): void {
        this._canvas.focus()
    }


    async goToCollegeMap() {
        let mapScene = new Scene(this._engine)
        //网络获取学院地图
        useNavUiState.setNavShowing(false) //关闭导航UI
        const floorUiState = useFloorUiState;
        floorUiState.setFloorUiShowing(false)
        floorUiState.setVisitStudioUiShowing(false)
        floorUiState.setEveryFloorUiShowing(false)
        floorUiState.setVisitUiShowing(false)

        const collegeMap = fakeCollegeMap;
        let manager = new CollegeMapManager(mapScene, this, collegeMap)
        await manager.load()

        this._scene = mapScene
        //this._scene.debugLayer.show()
    }


    async goToCollege(collegeUUid: number) {  //传递进来collegeUUid
        useNavUiState.setNavShowing(false) //关闭导航UI
        useNavUiState.currentCollegeId = collegeUUid //当前的ID
        const prevScene = this._scene
        this.changeToLoadingScene() //切换到加载场景

        let collegeScene = new Scene(this._engine)
        let manager = new CollegeManager(collegeScene, this, fakeCollegeFloors)
        await manager.load()
        useFloorUiState.setFloorUiShowing(true) //显示UI
        useFloorUiState.setEveryFloorUiShowing(true)
        useNavUiState.setNavShowing(true) //打开导航UI
        useNavUiState.setNavToMapShowing(true)
        useNavUiState.setNavToCollegeShowing(false)
        this._scene = collegeScene
        prevScene.dispose() //dispose
        //this._scene.debugLayer.show()
    }

    private changeToLoadingScene() {
        this._scene = this.loadingScene.scene
    }

    static NEED_HINT = true //需要按键提示

    async goToStudio(studioUUid: number) {   //前往工作室
        //关闭上一个场景的UI
        const floorUiState = useFloorUiState;
        floorUiState.setFloorUiShowing(false)
        floorUiState.setVisitStudioUiShowing(false)
        floorUiState.setEveryFloorUiShowing(false)
        floorUiState.setVisitUiShowing(false)


        const prevScene = this._scene
        this.changeToLoadingScene()
        useNavUiState.setNavShowing(false) //关闭导航UI

        let studioScene = new Scene(this._engine)
        let manager = new StudioManager(studioScene, fakeStudio, this)
        await manager.load()

        const playerUiState = usePlayerUiState;
        playerUiState.setShowing(true) //任务栏打卡
        if (Web3DStudio.NEED_HINT) {
            playerUiState.setKeyBoardHintShow(true) //打开键盘提示
            Web3DStudio.NEED_HINT=false
        }
        prevScene.dispose()//dispose
        this._scene = studioScene
        useNavUiState.setNavShowing(true) //打开导航UI
        useNavUiState.setNavToMapShowing(true)
        useNavUiState.setNavToCollegeShowing(true)
        //this._scene.debugLayer.show()
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

import {
    Animation,
    ArcRotateCamera, CircleEase, CubicEase,
    EasingFunction, HemisphericLight, HighlightLayer, IAnimationKey,
    Mesh,
    Scene,
    SceneLoader,
    Vector3
} from "@babylonjs/core";
import {Player, PlayerAssets} from "../player/player";
import {InputController} from "../player/inputController";
import {IState} from "../IState";
import {CollegeFloor} from "./collegeFloor";
import useFloorUiState from "../../components/GUI/floor/floorUiState";
import {values} from "mobx";
import {AdvancedDynamicTexture} from "@babylonjs/gui";
import {VisitPlayerManager} from "../player/visitPlayerManager";


export interface CollegeStudio { //学院的每一间工作室
    uuid: number //工作室的编号
    location: number //工作室位置    1~8
    name: string //工作室的名称
    description: string //工作室描述
    logoURL: string //工作室的LOGO图片地址
    posterURL: string //工作室的海报地址
}


export interface Floor {
    floorNumber: number //是哪层...
    studios: CollegeStudio[]
}

export interface CollegeFloors { //学院的所有楼层
    uuid: number //学院的id
    name: string //学院的名称
    totalFloor: number //总楼层数
    floors: Floor[]
}

//工作室的选择
export class CollegeManager {
    static readonly PLAYER_MODEL_URL = "model/player.glb"
    static readonly PLAYER_ARROW_MODEL_URL = "model/player_arrow.glb"
    static readonly FLOOR_MODEL_URL = "model/floor.glb"


    private _scene: Scene;
    private _web3DStudio: IState;
    private _collegeFloors: CollegeFloors;
    private _collegeFloorInstances: CollegeFloor [ ] = [] //保存floor的实例
    private _currentFloorNum: number
    private _maxYPos: number
    private _cameraTarget: Vector3 = new Vector3()
    private _arcRotateCamera!: ArcRotateCamera
    private _ui?: AdvancedDynamicTexture
    private _highLightLayer: HighlightLayer
    private _visitPlayerManager: VisitPlayerManager

    constructor(collegeScene: Scene, web3DStudio: IState, collegeFloors: CollegeFloors) {
        this._scene = collegeScene;
        this._collegeFloors = collegeFloors; //所有数据
        useFloorUiState.collegeManager = this //注入this
        useFloorUiState.setFloorInfo(collegeFloors) //设置信息
        useFloorUiState.setFloorTotalNumber(collegeFloors.totalFloor) //设置楼层数目

        this._highLightLayer = new HighlightLayer("floorHighlightLayer", this._scene)
        this._currentFloorNum = -1 //-1代表显示所有楼层
        this._scene.collisionsEnabled = true //打开碰撞
        this._web3DStudio = web3DStudio;
        this._maxYPos = this._collegeFloors.totalFloor * CollegeFloor.HEIGHT + 100  //动画到达的最高位置
        this._visitPlayerManager = new VisitPlayerManager(this._scene, CollegeManager.PLAYER_MODEL_URL, CollegeManager.PLAYER_ARROW_MODEL_URL)
    }

    async load() {
        this.setUpLight()
        await this.loadModel()
        await this._visitPlayerManager.loadPlayer()
        this.invisiblePlayer()
        this.setUpCamera()
    }


    setUpCamera() {
        const distance = this._collegeFloors.totalFloor * CollegeFloor.HEIGHT
        this._cameraTarget = new Vector3(0, distance / 2, 20)
        const arcRotateCamera = new ArcRotateCamera("camera", 0, 0, 60, this._cameraTarget, this._scene);
        arcRotateCamera.attachControl()
        this._arcRotateCamera = arcRotateCamera
        this._scene.activeCamera = this._arcRotateCamera //活动摄像机
        this.beginStartCameraAnimation()
    }


    setUpLight() {
        const hemisphericLight = new HemisphericLight("hemisphericLight", Vector3.Up(), this._scene);
        hemisphericLight.intensity = 1
    }

    private async loadModel() { //加载模型
        let floorModel = await SceneLoader.ImportMeshAsync("", CollegeManager.FLOOR_MODEL_URL, undefined, this._scene)
        const floorRoot = floorModel.meshes[0] as Mesh

        this._collegeFloors.floors.forEach(floorInfo => {
            const collegeFloor = new CollegeFloor(this._scene, this._web3DStudio, floorInfo, floorRoot, this._maxYPos);
            this._collegeFloorInstances.push(collegeFloor) //保存实例
        })

        floorRoot.isVisible = false  //所有的导入的gltf都不可见 只作为clone对象
        floorModel.meshes.forEach(mesh => {
            mesh.isVisible = false
            mesh.isPickable = false
        })


    }


    private _animating: boolean = false //是否在动画..
    goToFloor(floorNum: number) {
        if (floorNum == this._currentFloorNum)  //什么也不做
            return
        useFloorUiState.setVisitStudioUiShowing(false)
        if (this._animating)
            return;
        this._animating = true
        if (this._visiting) {
            this._visiting = false //没有在游览状态
            this._scene.activeCamera = this._arcRotateCamera //摄像机活动
        }
        this.invisiblePlayer()
        this.hideVisitUi()
        this.floorTranslucent()
        if (floorNum == -1) {  //目标是显示所有楼层
            //压入 this._currentFloorNum + 1 ~ floorNum
            for (let i = this._currentFloorNum + 1; i <= this._collegeFloors.totalFloor; i++) {
                const floor = this._collegeFloorInstances[i - 1];
                if (i != this._collegeFloors.totalFloor) {
                    floor.pushToOrigin(300 * (i - this._currentFloorNum))
                } else {
                    floor.pushToOrigin(300 * (i - this._currentFloorNum), () => {
                        this._animating = false
                        this._currentFloorNum = -1 //值置位 -1
                        this.updateCameraTarget()
                        useFloorUiState.setEveryFloorUiShowing(true) //显示左侧的UI

                    })

                }
            }
            if (this._currentFloorNum + 1 > this._collegeFloors.totalFloor) { //如果是顶楼了... 上面的for不会执行
                this._animating = false
                this._currentFloorNum = -1 //值置位 -1
                this.updateCameraTarget()
                useFloorUiState.setEveryFloorUiShowing(true) //显示左侧的UI
            }
            return;
        }
        if (this._currentFloorNum == -1) {  //之前的状态是显示所有的楼层
            useFloorUiState.setEveryFloorUiShowing(false)//显示左侧的UI
            //特判 如果此时楼层点击的是最高楼层... 那么显示最高楼层
            if (floorNum == this._collegeFloors.totalFloor) {
                this.updateCameraTarget()
                this.floorStudioBoxVisible(floorNum)
                this.floorVisible(floorNum, () => {
                        this._animating = false
                        this.showVisitUi()
                    }
                )
                this._currentFloorNum = floorNum
                this.updateCameraTarget()
                return;
            }

            //那就是弹出楼层
            for (let i = this._collegeFloors.totalFloor; i > floorNum; i--) {
                const floor = this._collegeFloorInstances[i - 1];
                if (i != floorNum + 1) {
                    floor.popToMaxHeight(300 * (this._collegeFloors.totalFloor - i))
                } else {
                    floor.popToMaxHeight(300 * (this._collegeFloors.totalFloor - i), () => {
                        this.floorVisible(floorNum, () => {
                            this._animating = false
                            this.showVisitUi()
                        })
                        this.updateCameraTarget()
                        this.floorStudioBoxVisible(floorNum)

                    })
                }
            }
            this._currentFloorNum = floorNum
        } else {
            if (this._currentFloorNum > floorNum) {   //向上弹出楼层
                //弹出  floorNum+1 ~ this._currentFloorNum
                for (let i = this._currentFloorNum; i > floorNum; i--) {
                    const floor = this._collegeFloorInstances[i - 1];
                    if (i != floorNum + 1) {
                        floor.popToMaxHeight(300 * (this._currentFloorNum - i))
                    } else {
                        floor.popToMaxHeight(300 * (this._currentFloorNum - i), () => {
                            this.floorVisible(floorNum, () => {
                                this._animating = false
                                this.showVisitUi()
                            })
                            this.updateCameraTarget()
                            this.floorStudioBoxVisible(floorNum)
                        })
                    }
                }
            } else { //向下压入楼层
                //压入 this._currentFloorNum + 1 ~ floorNum
                for (let i = this._currentFloorNum + 1; i <= floorNum; i++) {
                    const floor = this._collegeFloorInstances[i - 1];
                    // floor.pushToOrigin(0)
                    if (i != floorNum) {
                        floor.pushToOrigin(300 * (i - this._currentFloorNum))
                    } else {
                        floor.pushToOrigin(300 * (i - this._currentFloorNum), () => {
                            this.floorVisible(floorNum, () => {
                                this._animating = false
                                this.showVisitUi()
                            })
                            this.updateCameraTarget()
                            this.floorStudioBoxVisible(floorNum)
                        })

                    }
                }
            }
            this._currentFloorNum = floorNum
        }
    }

    private floorVisible(floorNum: number, onAnimationEnd?: () => void) {
        this._collegeFloorInstances[floorNum - 1].floorVisible(onAnimationEnd)
    }

    private floorStudioBoxVisible(floorNum: number) {
        const floor = this._collegeFloorInstances[floorNum - 1];
        floor.visibleStudioBox()
        //设置盒子上方的UI
        this._ui = AdvancedDynamicTexture.CreateFullscreenUI("floorUi", true, this._scene)
        floor.showStudioName(this._ui)
        floor.setHighLight(this._highLightLayer)  //设置highlight Layer
        floor.showUnnecessary() //显示不必要项
    }


    private floorTranslucent() {  //将所有楼层变为半透明
        this._ui?.dispose()
        this._collegeFloorInstances.forEach(floor => {
            floor.translucent()
            floor.invisibleStudioBox()
            floor.hideUnnecessary() //隐藏不必要的东西
        })
    }


    private hideVisitUi() {
        const floorUiState = useFloorUiState;
        floorUiState.setVisitUiShowing(false)
    }

    private showVisitUi() {
        const floorUiState = useFloorUiState;
        floorUiState.setVisitUiShowing(true)
    }

    private updateCameraTarget() {

        this._scene.beginDirectAnimation(this._arcRotateCamera, this.createCameraAnim(), 0, CollegeFloor.frameRate * 2, false)
    }

    private createCameraAnim() {  //摄像机的帧动画

        const targetAnimation = new Animation("targetAnimation", "target", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const targetKeyFrames: IAnimationKey[] = []
        const distance = this._currentFloorNum == -1 ? (this._collegeFloors.totalFloor) * CollegeFloor.HEIGHT : this._currentFloorNum * CollegeFloor.HEIGHT
        const newTarget = this._currentFloorNum == -1 ? new Vector3(0, distance / 2, 20) : new Vector3(0, distance, 15)
        targetKeyFrames.push({
            frame: 0,
            value: this._arcRotateCamera.target
        })

        targetKeyFrames.push({
            frame: CollegeFloor.frameRate * 2,
            value: newTarget
        })
        targetAnimation.setKeys(targetKeyFrames)


        const betaAnimation = new Animation("cameraBetaAnimation", "beta", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const betaKeyFrames: IAnimationKey[] = []
        betaKeyFrames.push({
            frame: 0,
            value: this._arcRotateCamera.beta
        })
        if (this._currentFloorNum == -1) {
            betaKeyFrames.push({
                frame: CollegeFloor.frameRate * 2,
                value: Math.PI / 3
            })
        } else {
            betaKeyFrames.push({
                frame: CollegeFloor.frameRate * 2,
                value: Math.PI / 4
            })
        }
        betaAnimation.setKeys(betaKeyFrames)
        const alphaAnimation = new Animation("cameraAlphaAnimation", "alpha", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const alphaKeyFrames: IAnimationKey[] = []
        alphaKeyFrames.push({
            frame: 0,
            value: this._arcRotateCamera.alpha
        })
        if (this._currentFloorNum == -1) {
            alphaKeyFrames.push({
                frame: CollegeFloor.frameRate * 2,
                value: -(Math.PI / 2 + Math.PI / 4)
            })
        } else {
            alphaKeyFrames.push({
                frame: CollegeFloor.frameRate * 2,
                value: -Math.PI / 2
            })
        }
        alphaAnimation.setKeys(alphaKeyFrames)

        const circleEase = new CircleEase();
        circleEase.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
        targetAnimation.setEasingFunction(circleEase)

        const radiusAnimation = new Animation("cameraRadiusAnimation", "radius", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const radiusKeyFrames: IAnimationKey[] = []
        const radiusTarget = this._currentFloorNum == -1 ? 60 : 50
        radiusKeyFrames.push({
            frame: 0,
            value: this._arcRotateCamera.radius
        })
        radiusKeyFrames.push({
            frame: CollegeFloor.frameRate * 2,
            value: radiusTarget
        })
        radiusAnimation.setKeys(radiusKeyFrames)

        return [targetAnimation, alphaAnimation, betaAnimation, radiusAnimation]

    }

    private beginStartCameraAnimation() {  //入场camera动画
        this._scene.beginDirectAnimation(this._arcRotateCamera, this.createCameraAnim(), 0, CollegeFloor.frameRate * 2, false)
    }

    private disposeStudioNameUi() {
        this._ui?.dispose()
    }

    private createStartCameraAnim() {
        const betaAnimation = new Animation("cameraBetaAnimation", "beta", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const betaKeyFrames: IAnimationKey[] = []
        betaKeyFrames.push({
            frame: 0,
            value: this._arcRotateCamera.beta
        })

        betaKeyFrames.push({
            frame: CollegeFloor.frameRate * 2,
            value: Math.PI / 3
        })

        betaAnimation.setKeys(betaKeyFrames)
        const alphaAnimation = new Animation("cameraAlphaAnimation", "alpha", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const alphaKeyFrames: IAnimationKey[] = []
        alphaKeyFrames.push({
            frame: 0,
            value: this._arcRotateCamera.alpha
        })

        alphaKeyFrames.push({
            frame: CollegeFloor.frameRate * 2,
            value: -(Math.PI / 2 + Math.PI / 4)
        })


        alphaAnimation.setKeys(alphaKeyFrames)

        return [alphaAnimation, betaAnimation]
    }



    cameraSmoothOut() {
        if (!this._visiting)
            this._scene.beginDirectAnimation(this._arcRotateCamera, this.createCameraOutAnim(), 0, CollegeFloor.frameRate, false)
    }

    private createCameraOutAnim() {
        const radiusAnimation = new Animation("cameraRadiusAnimation", "radius", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const radiusKeyFrames: IAnimationKey[] = []
        radiusKeyFrames.push({
            frame: 0,
            value: this._arcRotateCamera.radius
        })
        radiusKeyFrames.push({
            frame: CollegeFloor.frameRate,
            value: this._arcRotateCamera.radius + 2
        })
        const backEase = new CubicEase();
        backEase.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
        radiusAnimation.setEasingFunction(backEase)
        radiusAnimation.setKeys(radiusKeyFrames)
        return [radiusAnimation]
    }


    cameraSmoothIn() {
        if (!this._visiting)
            this._scene.beginDirectAnimation(this._arcRotateCamera, this.createCameraInAnim(), 0, CollegeFloor.frameRate, false)

    }

    private createCameraInAnim() {
        const radiusAnimation = new Animation("cameraRadiusAnimation", "radius", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const radiusKeyFrames: IAnimationKey[] = []
        radiusKeyFrames.push({
            frame: 0,
            value: this._arcRotateCamera.radius
        })
        radiusKeyFrames.push({
            frame: CollegeFloor.frameRate,
            value: this._arcRotateCamera.radius - 2
        })
        const backEase = new CubicEase();
        backEase.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
        radiusAnimation.setEasingFunction(backEase)
        radiusAnimation.setKeys(radiusKeyFrames)
        return [radiusAnimation]
    }

    private _visiting: boolean = false

    //访问当前楼层
    public visitFloor() {
        if (this._currentFloorNum == -1)
            return
        const floor = this._collegeFloorInstances[this._currentFloorNum - 1];
        floor.loadTexture() //加载纹理
        //传递地标数据到player
        this._visitPlayerManager.locTransformNode = floor.locTransformNode
        //设置工作室的总数
        this._visitPlayerManager.floorTotalStudioNum = this._collegeFloors.floors[this._currentFloorNum - 1].studios.length
        this._visiting = true
        this.hideOtherFloor()
        this.hideVisitUi()
        this.placeVisitPlayer() //放置玩家
        this.visiblePlayer() //显示玩家
        this._scene.beginDirectAnimation(this._arcRotateCamera, this.createCameraMoveToPlayerAnim(), 0, CollegeFloor.frameRate * 2, false, undefined, () => {
            this._visitPlayerManager.turnOnCamera() //切换到玩家的摄像机
        })
        this.disposeStudioNameUi()
    }

    private createCameraMoveToPlayerAnim() { //相机移动到玩家
        const targetAnimation = new Animation("targetAnimation", "target", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const targetKeyFrames: IAnimationKey[] = []
        //const distance = this._currentFloorNum * CollegeFloor.HEIGHT - ( CollegeFloor.HEIGHT / 2 + CollegeFloor.HEIGHT / 4)
        const distance = (this._currentFloorNum - 1) * CollegeFloor.HEIGHT
        const newTarget = new Vector3(0, distance, 15)

        //暂时
        this._arcRotateCamera.target = newTarget
        targetKeyFrames.push({
            frame: 0,
            value: this._arcRotateCamera.target.clone()
        })

        targetKeyFrames.push({
            frame: CollegeFloor.frameRate * 2,
            value: newTarget
        })
        targetAnimation.setKeys(targetKeyFrames)
        const circleEase = new CircleEase();
        circleEase.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
        targetAnimation.setEasingFunction(circleEase)

        const betaAnimation = new Animation("cameraBetaAnimation", "beta", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const betaKeyFrames: IAnimationKey[] = []
        betaKeyFrames.push({
            frame: 0,
            value: this._arcRotateCamera.beta
        })
        betaKeyFrames.push({
            frame: CollegeFloor.frameRate * 2,
            value: Math.PI / 2 - Math.PI / 24.3
        })
        betaAnimation.setKeys(betaKeyFrames)
        const alphaAnimation = new Animation("cameraAlphaAnimation", "alpha", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const alphaKeyFrames: IAnimationKey[] = []
        alphaKeyFrames.push({
            frame: 0,
            value: this._arcRotateCamera.alpha
        })
        alphaKeyFrames.push({
            frame: CollegeFloor.frameRate * 2,
            value: -Math.PI / 2
        })
        alphaAnimation.setKeys(alphaKeyFrames)


        const radiusAnimation = new Animation("cameraXRadiusAnimation", "radius", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const radiusKeyFrames: IAnimationKey[] = []
        radiusKeyFrames.push({
            frame: 0,
            value: this._arcRotateCamera.radius
        })
        radiusKeyFrames.push({
            frame: CollegeFloor.frameRate * 2,
            value: 24
        })
        radiusAnimation.setKeys(radiusKeyFrames)


        //有BUG 等待解决?
        //https://forum.babylonjs.com/t/arcrotatecamera-can-not-animating-radius-and-target-simultaneously/19340
        return [targetAnimation, radiusAnimation, alphaAnimation, betaAnimation,]

    }

    private placeVisitPlayer() { //放置player
        this._visitPlayerManager.placePlayerAtFloor(this._currentFloorNum)
    }

    private invisiblePlayer() {
        console.log('不可见')
        this._visitPlayerManager.invisible()
    }

    private visiblePlayer() {
        this._visitPlayerManager.visible()
    }

    //隐藏其它楼层
    private hideOtherFloor() {
        for (let i = 1; i <= this._collegeFloors.totalFloor; i++) {
            if (i != this._currentFloorNum) {
                const floor = this._collegeFloorInstances[i - 1];
                floor.hide()
            }
        }
    }

    public goToStudio() {
        const floor = this._collegeFloorInstances[this._currentFloorNum - 1];
        floor.openDoor(this._visitPlayerManager._visitStudioIndex,()=>{
            this._visitPlayerManager.goIntoStudio(this._visitPlayerManager._visitStudioIndex,()=>{
                const studioUUid = this._collegeFloors.floors[this._currentFloorNum - 1].studios[this._visitPlayerManager._visitStudioIndex - 1].uuid;
                //todo
                console.log('点击进入')
               this._web3DStudio.goToStudio(studioUUid)
                //进入到工作室中
            })
            //人物往前走
        }) //打开门
    }

    private openStudioDoor() {
        if (this._currentFloorNum == -1)
            return
        const floor = this._collegeFloorInstances[this._currentFloorNum - 1];
        for (let i = 1; i <= 6; i++) {
            floor.openDoor(i)
        }
    }

}

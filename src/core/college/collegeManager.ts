import {
    Animation,
    ArcRotateCamera, BezierCurveEase, CircleEase, Color3, CubicEase,
    DynamicTexture, EasingFunction, HemisphericLight, HighlightLayer, IAnimationKey,
    Matrix,
    Mesh,
    MeshBuilder,
    Quaternion,
    Scene,
    SceneLoader, StandardMaterial,
    Vector3
} from "@babylonjs/core";
import {Player, PlayerAssets} from "../player/player";
import {InputController} from "../player/inputController";
import {IState} from "../IState";
import {CollegeFloor} from "./collegeFloor";
import useFloorUiState from "../../components/GUI/floor/floorUiState";
import {values} from "mobx";
import {AdvancedDynamicTexture} from "@babylonjs/gui";


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
    private _scene: Scene;
    private _web3DStudio: IState;
    private _collegeFloors: CollegeFloors;
    private _collegeFloorInstances: CollegeFloor [ ] = [] //保存floor的实例
    private _currentFloorNum: number
    private _maxYPos: number
    private _cameraTarget: Vector3 = new Vector3()
    private _arcRotateCamera!: ArcRotateCamera
    private _ui: AdvancedDynamicTexture
    private _highLightLayer:HighlightLayer

    constructor(collegeScene: Scene, web3DStudio: IState, collegeFloors: CollegeFloors) {
        this._scene = collegeScene;
        this._collegeFloors = collegeFloors; //所有数据
        useFloorUiState.collegeManager = this //注入this
        useFloorUiState.setFloorTotalNumber(collegeFloors.totalFloor) //设置楼层数目
        useFloorUiState.setFloorUiShowing(true) //显示UI
        this._highLightLayer =new HighlightLayer("floorHighlightLayer",this._scene)
        this._currentFloorNum = -1 //-1代表显示所有楼层
        this._scene.collisionsEnabled = true //打开碰撞
        this._web3DStudio = web3DStudio;
        this._maxYPos = this._collegeFloors.totalFloor * CollegeFloor.HEIGHT + 100  //动画到达的最高位置
        this._ui = AdvancedDynamicTexture.CreateFullscreenUI("floorUi", true, this._scene)
    }

    async load() {
        this.showWorldAxis(7)
        this.setUpLight()
        await this.loadModel()
        this.setUpCamera()
    }

    static readonly FLOOR_MODEL_URL = "src/assets/model/floor.glb"

    setUpCamera() {
        const distance = this._collegeFloors.totalFloor * CollegeFloor.HEIGHT
        this._cameraTarget = new Vector3(0, distance / 2, 20)
        const arcRotateCamera = new ArcRotateCamera("camera", 0, 0, 60, this._cameraTarget, this._scene);
        arcRotateCamera.attachControl()
        this._arcRotateCamera = arcRotateCamera
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


    showWorldAxis(size: number) {
        let makeTextPlane = (text: string, color: string, size: number) => {
            let dynamicTexture = new DynamicTexture("DynamicTexture", 50, this._scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
            let plane = Mesh.CreatePlane("TextPlane", size, this._scene, true);
            plane.isPickable = false
            let mat = new StandardMaterial("TextPlaneMaterial", this._scene);
            mat.backFaceCulling = false;
            mat.specularColor = new Color3(0, 0, 0);
            mat.diffuseTexture = dynamicTexture;
            plane.material = mat
            return plane;
        };
        let axisX = Mesh.CreateLines("axisX", [
            Vector3.Zero(), new Vector3(size, 0, 0), new Vector3(size * 0.95, 0.05 * size, 0),
            new Vector3(size, 0, 0), new Vector3(size * 0.95, -0.05 * size, 0)
        ], this._scene);
        axisX.isPickable = false
        axisX.color = new Color3(1, 0, 0);
        let xChar = makeTextPlane("X", "red", size / 10);
        xChar.position = new Vector3(0.9 * size, -0.05 * size, 0);
        let axisY = Mesh.CreateLines("axisY", [
            Vector3.Zero(), new Vector3(0, size, 0), new Vector3(-0.05 * size, size * 0.95, 0),
            new Vector3(0, size, 0), new Vector3(0.05 * size, size * 0.95, 0)
        ], this._scene);
        axisY.color = new Color3(0, 1, 0);
        axisY.isPickable = false
        var yChar = makeTextPlane("Y", "green", size / 10);
        yChar.position = new Vector3(0, 0.9 * size, -0.05 * size);
        var axisZ = Mesh.CreateLines("axisZ", [
            Vector3.Zero(), new Vector3(0, 0, size), new Vector3(0, -0.05 * size, size * 0.95),
            new Vector3(0, 0, size), new Vector3(0, 0.05 * size, size * 0.95)
        ], this._scene);
        axisZ.color = new Color3(0, 0, 1);
        axisZ.isPickable = false
        var zChar = makeTextPlane("Z", "blue", size / 10);
        zChar.position = new Vector3(0, 0.05 * size, 0.9 * size);
    };

    private _animating: boolean = false //是否在动画..
    goToFloor(floorNum: number) {
        if (floorNum == this._currentFloorNum)  //什么也不做
            return
        if (this._animating)
            return;
        this._animating = true
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
                    })

                }
            }
            if (this._currentFloorNum + 1 > this._collegeFloors.totalFloor) { //如果是顶楼了... 上面的for不会执行
                this._animating = false
                this._currentFloorNum = -1 //值置位 -1
                this.updateCameraTarget()
            }
            return;
        }
        if (this._currentFloorNum == -1) {  //之前的状态是显示所有的楼层

            //特判 如果此时楼层点击的是最高楼层... 那么显示最高楼层
            if (floorNum == this._collegeFloors.totalFloor) {
                this.updateCameraTarget()
                this.floorStudioBoxVisible(floorNum)
                this.floorVisible(floorNum, () => {
                        this._animating = false
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
    }

    private floorStudioBoxNameVisible(floorNum: number) {

    }

    private floorTranslucent() {  //将所有楼层变为半透明
        this._ui.dispose()
        this._collegeFloorInstances.forEach(floor => {
            floor.translucent()
            floor.invisibleStudioBox()
        })
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
        return [targetAnimation, alphaAnimation, betaAnimation]

    }

    private beginStartCameraAnimation() {  //入场camera动画
        this._scene.beginDirectAnimation(this._arcRotateCamera, this.createCameraAnim(), 0, CollegeFloor.frameRate * 2, false)
    }

    private createStartCameraAnim(){
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
}

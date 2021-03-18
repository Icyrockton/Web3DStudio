import {
    ArcRotateCamera, Color3,
    DynamicTexture, HemisphericLight,
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

    constructor(collegeScene: Scene, web3DStudio: IState, collegeFloors: CollegeFloors) {
        this._scene = collegeScene;
        this._collegeFloors = collegeFloors; //所有数据
        useFloorUiState.collegeManager = this //注入this
        useFloorUiState.setFloorTotalNumber(collegeFloors.totalFloor) //设置楼层数目
        useFloorUiState.setFloorUiShowing(true) //显示UI
        this._currentFloorNum = -1 //-1代表显示所有楼层
        this._scene.collisionsEnabled = true //打开碰撞
        this._web3DStudio = web3DStudio;
        this._maxYPos = this._collegeFloors.totalFloor * CollegeFloor.HEIGHT + 100  //动画到达的最高位置
    }

    async load() {
        this.showWorldAxis(7)
        this.setUpLight()
        this.setUpCamera()
        this.loadModel()
    }

    static readonly FLOOR_MODEL_URL = "src/assets/model/floor.glb"

    setUpCamera() {
        const distance = this._collegeFloors.totalFloor * CollegeFloor.HEIGHT
        const target = new Vector3(0, distance / 2, 15)
        const arcRotateCamera = new ArcRotateCamera("camera", -Math.PI/ 2, Math.PI/ 2, 60, target,this._scene);
        arcRotateCamera.attachControl()
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

    goToFloor(floorNum: number) {
        if (floorNum == this._currentFloorNum)  //什么也不做
            return
        if (this._currentFloorNum == -1) {  //之前的状态是显示所有的楼层
            //那就是弹出楼层
            for (let i = this._collegeFloors.totalFloor; i > floorNum; i--) {
                console.log(i)
                const floor = this._collegeFloorInstances[i - 1];
                console.log(floor)
                floor.popToMaxHeight(1000 * (this._collegeFloors.totalFloor - i))
            }
            this._currentFloorNum = floorNum
        } else {
            if (this._currentFloorNum > floorNum) {   //向上弹出楼层
                //弹出  floorNum+1 ~ this._currentFloorNum
                for (let i = this._currentFloorNum; i > floorNum; i--) {
                    const floor = this._collegeFloorInstances[i - 1];
                    floor.popToMaxHeight(300 * (this._currentFloorNum - i))
                }
            } else { //向下压入楼层
                //压入 this._currentFloorNum + 1 ~ floorNum
                for (let i = this._currentFloorNum + 1; i <= floorNum; i++) {
                    const floor = this._collegeFloorInstances[i - 1];
                    // floor.pushToOrigin(0)
                    floor.pushToOrigin(200 * (i - this._currentFloorNum))
                }
            }
            this._currentFloorNum = floorNum
        }
    }
}

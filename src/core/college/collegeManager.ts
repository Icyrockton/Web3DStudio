import { ArcRotateCamera, HemisphericLight, PickingInfo, Quaternion, Scene, SceneLoader, ShadowGenerator, TransformNode, Vector3 } from "@babylonjs/core";
import { __DEBUG__ } from "../../global";
import { College, CollegePosition } from "./college";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";




export class CollegeManager { //加载学院相关的资源

    static collegeMap: College[] = [
        {
            name: '北京三维学院', modelUrl: 'src/assets/model/building/building_1.glb',
            position: CollegePosition.A,
            scale: new Vector3(0.7, 0.7, 0.7),
            rotation: new Vector3(0, Math.PI, 0)
        },
        {
            name: '成都精通学院', modelUrl: 'src/assets/model/building/building_2.glb',
            position: CollegePosition.B,
            scale: Vector3.One(),
            rotation: new Vector3(0, Math.PI, 0)
        }
    ]
    static map = {
        name: 'map',
        modelUrl: 'src/assets/model/map.glb'
    }

    private _scene: Scene
    private _canvas: HTMLCanvasElement

    constructor(scene: Scene, canvas: HTMLCanvasElement) { //学院场景
        this._scene = scene
        this._canvas = canvas
    }

    async load() {
        this.setLight()
        await this.loadMap()
        this.setCamera()
        this.setClick()
        
    }
    setLight() {
        let light = new HemisphericLight('chooseCollegeLight',new Vector3(0,1,0),this._scene)
        light.intensity=1.2 //设置强度

    }
    setClick() { //点击事件
        this._scene.onPointerDown=(event,pickInfo)=>{
            if(pickInfo.pickedMesh){
                console.log(pickInfo.pickedMesh.parent);
                
            }
        }
    }

    setCamera() { //设置摄像机

        let camera = new ArcRotateCamera('chooseCollegeCamera', 0, Math.PI / 3.5, 40, Vector3.Zero(), this._scene)
        camera.attachControl()


        //停止时自动旋转
        camera.useAutoRotationBehavior = true
        camera.autoRotationBehavior!.idleRotationSpeed = 0.12
        camera.autoRotationBehavior!.idleRotationWaitTime = 1000
        //设置固定的半径大小
        camera.lowerRadiusLimit=40
        camera.upperRadiusLimit=40
        //设置固定的Beta角度
        camera.lowerBetaLimit=Math.PI / 3.5
        camera.upperBetaLimit=Math.PI / 3.5
    
        
    }

    async loadMap() {

        //加载地图
        let map=await SceneLoader.ImportMeshAsync("", CollegeManager.map.modelUrl, undefined, this._scene)
        map.meshes.forEach((mesh)=>{
            mesh.isPickable=false //将地图的所有mesh设置为不可选取的
         })

        //找到建筑物的坐标位置
        let positionMap = new Map<College, Vector3>()
        this._scene.transformNodes.forEach((node) => {
            for (let i = 0; i < CollegeManager.collegeMap.length; i++) {
                const college = CollegeManager.collegeMap[i];

                if (college.position == node.name) {
                    positionMap.set(college, node.position)
                }
            }
        })

        //检查地图数据是否出错
        if (positionMap.size != CollegeManager.collegeMap.length) {
            if (__DEBUG__) {
                console.log('地图数据错误');
                console.log(positionMap);

            }
            return
        }

        //设置建筑物上方的Text
        let ui = AdvancedDynamicTexture.CreateFullscreenUI("builiding_UI", true, this._scene)


        //加载学院建筑
        for (let i = 0; i < CollegeManager.collegeMap.length; i++) {
            const college = CollegeManager.collegeMap[i];
            let node = new TransformNode(college.name, this._scene)
            let loadMesh = await SceneLoader.ImportMeshAsync("", college.modelUrl, undefined, this._scene)

            let root = loadMesh.meshes[0] //模型的root结点
            root.scaling = college.scale //模型的缩放
            //设置模型的旋转属性 四元数
            root.rotationQuaternion = Quaternion.FromEulerAngles(0, 0, 0)


            //设置父级
            root.parent = node
            //设置建筑物位置
            let positon = positionMap.get(college)!
            //x坐标好像是相反数? 
            node.position.set(-positon.x, positon.y, positon.z)

            //设置建筑物上方的Text
            let textBlock = new TextBlock()
            textBlock.text = college.name
            textBlock.fontSize = 20
            textBlock.color = "white" //字体颜色
            ui.addControl(textBlock) //注意顺序 先addControl 再linkWithMesh 
            textBlock.linkWithMesh(root)
            //向上偏移
            textBlock.linkOffsetY = -100
        }



    }





}
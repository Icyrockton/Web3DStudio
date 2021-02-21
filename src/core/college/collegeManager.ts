import { AbstractMesh, ActionManager, ArcRotateCamera, CascadedShadowGenerator, Color4, DirectionalLight, ExecuteCodeAction, HemisphericLight, MeshBuilder, NodeMaterial, PickingInfo, PointLight, Quaternion, RenderTargetTexture, Scene, SceneLoader, ShadowGenerator, Sound, SpotLight, StandardMaterial, Tools, TransformNode, Vector3, Vector4 } from "@babylonjs/core";
import { __DEBUG__ } from "../../global";
import { College, CollegePosition } from "./college";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { CollegeFence } from "./collegeFence";




export class CollegeManager { //加载学院相关的资源

    static collegeMap: College[] = [
        {
            name: '北京三维学院', modelUrl: 'src/assets/model/building/building_1.glb',
            position: CollegePosition.A,
            scale: Vector3.One(),
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
    private _collegeNode: TransformNode[] = [] //保存所有的建筑物根节点
    private _buildingMeshUniqueID : number[] = []
    private _clickSound:Sound

    constructor(scene: Scene, canvas: HTMLCanvasElement) { //学院场景
        this._scene = scene
        //#5FA2E2
        this._scene.clearColor=new Color4(96 / 256,162 /256,226/256,1)
        this._canvas = canvas
        this._clickSound=new Sound('clickSound',"src/assets/sound/collegeBuildingClick.mp3",this._scene,()=>{},{volume:0.3})
    }

    async load() {
        this.setCamera()
        await this.loadMap()
        this.setLight()
        this.setClick()
    }
    setLight() {
        //半球光
        let light = new HemisphericLight('HemisphericLight', new Vector3(0, 1, 0), this._scene)
        light.intensity = 0.5 //设置强度

        //方向光
        let directionalLight = new DirectionalLight('directionalLight', new Vector3(1, -1.5, 0.5), this._scene)
        directionalLight.position = new Vector3(-20, 10, -10)
        directionalLight.intensity = 1.4

        //方向光阴影
        let shadowGenerator = new ShadowGenerator(1024, directionalLight)
        //只计算一次阴影
        //shadowGenerator.getShadowMap()!.refreshRate=RenderTargetTexture.REFRESHRATE_RENDER_ONCE
        //设置PCF软阴影
        shadowGenerator.usePercentageCloserFiltering=true
        //添加树为阴影的投射者
         shadowGenerator.addShadowCaster(this._scene.getMeshByName("tree") !) 
         let groundMesh= this._scene.getMeshByName("ground") !
        //添加建筑物为阴影的投射者
         this._buildingMeshUniqueID.forEach((meshID)=>{
             let mesh = this._scene.getMeshByUniqueID(meshID)   
             if(mesh){
                 shadowGenerator.addShadowCaster(mesh)
             }
         })
        
        groundMesh.receiveShadows=true //设置地面为接受阴影的对象

    }

    //学院名字 -- 栅栏
    private _collegeToFence:Map<string,CollegeFence>= new Map()
     setClick() { //点击事件

        this._collegeNode.forEach((node) => {
            let nodeActionManager = new ActionManager(this._scene)
            let childMesh = node.getChildMeshes(false)
            childMesh.forEach((mesh) => {
                let fence=this._collegeToFence.get(node.name)! //获取栅栏
                mesh.actionManager = nodeActionManager
                mesh.actionManager.registerAction(new ExecuteCodeAction(
                    ActionManager.OnPointerOverTrigger, //鼠标悬浮到建筑物上(移入建筑物)
                    (event) => {
                       fence.up() //上升
                       this._clickSound.play()
                    }))
                mesh.actionManager.registerAction(new ExecuteCodeAction(
                    ActionManager.OnPointerOutTrigger, //鼠标移出建筑物
                    (event) => {
                        fence.down() //下降
                    }
                ))
            })
        })
    }

    setCamera() { //设置摄像机

        let camera = new ArcRotateCamera('chooseCollegeCamera', 0, Math.PI / 3.5, 40, Vector3.Zero(), this._scene)
        camera.attachControl()


        //停止时自动旋转
        camera.useAutoRotationBehavior = true
        camera.autoRotationBehavior!.idleRotationSpeed = 0.12
        camera.autoRotationBehavior!.idleRotationWaitTime = 1000
        //设置固定的半径大小
        camera.lowerRadiusLimit = 40
        camera.upperRadiusLimit = 40
        //设置固定的Beta角度
        camera.lowerBetaLimit = Math.PI / 3.5
        camera.upperBetaLimit = Math.PI / 3.5


    }

    async loadMap() {

        //加载地图
        let map = await SceneLoader.ImportMeshAsync("", CollegeManager.map.modelUrl, undefined, this._scene)
        map.meshes.forEach((mesh) => {
            mesh.isPickable = false //将地图的所有mesh设置为不可选取的
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
            this._collegeNode.push(node)

            let loadMesh = await SceneLoader.ImportMeshAsync("", college.modelUrl, undefined, this._scene)

            let root = loadMesh.meshes[0] //模型的root结点
            this._buildingMeshUniqueID.push(root.uniqueId)
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

            //设置建筑物的栅栏
            let buildingMesh=root.getChildMeshes()[0]! //建筑物Mesh
            let boundingBox = buildingMesh.getBoundingInfo().boundingBox
            //maximum减去minimum得到边界盒子的大小
            let boundingBoxSize=boundingBox.maximum.subtract(boundingBox.minimum)
            //width:size.x,height:size.y,depth:size.z 
            
            //栅栏
            let collegeFence=new CollegeFence(boundingBoxSize.x+0.5,boundingBoxSize.z+0.5,0.6,this._scene)
            
            //设置栅栏的位置
            collegeFence.position=new Vector3(node.position.x, node.position.y - 1, node.position.z)
            
            this._collegeToFence.set(node.name, collegeFence) //保存 学院名称 -- 栅栏名称
            
        }



    }





}
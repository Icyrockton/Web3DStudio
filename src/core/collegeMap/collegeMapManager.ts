import {
    ActionManager,
    ArcRotateCamera, Color3,
    Color4, DefaultRenderingPipeline,
    DirectionalLight,
    ExecuteCodeAction, FxaaPostProcess,
    HemisphericLight, Mesh,
    Quaternion,
    Scene,
    SceneLoader,
    ShadowGenerator,
    Sound,
    TransformNode,
    Vector3,
} from "@babylonjs/core";
import { __DEBUG__ } from "../../global";
import { College } from "./college";
import {AdvancedDynamicTexture, Ellipse, Line, Rectangle, TextBlock} from "@babylonjs/gui";
import { CollegeFence } from "./collegeFence";
import useCollegeUiState from '../../components/GUI/college/collegeUiState'
import {IState} from "../IState";


export interface CollegeMap{
    colleges:College[]
    mapModelURL:string
}

export class CollegeMapManager { //加载学院相关的资源


    static map = {
        name: 'map',
        modelUrl: 'model/map.glb'
    }

    private _scene: Scene
    private _collegeNode: TransformNode[] = [] //保存所有的建筑物根节点
    private _buildingMeshUniqueID : number[] = []
    private _clickSound:Sound
    private _iState: IState;
    private _collegeMap: CollegeMap; //保存地图数据
    private _arcRotateCamera?: ArcRotateCamera;

    constructor(scene: Scene ,iState:IState,collegeMap: CollegeMap) {
        this._iState = iState;
        this._collegeMap = collegeMap; //切换状态
        this._scene = scene//学院场景
        //#5FA2E2
        this._scene.clearColor=new Color4(96 / 256,162 /256,226/256,1).toLinearSpace()
        this._clickSound=new Sound('clickSound',"sound/collegeBuildingClick.mp3",this._scene,()=>{},{volume:0.3})
    }

    async load() {
        this.setCamera()
        await this.loadMap()
        this.setLight()
        this.setPostProcess()
    }

    setPostProcess() {
        const pipeline = new DefaultRenderingPipeline(
            "pipeline",
            true,
            this._scene,
            this._scene.cameras
        );
        //开启测晕的效果
        pipeline.imageProcessingEnabled = true;
        pipeline.imageProcessing.vignetteEnabled = true;
        pipeline.imageProcessing.vignetteWeight = 1.7;
        pipeline.imageProcessing.vignetteColor=new Color4(34 / 256,131 /256,229/256,1)
            pipeline.imageProcessing.exposure = 1.4

        //开启抗锯齿
        pipeline.samples =4

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

        //为栅栏添加阴影
        this._collegeToFence.forEach((fence,college)=>{
            fence.setUpShadow(shadowGenerator)
        })
        groundMesh.receiveShadows=true //设置地面为接受阴影的对象
        //只计算一次阴影
        shadowGenerator.getShadowMap()!.refreshRate=0


    }



    //学院名字 -- 栅栏
    private _collegeToFence:Map<string,CollegeFence>= new Map()

    private setClick(node:TransformNode,college: College){
        const collegeUiState = useCollegeUiState;
        const nodeActionManager = new ActionManager(this._scene)
        const rootMesh = node.getChildMeshes(true)[0]! //root结点
        const childMeshes = rootMesh.getChildMeshes(true);
        childMeshes.forEach((mesh) => {
            let fence=this._collegeToFence.get(node.name)! //获取栅栏
            mesh.actionManager = nodeActionManager
            mesh.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPointerOverTrigger, //鼠标悬浮到建筑物上(移入建筑物)
                (event) => {
                    fence.up() //上升
                    this._clickSound.play()
                    //获取学院数据
                    collegeUiState.fetchCollegeDescriptionByName(node.name)
                    collegeUiState.setShowing(true) //显示UI
                    if (this._arcRotateCamera)
                        this._arcRotateCamera.useAutoRotationBehavior =false
                }))

            mesh.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPointerOutTrigger, //鼠标移出建筑物
                (event) => {
                    fence.down() //下降
                    collegeUiState.setShowing(false)
                    if (this._arcRotateCamera)
                        this._arcRotateCamera.useAutoRotationBehavior =true
                }
            ))
            mesh.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickDownTrigger,
                (event)=>{
                    if(__DEBUG__){
                        console.log(`进入学院 ${node.name}`)
                    }
                    collegeUiState.setShowing(false) //关闭UI
                    this._iState.goToCollege(college.uuid) // 进入到学院内部
                }
            ))
        })
    }

    setCamera() { //设置摄像机

        let camera = new ArcRotateCamera('chooseCollegeCamera', 0, Math.PI / 3.5, 40, Vector3.Zero(), this._scene)
        camera.attachControl()

        // let testCamera = new FreeCamera("testCamera",Vector3.Zero(),this._scene);
        // testCamera.attachControl()

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

        this._arcRotateCamera= camera
    }

    static readonly CLOUD_NAME="cloud"
    static readonly CLOUD_MAXZ=-3
    static readonly CLOUD_MINZ=-11
    private _cloud_Z_flag=false
    private _localTime = 0
    async loadMap() {

        //加载地图
        let map = await SceneLoader.ImportMeshAsync("", this._collegeMap.mapModelURL, undefined, this._scene)
        map.meshes.forEach((mesh) => {
            mesh.isPickable = false //将地图的所有mesh设置为不可选取的
            if (mesh.name.startsWith(CollegeMapManager.CLOUD_NAME) && (mesh instanceof  Mesh)){
                //将云朵变为透明的
                if (mesh.material) { //开启深度检测
                    mesh.material.needDepthPrePass = true
                }
                mesh.visibility=0.8
                //运动移动
                this._scene.registerBeforeRender(()=>{  //云朵的移动
                    mesh.position.y = mesh.position.y + Math.cos(this._localTime) * 0.001
                    if (!this._cloud_Z_flag){
                        mesh.position.z += 0.002
                        if (mesh.position.z > CollegeMapManager.CLOUD_MAXZ){
                            this._cloud_Z_flag = true
                        }
                    }
                    else{
                        mesh.position.z -= 0.002
                        if (mesh.position.z < CollegeMapManager.CLOUD_MINZ){
                            this._cloud_Z_flag = false
                        }
                    }
                    this._localTime += 0.01
                })
            }
        })

        //找到建筑物的坐标位置
        let positionMap = new Map<College, Vector3>()
        this._scene.transformNodes.forEach((node) => {
            for (let i = 0; i < this._collegeMap.colleges.length; i++) {
                const college = this._collegeMap.colleges[i];
                if (college.position == node.name) {
                    positionMap.set(college, node.position)
                }
            }
        })

        //检查地图数据是否出错
        if (positionMap.size != this._collegeMap.colleges.length) {
            if (__DEBUG__) {
                console.log('地图数据错误');
                console.log(positionMap);
            }
            return
        }

        //设置建筑物上方的Text
        let ui = AdvancedDynamicTexture.CreateFullscreenUI("builiding_UI", true, this._scene)


        //加载学院建筑
        for (let i = 0; i < this._collegeMap.colleges.length; i++) {
            const college = this._collegeMap.colleges[i];
            let node = new TransformNode(college.name, this._scene)
            this._collegeNode.push(node)

            let loadMesh = await SceneLoader.ImportMeshAsync("", college.modelUrl, undefined, this._scene)

            let root = loadMesh.meshes[0] //模型的root结点
            this._buildingMeshUniqueID.push(root.uniqueId)
            root.scaling = new Vector3(college.scale[0],college.scale[1],college.scale[2]) //模型的缩放
            //设置模型的旋转属性 四元数
            root.rotationQuaternion = Quaternion.FromEulerAngles(0, 0, 0)

            //设置父级
            root.parent = node
            //设置建筑物位置
            let positon = positionMap.get(college)!
            //x坐标好像是相反数?
            node.position.set(-positon.x, positon.y, positon.z)

            // //设置建筑物上方的Text
            // let textBlock = new TextBlock()
            // textBlock.text = college.name
            // textBlock.fontSize = 20
            // textBlock.color = "white" //字体颜色
            // ui.addControl(textBlock) //注意顺序 先addControl 再linkWithMesh
            // textBlock.linkWithMesh(root)
            // //向上偏移
            // textBlock.linkOffsetY = -100

            let buildingMesh=root.getChildMeshes()[0]! //建筑物Mesh
            let boundingBox = buildingMesh.getBoundingInfo().boundingBox
            //maximum减去minimum得到边界盒子的大小
            let boundingBoxSize=boundingBox.maximum.subtract(boundingBox.minimum)
            //width:size.x,height:size.y,depth:size.z


            //上方的椭圆
            let rect1 = new Rectangle();
            rect1.width = 0.2;
            rect1.height = "40px";
            rect1.width ="250px";
            rect1.cornerRadius = 20;
            rect1.color = "white";
            rect1.thickness = 4;
            rect1.background = "#00C9FF";
            ui.addControl(rect1);
            rect1.linkWithMesh(root);
            rect1.linkOffsetY = -200;

            let label = new TextBlock();
            label.text = college.name;
            label.fontSize = "22px"
            label.color = "black"
            rect1.addControl(label);

            let target = new Ellipse();
            target.width = "40px";
            target.height = "40px";
            target.color = "white";
            target.thickness = 4;
            target.background = "#00C9FF";
            ui.addControl(target);
            target.linkWithMesh(root);
            console.log(boundingBoxSize.y/2)
            target.linkOffsetYInPixels = -100
            var line = new Line();
            line.lineWidth = 4;
            line.color = "white";
            line.y2 = 20;
            line.linkOffsetY = -120;
            ui.addControl(line);
            line.linkWithMesh(root);
            line.connectedControl = rect1;



            //设置建筑物的栅栏


            //栅栏
            let collegeFence=new CollegeFence(boundingBoxSize.x+0.5,boundingBoxSize.z+0.5,0.6,this._scene)

            //设置栅栏的位置
            collegeFence.position=new Vector3(node.position.x, node.position.y - 1, node.position.z)

            this._collegeToFence.set(node.name, collegeFence) //保存 学院名称 -- 栅栏名称

            this.setClick(node,college)
        }



    }



}

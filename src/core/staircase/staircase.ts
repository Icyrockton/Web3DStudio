import {
    ActionManager,
    ArcRotateCamera, Camera,
    Color3,
    Engine, ExecuteCodeAction,
    HighlightLayer,
    Material,
    Mesh, MeshBuilder,
    Scene, SceneLoader, SceneLoaderSuccessCallback, Sound,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {Firework} from "./firework";
import {GradientMaterial} from "@babylonjs/materials";
import {SubTask, SubTaskState, Task} from "../../components/GUI/task/taskUi";
import useTaskUiState from "../../components/GUI/task/taskUiState";
import {useSubTaskUiState} from "../../components/GUI/player/subTaskUi";

export class Staircase {


    private _scene: Scene
    private _engine: Engine;
    private _mat: { [matName: string]: Material } = {}
    private _flagNode: TransformNode
    private _arrowNode: TransformNode
    private _unfinishedPos: Vector3 = new Vector3(0, 0, 0)
    private _targetPos: Vector3 = new Vector3(0, 0, 0)
    private _finishedPos:Vector3 = new Vector3(0,0,0)
    private _highLightLayer: HighlightLayer
    private _fireworkStartPos: TransformNode[] = [] //烟花起始点的位置
    private _fireworkHeight: number = 0;
    private _stairCase:Mesh[] = []
    private _currentIndex:number =0 //当前正在进行的楼梯的索引
    private _currentTask: Task;
    private _clickSound:Sound


    constructor(canvas: HTMLCanvasElement, currentTask: Task) {
        this._currentTask = currentTask;
        this._engine = new Engine(canvas, true, {stencil: true}); // stencil 打开辉光效果
        this._scene = new Scene(this._engine)
        this._flagNode = new TransformNode("flag", this._scene)
        this._arrowNode = new TransformNode("arrow", this._scene)
        this._highLightLayer = new HighlightLayer("highLightLayer", this._scene)
        this._scene.autoClear=false
        this._clickSound=new Sound('clickSound',"src/assets/sound/collegeBuildingClick.mp3",this._scene,()=>{},{volume:0.3})

        this.setUpCamera()
        this.setUpMaterial()
        this.setUpStaircase()
        this.setUpFirework()
        setTimeout(() => {
            this.moveToNext()
        }, 6000)
        setTimeout(() => {
            this.moveToNext()
        }, 9000)
        setTimeout(() => {
            this.moveToNext()
        }, 12000)

        this._engine.runRenderLoop(() => {
            this._scene.render()
        })
    }

    private _fireworks: Firework[] = []
    private _fireworkStart = false

    setUpFirework() {
        //生成烟花
        this._fireworkStartPos.forEach(startPos => {
            this._fireworks.push(new Firework(this._scene, startPos, this._fireworkHeight))

        })


        this._scene.registerBeforeRender(() => {
            if (this._fireworkStart) {

                this._fireworks.forEach(fireWork => {
                    fireWork.launchFireWork()
                })

            }
        })
    }

    setUpMaterial() {
        const finishMat = new GradientMaterial("finished", this._scene);
        finishMat.topColor = Color3.FromHexString("#AAFFA9")
        finishMat.bottomColor = Color3.FromHexString("#11FFBD")
        finishMat.offset = 0.5
        finishMat.smoothness = 1
        this._mat["finished"] = finishMat

        const unFinishedMat = new GradientMaterial("unfinished", this._scene)
        unFinishedMat.topColor = Color3.FromHexString("#bdc3c7")
        unFinishedMat.bottomColor = Color3.FromHexString("#a7a8c2")
        unFinishedMat.offset = 0.5
        this._mat["unfinished"] = unFinishedMat

        const onProgressMat = new GradientMaterial("onProgress", this._scene)
        onProgressMat.topColor = Color3.FromHexString("#F2994A")
        onProgressMat.bottomColor = Color3.FromHexString("#F2C94C")
        onProgressMat.offset = 0.5
        this._mat["onprogress"] = onProgressMat

        const groundMat = new GradientMaterial("ground", this._scene);
        groundMat.topColor = Color3.FromHexString("#89beea")
        groundMat.bottomColor = Color3.FromHexString("#89beea")
        this._mat["ground"] = groundMat
    }

    setUpCamera() {
        let target = new Vector3(this._currentTask.subTask.length / 2 + 1, this._currentTask.subTask.length / 2 + 1, -1)
        let camera = new ArcRotateCamera("camera", 3.647, 1, 10, target, this._scene);
        camera.mode = Camera.ORTHOGRAPHIC_CAMERA
        var distance = 17;
        var aspect = this._scene.getEngine()!.getRenderingCanvasClientRect()!.height / this._scene.getEngine().getRenderingCanvasClientRect()!.width;
        camera.orthoLeft = -distance / 2;
        camera.orthoRight = distance / 2;
        camera.orthoBottom = camera.orthoLeft * aspect;
        camera.orthoTop = camera.orthoRight * aspect;

        //camera.attachControl()

        this._scene.createDefaultLight()

    }


    setUpStaircase() {
        let x = 0, y = 0
        //生成楼梯


        for (let i = 0; i < this._currentTask.subTask.length; i++) {
            const subTask = this._currentTask.subTask[i];
            const staircase = MeshBuilder.CreateBox(`stairCase${i}`, {width: 1, height: 1, depth: 6});
            this._stairCase.push(staircase) //压入
            this.setGlow(staircase,subTask)
            staircase.position.set(x, y, 0)
            if (subTask.status == SubTaskState.UnFinished) {
                staircase.material = this._mat["unfinished"]
            } else if (subTask.status == SubTaskState.Finished) {
                staircase.material = this._mat["finished"]
            } else if (subTask.status == SubTaskState.OnProgress) {
                this._unfinishedPos = new Vector3(x, y + 1, 0)
                this._targetPos = new Vector3(x, y + 1, 0)
                staircase.material = this._mat["onprogress"]
                this._currentIndex=i
            }
            y += 1
            x += 1
        }
        //完成时候箭头的位置
        this._finishedPos =new Vector3(x,y+1,0)
        //设置地面
        const ground = MeshBuilder.CreateBox("ground", {width: 4, height: 1, depth: 10});
        ground.position.set(x + 1.5, y, 0)
        ground.material = this._mat["ground"]
        this._flagNode.position.set(++x, y, 0)
        SceneLoader.ImportMesh("", "src/assets/model/flag.glb", undefined, this._scene, this.flagSuccessCallBack)
        SceneLoader.ImportMesh("", "src/assets/model/arrow.glb", undefined, this._scene, this.arrowSuccessCallBack)

        this._scene.registerBeforeRender(() => {
            //平滑过渡到_targerPos
            this._unfinishedPos = Vector3.Lerp(this._unfinishedPos, this._targetPos, 0.03)
        })


        //生成烟花的起始位置
        const firework1 = new TransformNode("firework-1", this._scene);
        firework1.position.set(x, 0, 8)
        this._fireworkStartPos.push(firework1)

        this._fireworkHeight = y + 2
        const firework2 = new TransformNode("firework-2", this._scene);
        firework2.position.set(x, 0, -8)
        this._fireworkStartPos.push(firework2)
    }

    flagSuccessCallBack: SceneLoaderSuccessCallback = (meshes, particleSystems, skeletons, animationGroups, transformNodes, geometries, lights) => {
        meshes[0].parent = this._flagNode
        this._flagNode.scaling.set(2, 2, 2)
        this._flagNode.rotation.y = Math.PI / 2

    }

    rotateCount = 0 //旋转参数
    arrowSuccessCallBack: SceneLoaderSuccessCallback = (meshes, particleSystems, skeletons, animationGroups, transformNodes, geometries, lights) => {

        meshes[0].parent = this._arrowNode

        //初始位置
        this._arrowNode.position.copyFrom(this._unfinishedPos)

        this._scene.registerBeforeRender(() => {

            //箭头的位置跟随_unfinishedPos
            this._arrowNode.position.x = this._unfinishedPos.x
            this._arrowNode.position.y = Math.sin(this.rotateCount) * 0.3 + this._unfinishedPos.y
            this.rotateCount += 0.01
            this._arrowNode.rotation.y += 0.015
        })
    }

    moveToNext() {
        this._targetPos.x += 1
        this._targetPos.y += 1
        this.updateMat() //更新材质
        this.checkFinished() //检查是否完成任务
    }


    private setGlow(staircase: Mesh, subTask: SubTask) {  //设置辉光效果
        const subTaskUiState = useSubTaskUiState; //UI状态
        staircase.actionManager = new ActionManager(this._scene)
        staircase.actionManager.registerAction(new ExecuteCodeAction(
            ActionManager.OnPointerOverTrigger, (evt) => {
                this._clickSound.play()
                this._highLightLayer.addMesh(staircase, Color3.White()) //添加辉光
                subTaskUiState.setSubTaskWithShowing(true,subTask)
            }
        ))

        staircase.actionManager.registerAction(new ExecuteCodeAction(
            ActionManager.OnPointerOutTrigger, (evt) => {
                this._highLightLayer.removeMesh(staircase) //取消辉光
                subTaskUiState.setSubTaskWithShowing(false,subTask)
            }
        ))
    }

    checkFinished() {
        //检查是否任务完成
        //烟花发射

        if (this._targetPos.equals(this._finishedPos) ) {
            this._fireworkStart = true
        }
    }

    private updateMat() {
        let previousStairCase = this._stairCase[this._currentIndex];
        previousStairCase.material=this._mat["finished"]
        this._currentIndex ++
        if(this._currentIndex < this._stairCase.length){
            let currentStairCase=this._stairCase[this._currentIndex]
            currentStairCase.material=this._mat["onprogress"]
        }
    }
}


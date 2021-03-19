import {Floor} from "./collegeManager";
import {IState} from "../IState";
import {
    ActionManager,
    Animation,
    Color3,
    Engine, ExecuteCodeAction,
    HighlightLayer,
    IAnimationKey,
    Mesh,
    Scene,
    StandardMaterial,
    TransformNode
} from "@babylonjs/core";
import {AbstractMesh} from "@babylonjs/core/Meshes/abstractMesh";
import {AdvancedDynamicTexture, Rectangle, TextBlock, Ellipse, Line} from "@babylonjs/gui";


export class CollegeFloor {
    private _floor: Floor;
    private _web3DStudio: IState;
    private _floorTransformNode: TransformNode
    private _scene: Scene
    private _originYPos: number //在y轴方向的原始位置
    private _maxYPos: number //在y轴方向的最高位置
    private _studioBox!: AbstractMesh[]
    static readonly HEIGHT = 8 //每层楼的高度
    static readonly STUDIO_BOX_NAME = "studio_box_"  //工作室盒子的名称 studio_box_1 ... studio_box_6
    private _startName: string //mesh的clone起始名称

    constructor(scene: Scene, web3DStudio: IState, floor: Floor, floorRoot: Mesh, maxYPos: number) {
        this._scene = scene
        this._floor = floor;
        this._web3DStudio = web3DStudio; //为了转换状态
        this._floorTransformNode = new TransformNode(`floor-${floor.floorNumber}`, this._scene)
        this._startName = `floor-${floor.floorNumber}-meshes`
        const cloneFloor = floorRoot.clone(this._startName);
        cloneFloor.parent = this._floorTransformNode
        this.setUpStudioBox() //设置工作室盒子
        this.invisibleStudioBox() //隐藏所有盒子
        //设置高度
        this._originYPos = (this._floor.floorNumber - 1) * CollegeFloor.HEIGHT
        this._maxYPos = maxYPos - (this._floor.floorNumber - 1) * CollegeFloor.HEIGHT
        this._floorTransformNode.position.y = this._originYPos
        this.enableDepthPrePass()
        this.translucent()
    }

    setUpStudioBox() {  //设置盒子
        const meshes = this._floorTransformNode.getChildMeshes();
        let studioBox: AbstractMesh[] = []
        let cnt = 0
        meshes.forEach(mesh => {
            if (mesh.name.startsWith(`${this._startName}.${CollegeFloor.STUDIO_BOX_NAME}`)) {
                const material = new StandardMaterial(`${mesh.name}Mat`, this._scene);
                material.diffuseColor = Color3.FromHexString(CollegeFloor.StudioBoxColor[cnt++]) //工作室盒子颜色
                material.specularColor = Color3.Black() //防止高光
                mesh.material = material
                studioBox.push(mesh)
            }
        })
        //按名称排序  1 2 3 4 5 6.....
        studioBox.sort((a, b) => {
            if (a.name < b.name)
                return -1
            return 1
        })
        this._studioBox = studioBox
    }

    invisibleStudioBox() {
        for (let i = 0; i < this._studioBox.length; i++) {
            this._studioBox[i].isVisible = false
        }
    }

    public visibleStudioBox() {
        for (let i = 0; i < this._floor.studios.length; i++) {
            this._studioBox[i].isVisible = true
        }
    }

    static readonly StudioBoxColor: string[] = ["#FFDBAC", "#F6DEE4", "#C1DDF9", "#EAE2D6", "#D1F8E9", "#C6EB93"]

    public showStudioName(uiTexture: AdvancedDynamicTexture) {
        for (let i = 0; i < this._floor.studios.length; i++) {
            const studioBox = this._studioBox[i];
            const studio = this._floor.studios[i];
            let rect1 = new Rectangle();
            rect1.width = 0.2;
            rect1.height = "40px";
            rect1.cornerRadius = 20;
            rect1.color = "#67daff";
            rect1.thickness = 4;
            rect1.background = "#3498DB";
            uiTexture.addControl(rect1);
            rect1.linkWithMesh(studioBox);
            rect1.linkOffsetY = -150;

            let label = new TextBlock();
            label.text = studio.name;
            label.color = "white"
            rect1.addControl(label);

            let target = new Ellipse();
            target.width = "40px";
            target.height = "40px";
            target.color = "#67daff";
            target.thickness = 4;
            target.background = "#3498DB";
            uiTexture.addControl(target);
            target.linkWithMesh(studioBox);

            var line = new Line();
            line.lineWidth = 4;
            line.color = "#67daff";
            line.y2 = 20;
            line.linkOffsetY = -20;
            uiTexture.addControl(line);
            line.linkWithMesh(studioBox);
            line.connectedControl = rect1;
        }
    }


    enableDepthPrePass() { //防止深度测试问题
        const childMeshes = this._floorTransformNode.getChildMeshes();
        childMeshes.forEach(mesh => {
            const material = mesh.material;
            if (material != null) {
                material.needDepthPrePass = true  //打开深度预渲染 防止深度测试问题
            }
        })
    }

    public translucent() { //半透明
        const childMeshes = this._floorTransformNode.getChildMeshes();
        childMeshes.forEach(mesh => {
            mesh.visibility = 0.2
        })
    }

    public floorInvisible() {
        const childMeshes = this._floorTransformNode.getChildMeshes();
        childMeshes.forEach(mesh => {
            //开始动画
            this._scene.beginDirectAnimation(mesh, this.createInvisibleAnim(mesh), 0, CollegeFloor.frameRate, false)
        })
    }

    public floorVisible(onAnimationEnd?: () => void) {
        const childMeshes = this._floorTransformNode.getChildMeshes();
        childMeshes.forEach((mesh, index) => {
            //开始动画
            if (index != childMeshes.length - 1) {
                this._scene.beginDirectAnimation(mesh, this.createVisibleAnim(mesh), 0, CollegeFloor.frameRate, false)
            } else {
                this._scene.beginDirectAnimation(mesh, this.createVisibleAnim(mesh), 0, CollegeFloor.frameRate, false, undefined, () => {
                    if (onAnimationEnd)
                        onAnimationEnd()
                })

            }
        })
    }

    private createInvisibleAnim(mesh: AbstractMesh) {
        const animation = new Animation(`invisibleAnim-${this._floor.floorNumber}`, "visibility", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames: IAnimationKey[] = []
        keyFrames.push({
            frame: 0,
            value: mesh.visibility
        })
        keyFrames.push({
            frame: CollegeFloor.frameRate,
            value: 0.2 //半透明
        })
        animation.setKeys(keyFrames)
        return [animation]
    }

    private createVisibleAnim(mesh: AbstractMesh) {
        const animation = new Animation(`visibleAnim-${this._floor.floorNumber}`, "visibility", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames: IAnimationKey[] = []
        keyFrames.push({
            frame: 0,
            value: mesh.visibility
        })
        keyFrames.push({
            frame: CollegeFloor.frameRate,
            value: 1 //显示
        })
        animation.setKeys(keyFrames)
        return [animation]
    }

    public pushToOrigin(delay: number, onAnimationEnd?: () => void) {  //压入到原位置   延迟时间
        console.log('开始push动画')
        const seconds = delay / 1000 //秒
        this._scene.beginDirectAnimation(this._floorTransformNode, this.createPushAnim(seconds), 0,
            CollegeFloor.frameRate * seconds + CollegeFloor.pushAnimationTime, false, undefined, () => {
                if (onAnimationEnd) {
                    onAnimationEnd()
                }
            })
    }

    public popToMaxHeight(delay: number, onAnimationEnd?: () => void) { //弹出到最高的位置上去 延迟时间
        console.log('开始pop动画')
        const seconds = delay / 1000 //秒
        this._scene.beginDirectAnimation(this._floorTransformNode, this.createPopAnim(seconds), 0,
            CollegeFloor.frameRate * seconds + CollegeFloor.popAnimationTime, false, undefined, () => {
                if (onAnimationEnd) {
                    onAnimationEnd()
                }
            })
    }

    private createPushAnim(delaySecond: number) {
        const animation = new Animation(`pushAnim-${this._floor.floorNumber}`, "position.y", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames: IAnimationKey[] = []
        keyFrames.push({
            frame: 0,
            value: this._floorTransformNode.position.y
        })
        keyFrames.push({
            frame: CollegeFloor.frameRate * delaySecond,
            value: this._floorTransformNode.position.y
        })
        keyFrames.push({
            frame: CollegeFloor.frameRate * delaySecond + CollegeFloor.pushAnimationTime,
            value: this._originYPos  //回到原来的位置上去
        })

        animation.setKeys(keyFrames)
        return [animation]
    }

    private createPopAnim(delaySecond: number) {
        const animation = new Animation(`popAnim-${this._floor.floorNumber}`, "position.y", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames: IAnimationKey[] = []
        keyFrames.push({
            frame: 0,
            value: this._floorTransformNode.position.y
        })
        keyFrames.push({
            frame: CollegeFloor.frameRate * delaySecond,
            value: this._floorTransformNode.position.y
        })
        keyFrames.push({
            frame: CollegeFloor.frameRate * delaySecond + CollegeFloor.pushAnimationTime,
            value: this._maxYPos  //弹出去
        })

        animation.setKeys(keyFrames)
        return [animation]
    }

    static frameRate = 60
    static pushAnimationTime = CollegeFloor.frameRate / 4
    static popAnimationTime = CollegeFloor.frameRate


    setHighLight(highLightLayer: HighlightLayer) {  //设置高光
        this._studioBox.forEach(mesh => {
            if (mesh instanceof Mesh) {
                mesh.actionManager = new ActionManager(this._scene)
                mesh.actionManager.registerAction(new ExecuteCodeAction(  //鼠标悬浮
                    ActionManager.OnPointerOverTrigger, () => {
                        highLightLayer.addMesh(mesh, Color3.White()) //白光
                    }
                ))
                mesh.actionManager.registerAction(new ExecuteCodeAction(  //鼠标悬浮
                    ActionManager.OnPointerOutTrigger, () => {
                        highLightLayer.removeMesh(mesh) //白光
                    }
                ))
            }
        })
    }
}

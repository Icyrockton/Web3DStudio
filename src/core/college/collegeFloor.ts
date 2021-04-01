import {CollegeManagerSound, Floor} from "./collegeManager";
import {IState} from "../IState";
import {
    ActionManager,
    Animation,
    Color3, Color4, CubicEase, EasingFunction,
    Engine, ExecuteCodeAction,
    HighlightLayer,
    IAnimationKey, InstancedMesh,
    Mesh, Quaternion,
    Scene,
    StandardMaterial, Texture,
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
    private _unnecessaryList!: AbstractMesh[]
    private _locNode: TransformNode[] = []
    static readonly HEIGHT = 8 //每层楼的高度
    static readonly STUDIO_BOX_NAME = "studio_box_"  //工作室盒子的名称 studio_box_1 ... studio_box_6
    private _startName: string //mesh的clone起始名称
    private _sound: CollegeManagerSound;

    constructor(scene: Scene, web3DStudio: IState, floor: Floor, floorRoot: Mesh, maxYPos: number, sound: CollegeManagerSound) {
        this._scene = scene
        this._sound = sound;
        this._floor = floor;
        this._web3DStudio = web3DStudio; //为了转换状态
        this._floorTransformNode = new TransformNode(`floor-${floor.floorNumber}`, this._scene)
        this._startName = `floor-${floor.floorNumber}-meshes`
        const cloneFloor = floorRoot.clone(this._startName);
        cloneFloor.parent = this._floorTransformNode
        // //找到地面 地面接受阴影
        // cloneFloor.getChildMeshes().forEach(mesh=>{
        //     if (mesh.name == `${this._startName}.ground`){
        //         mesh.receiveShadows = true
        //     }
        // })
        this.setUpStudioBox() //设置工作室盒子
        this.setUpUnnecessary() //隐藏不必要的东西
        this.setUpLoc() //地标位置
        //设置高度
        this._originYPos = (this._floor.floorNumber - 1) * CollegeFloor.HEIGHT
        this._maxYPos = maxYPos - (this._floor.floorNumber - 1) * CollegeFloor.HEIGHT
        this._floorTransformNode.position.y = this._originYPos
        this.enableDepthPrePass()
        this.translucent() //显示所有mesh 并且visibility = 0.2
        this.invisibleStudioBox() //不可见工作室盒子
        this.hideUnnecessary()
    }

    setUpStudioBox() {  //设置盒子
        const meshes = this._floorTransformNode.getChildMeshes();
        let studioBox: AbstractMesh[] = []
        let cnt = 0
        meshes.forEach(mesh => {
            if (mesh.name.startsWith(`${this._startName}.${CollegeFloor.STUDIO_BOX_NAME}`)) {
                const material = new StandardMaterial(`${mesh.name}Mat`, this._scene);
                material.diffuseColor = Color3.FromHexString(CollegeFloor.StudioBoxColor[cnt++]) //工作室盒子颜色
                //material.specularColor = Color3.Black() //防止高光
                mesh.material = material
                mesh.material.needDepthPrePass = true
                mesh.visibility = 1
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
            this._studioBox[i].visibility = 0
            this._studioBox[i].isVisible = true
            this._scene.beginDirectAnimation(this._studioBox[i], this.createVisibleAnim(this._studioBox[i]), 0, CollegeFloor.frameRate, false)
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
            rect1.width = "230px";
            rect1.cornerRadius = 20;
            rect1.color = "#c28300";
            rect1.thickness = 4;
            rect1.background = "#ff5800";
            uiTexture.addControl(rect1);
            rect1.linkWithMesh(studioBox);
            rect1.linkOffsetY = -150;

            let label = new TextBlock();
            label.text = studio.name;
            label.color = "black"
            rect1.addControl(label);

            let target = new Ellipse();
            target.width = "40px";
            target.height = "40px";
            target.color = "#c28300";
            target.thickness = 4;
            target.background = "#ff5800";
            uiTexture.addControl(target);
            target.linkWithMesh(studioBox);

            var line = new Line();
            line.lineWidth = 4;
            line.color = "#c28300";
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
            mesh.isVisible = true
            if (!(mesh instanceof InstancedMesh)) {  //InstancedMesh不能设置visibility
                mesh.visibility = 1
            }
        })
    }

    public floorInvisible() {
        let childMeshes = this._floorTransformNode.getChildMeshes();
        childMeshes = childMeshes.filter(mesh => {
            return mesh instanceof Mesh;
        })
        childMeshes.forEach(mesh => {
            //开始动画
            this._scene.beginDirectAnimation(mesh, this.createInvisibleAnim(mesh), 0, CollegeFloor.frameRate, false)
        })
    }

    public floorVisible(onAnimationEnd?: () => void) {
        let childMeshes = this._floorTransformNode.getChildMeshes();
        childMeshes = childMeshes.filter(mesh => {
            return mesh instanceof Mesh;
        })
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
            value: 1 //半透明
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
        const seconds = delay / 1000 //秒
        this._scene.beginDirectAnimation(this._floorTransformNode, this.createPushAnim(seconds), 0,
            CollegeFloor.frameRate * seconds + CollegeFloor.pushAnimationTime, false, undefined, () => {
                if (onAnimationEnd) {
                    onAnimationEnd()
                }
            })
    }

    public popToMaxHeight(delay: number, onAnimationEnd?: () => void) { //弹出到最高的位置上去 延迟时间
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


    setStudioBoxAction() {  //设置高光
        this._studioBox.forEach((mesh, index) => {
            if (mesh instanceof Mesh) {
                if (mesh.actionManager == null) {
                    mesh.actionManager = new ActionManager(this._scene)
                    mesh.actionManager.registerAction(new ExecuteCodeAction(  //鼠标悬浮
                        ActionManager.OnPointerOverTrigger, () => {
                            //highLightLayer.addMesh(mesh, Color3.FromHexString("#04D792")) //白光
                            this.studioHoverAnim(mesh, true)
                        }
                    ))
                    mesh.actionManager.registerAction(new ExecuteCodeAction(  //鼠标悬浮
                        ActionManager.OnPointerOutTrigger, () => {
                            //highLightLayer.removeMesh(mesh) //白光
                            this.studioHoverAnim(mesh, false)
                        }
                    ))
                    mesh.actionManager.registerAction(new ExecuteCodeAction(
                        ActionManager.OnPickDownTrigger, () => {
                            //点击进入工作室
                            this._web3DStudio.goToStudio(this._floor.studios[index].uuid)
                        }
                    ))
                }
            }
        })
    }

    clearStudioBoxAction(){
        this._studioBox.forEach((mesh, index) => {
            if (mesh instanceof Mesh) {
                mesh.actionManager = null
            }
        })
    }

    private studioHoverAnim(studioBox: AbstractMesh, isHover: boolean){
        this._scene.beginDirectAnimation(studioBox, this.createStudioBoxHoverAnim(studioBox, isHover), 0, CollegeFloor.frameRate  / 2, false)

    }

    private createStudioBoxHoverAnim(studioBox: AbstractMesh, isHover: boolean) {
        const studioBoxanimation = new Animation(`studioBoxanimation`, "position.y", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames: IAnimationKey[] = []

        keyFrames.push({
            frame: 0,
            value: studioBox.position.y
        })
        keyFrames.push({
            frame: CollegeFloor.frameRate / 2,
            value: isHover ? 2 : 1
        })

        const cubicEase = new CubicEase();
        cubicEase.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
        studioBoxanimation.setEasingFunction(cubicEase)
        studioBoxanimation.setKeys(keyFrames)
        return [studioBoxanimation]
    }


    static LEFT_DOOR_NAME = "studio_door_left_"
    static RIGHT_DOOR_NAME = "studio_door_right_"

    public openDoor(studioIndex: number, cb?: () => void) {  //工作室开门动画 studioIndex 为1~6
        //找到左边的门
        const leftDoorName = `${this._startName}.${CollegeFloor.LEFT_DOOR_NAME}${studioIndex}`
        //找到右边的门
        const rightDoorName = `${this._startName}.${CollegeFloor.RIGHT_DOOR_NAME}${studioIndex}`
        const meshes = this._floorTransformNode.getChildMeshes();
        let leftDoor: Mesh | null | InstancedMesh = null
        let rightDoor: Mesh | null | InstancedMesh = null
        meshes.forEach(mesh => {
            if ((mesh instanceof Mesh) || (mesh instanceof InstancedMesh)) {
                if (mesh.name == leftDoorName) { //找到左边的门
                    leftDoor = mesh
                } else if (mesh.name == rightDoorName) { //找到右边的门
                    rightDoor = mesh
                }
            }
        })
        console.log(leftDoor, rightDoor)
        if (leftDoor == null || rightDoor == null)
            return

        //开启动画
        if (studioIndex == 1 || studioIndex == 2) {
            this._scene.beginDirectAnimation(leftDoor, this.createDoorAnim(leftDoor, -Math.PI / 2), 0, CollegeFloor.frameRate, false, 1, cb)
            this._scene.beginDirectAnimation(rightDoor, this.createDoorAnim(rightDoor, Math.PI / 2), 0, CollegeFloor.frameRate, false)
        } else if (studioIndex == 3 || studioIndex == 4) {
            this._scene.beginDirectAnimation(leftDoor, this.createDoorAnim(leftDoor, Math.PI / 2), 0, CollegeFloor.frameRate, false, 1, cb)
            this._scene.beginDirectAnimation(rightDoor, this.createDoorAnim(rightDoor, -Math.PI / 2), 0, CollegeFloor.frameRate, false)
        } else if (studioIndex == 5) {
            this._scene.beginDirectAnimation(leftDoor, this.createDoorAnim(leftDoor, Math.PI), 0, CollegeFloor.frameRate, false, 1, cb)
            this._scene.beginDirectAnimation(rightDoor, this.createDoorAnim(rightDoor, 0), 0, CollegeFloor.frameRate, false)
        } else {
            this._scene.beginDirectAnimation(leftDoor, this.createDoorAnim(leftDoor, Math.PI), 0, CollegeFloor.frameRate, false, 1, cb)
            this._scene.beginDirectAnimation(rightDoor, this.createDoorAnim(rightDoor, 0), 0, CollegeFloor.frameRate, false)
        }
    }

    private createDoorAnim(door: Mesh, rotateY: number) {
        if (door.rotationQuaternion != null) {
            const animation = new Animation(`DoorAnim-${this._floor.floorNumber}`, "rotationQuaternion", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT);
            const keyFrames: IAnimationKey[] = []

            keyFrames.push({
                frame: 0,
                value: door.rotationQuaternion
            })
            keyFrames.push({
                frame: CollegeFloor.frameRate,
                value: Quaternion.FromEulerAngles(0, rotateY, 0)
            })

            animation.setKeys(keyFrames)
            return [animation]
        }
        return []
    }

    public hide() {
        const childMeshes = this._floorTransformNode.getChildMeshes();
        childMeshes.forEach(mesh => {
            mesh.isVisible = false//不可见
        })
    }

    //性能优化
    public hideUnnecessary() { //隐藏不必要的东西
        this._unnecessaryList.forEach(mesh => {
            mesh.isVisible = false
        })
    }

    private setUpUnnecessary() {
        let list: AbstractMesh [] = []
        // 1. SM开头的东西
        const childMeshes = this._floorTransformNode.getChildMeshes();
        childMeshes.forEach(mesh => {
            if (mesh.name.startsWith(`${this._startName}.SM_`)) {
                mesh.isVisible = false
                list.push(mesh)
            }
        })

        this._unnecessaryList = list
    }

    public showUnnecessary() {
        this._unnecessaryList.forEach(mesh => {
            mesh.isVisible = true
        })
    }

    static readonly POST_NAME = "post_" //海报
    static readonly STUDIO_NAME = "studio_name_" //工作室LOGO
    private hasLoadedTexture = false

    public loadTexture() { //加载贴图
        if (this.hasLoadedTexture)
            return
        const childMeshes = this._floorTransformNode.getChildMeshes();
        let post: Mesh[] = []
        let studioName: Mesh[] = []
        childMeshes.forEach(mesh => {
            if (mesh instanceof Mesh) {
                if (mesh.name.startsWith(`${this._startName}.${CollegeFloor.POST_NAME}`)) {
                    post.push(mesh)
                } else if (mesh.name.startsWith(`${this._startName}.${CollegeFloor.STUDIO_NAME}`)) {
                    studioName.push(mesh)
                }
            }
        })
        //排序
        post.sort((a, b) => {
            if (a.name < b.name)
                return -1
            return 1
        })
        studioName.sort((a, b) => {
            if (a.name < b.name)
                return -1
            return 1
        })

        for (let i = 0; i < this._floor.studios.length; i++) {
            const studio = this._floor.studios[i];
            //海报纹理
            const postMat = new StandardMaterial(`${this._startName}.PostMat${i}`, this._scene);
            const postTexture = new Texture(studio.posterTextureURL, this._scene);
            postTexture.uAng = Math.PI
            postMat.diffuseTexture = postTexture //加载贴图
            post[i].material = postMat //设置材质
            //LOGO纹理
            const logoMat = new StandardMaterial(`${this._startName}.LogoMat${i}`, this._scene);
            const logoTexture = new Texture(studio.logoTextureURL, this._scene);
            logoTexture.uAng = Math.PI
            logoMat.diffuseTexture = logoTexture //加载贴图
            studioName[i].material = logoMat //设置材质

        }
        this.hasLoadedTexture = true //已经加载完毕
    }

    private setUpLoc() {
        const childTransformNodes = this._floorTransformNode.getChildTransformNodes();
        childTransformNodes.forEach(node => {
            if (node.name.startsWith(`${this._startName}.Loc_`)) {
                this._locNode.push(node)
            }
        })
    }

    public get locTransformNode() {
        return this._locNode
    }

}

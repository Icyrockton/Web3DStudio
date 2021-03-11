import {
    ActionManager, Animatable, Animation, BackEase, EasingFunction, ExecuteCodeAction, IAnimationKey, MeshBuilder,
    Scene,
    SceneLoader,
    SceneLoaderSuccessCallback,
    StandardMaterial,
    Texture,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {BookDetail, BookShelf, BookSound} from "./bookShelf";
import {AnimationGroup} from "@babylonjs/core/Animations/animationGroup";
import {AdvancedDynamicTexture} from "@babylonjs/gui";

enum BookState {
    init, //原始位置
    outing, //正在悬浮出来
    done,//悬浮完成
    ining, //悬浮进入
    cameraOut, //移动到camera
    camera,
    cameraIn
}

export class Book {
    private _scene: Scene;
    private _bookDetail: BookDetail;
    public bookNode: TransformNode
    static readonly BOOK_URL = "src/assets/model/book.glb"
    private _openBookAnim?: AnimationGroup
    private _closeBookAnim?: AnimationGroup
    private _position: Vector3;
    private _state: BookState = BookState.init
    private _targetPos: Vector3 //悬浮目标位置
    private _targetCameraPos: Vector3 //鼠标点击后 书籍移动到的位置
    private _bookSound: BookSound;
    constructor(scene: Scene, bookDetail: BookDetail, position: Vector3, bookSound: BookSound) {
        this._scene = scene;
        this._bookDetail = bookDetail;
        this._position = position;
        this._bookSound = bookSound;
        this._targetCameraPos = new Vector3(-2, 1.5, 0)
        //0.1的悬浮出来的位置
        this._targetPos = new Vector3(position.x - 0.15, position.y, position.z)
        this.bookNode = new TransformNode(`book-${bookDetail.uuid}`, this._scene)
        SceneLoader.ImportMesh("", Book.BOOK_URL, undefined, this._scene, this._callback)
        // const mesh = MeshBuilder.CreateBox("box", {size: 1});
        // mesh.position.y = 1
        // mesh.position.x = -1
    }

    private _callback: SceneLoaderSuccessCallback = (meshes, particleSystems, skeletons, animationGroups, transformNodes) => {

        //设置父级
        meshes[0].parent = this.bookNode
        this.bookNode.rotation.x = -Math.PI / 2

        const content = meshes[1];
        const cover = meshes[2];
        //设置位置
        this.bookNode.position.copyFrom(this._position)

        this._openBookAnim = animationGroups.find(animationGroup => animationGroup.name == "OpenBook")
        this._openBookAnim?.stop()
        this._closeBookAnim = animationGroups.find(animationGroup => animationGroup.name == "CloseBook")
        this._closeBookAnim?.stop()

        //设置纹理
        if (this._bookDetail.textureImgURL != "") {
            const texture = new Texture(this._bookDetail.textureImgURL, this._scene);
            const material = new StandardMaterial(`book-${this._bookDetail.uuid}-CoverMat`, this._scene);
            material.diffuseTexture = texture
            cover.material = material
        }

        //设置动画
        cover.actionManager = new ActionManager(this._scene)
        cover.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
            this.hoverOut() //悬浮出来
        }))
        cover.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
            this.hoverIn() //悬浮进入
        }))
        cover.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickDownTrigger, () => {
            if (this._state == BookState.done) {  //如果已经悬浮出来了 再次单击 可以打开书
                if (this.hoverOutAnim) {
                    this.hoverOutAnim.stop()
                }

                this.createMoveToCamera()
                this.cameraOutAnim = this._scene.beginAnimation(this.bookNode, 0, Book.frameRate * 2, false, undefined, () => {
                    this._state = BookState.camera
                    this.playOpenBook()
                    this._bookSound.playOpenBookSound()
                })
                this._state = BookState.cameraOut
            }
        }))
    }


    private playOpenBook() {
        this._openBookAnim?.play(false)
    }

    private playCloseBook() {
        this._closeBookAnim?.play(false)
    }

    private hoverOutAnim?: Animatable
    private cameraOutAnim?: Animatable
    private hoverInAnim?: Animatable

    private hoverOut() {  //书籍悬浮出来
        if (this._state == BookState.init || this._state == BookState.ining) { //初始位置 或者正在悬浮进入
            if (this.hoverInAnim) {
                this.hoverInAnim.stop()
            }
            this.createHoverOutAnimation()
            this.hoverOutAnim = this._scene.beginAnimation(this.bookNode, 0, Book.frameRate, false, undefined, () => {
                this._state = BookState.done
            })
            this._state = BookState.outing //悬浮出来
        }
    }

    private hoverIn() {   //书籍悬浮进入
        if (this._state == BookState.outing || this._state == BookState.done) { //完成位置 或者正在悬浮出来
            if (this.hoverOutAnim) {
                this.hoverOutAnim.stop()
            }
            this.createHoverInAnimation()
            this.hoverInAnim = this._scene.beginAnimation(this.bookNode, 0, Book.frameRate, false, undefined, () => {
                this._state = BookState.init
            })
            this._state = BookState.ining //悬浮进入
        }
    }

    private createHoverOutAnimation() {
        let hoverOutAnimation = new Animation("hoverOut", "position.x", Book.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames: IAnimationKey[] = []
        keyFrames.push({
            frame: 0,
            value: this.bookNode.position.x
        })
        keyFrames.push({
            frame: 30,
            value: this._targetPos.x
        })
        let easeFunction = new BackEase()
        easeFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
        hoverOutAnimation.setEasingFunction(easeFunction)
        hoverOutAnimation.setKeys(keyFrames)
        this.bookNode.animations.push(hoverOutAnimation) //添加悬浮出来的动画
    }

    private createHoverInAnimation() {
        let hoverInAnimation = new Animation("hoverIn", "position.x", Book.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames: IAnimationKey[] = []
        keyFrames.push({
            frame: 0,
            value: this.bookNode.position.x
        })
        keyFrames.push({
            frame: 30,
            value: this._position.x
        })
        let easeFunction = new BackEase()
        easeFunction.setEasingMode(EasingFunction.EASINGMODE_EASEIN)
        hoverInAnimation.setEasingFunction(easeFunction)
        hoverInAnimation.setKeys(keyFrames)
        this.bookNode.animations.push(hoverInAnimation) //添加悬浮出来的动画
    }


    private createMoveToCamera() {
        const moveAnim = new Animation("moveAnim", "position", Book.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const moveKeyFrames: IAnimationKey[] = []
        moveKeyFrames.push({
            frame: 0,
            value: this.bookNode.position
        })

        moveKeyFrames.push({
            frame: 60,
            value: this._targetCameraPos
        })

        //120 2秒钟
        moveKeyFrames.push({
            frame: 120,
            value: this._targetCameraPos
        })
        moveAnim.setKeys(moveKeyFrames)

        //Y轴旋转
        const rotateYAnim = new Animation("rotateYAnim", "rotation.y", Book.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const rotateYkeyFrames: IAnimationKey[] = []
        rotateYkeyFrames.push({
            frame: 0,
            value: this.bookNode.rotation.y
        })

        rotateYkeyFrames.push({
            frame: 60,
            value: Math.PI / 2
        })

        rotateYkeyFrames.push({
            frame: 120,
            value: Math.PI / 2
        })

        rotateYAnim.setKeys(rotateYkeyFrames)

        //X轴旋转
        const rotateXAnim = new Animation("rotateXAnim", "rotation.x", Book.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const rotateXkeyFrames: IAnimationKey[] = []
        rotateXkeyFrames.push({
            frame: 0,
            value: this.bookNode.rotation.x
        })

        rotateXkeyFrames.push({
            frame: 60,
            value: -Math.PI / 2.5
        })
        rotateXAnim.setKeys(rotateXkeyFrames)


        this.bookNode.animations.push(rotateYAnim)
        this.bookNode.animations.push(rotateXAnim)
        this.bookNode.animations.push(moveAnim)
    }

    static frameRate = 60


}

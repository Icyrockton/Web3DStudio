import {
    ActionManager,
    Animatable,
    Animation,
    BackEase,
    Color3,
    EasingFunction,
    ExecuteCodeAction,
    IAnimationKey,
    MeshBuilder,
    Scene,
    SceneLoader,
    SceneLoaderSuccessCallback,
    ShadowGenerator,
    StandardMaterial,
    Texture,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {BookDetail, BookShelf, BookSound} from "./bookShelf";
import {AnimationGroup} from "@babylonjs/core/Animations/animationGroup";
import {AdvancedDynamicTexture} from "@babylonjs/gui";
import useBookShelfUiState from "../../components/GUI/bookShelf/bookShelfUiState";

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
    private _shadowGenerator: ShadowGenerator;

    constructor(scene: Scene, bookDetail: BookDetail, position: Vector3, bookSound: BookSound, shadowGenerator: ShadowGenerator) {
        this._scene = scene;
        this._bookDetail = bookDetail;
        this._position = position;
        this._bookSound = bookSound;
        this._shadowGenerator = shadowGenerator;
        this._targetCameraPos = new Vector3(-2.2, 1.25, 0)
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
        this.bookNode.scaling.y = this._bookDetail.thickness //书的厚度
        const content = meshes[1];
        const cover = meshes[2];
        this._shadowGenerator.addShadowCaster(meshes[0], true) //添加阴影
        //设置位置
        this.bookNode.position.copyFrom(this._position)

        const bookShelfUiState = useBookShelfUiState;
        this._openBookAnim = animationGroups.find(animationGroup => animationGroup.name == "OpenBook")
        //打开书后开始播放回调
        this._openBookAnim?.onAnimationGroupEndObservable.add(() => {
            if (this._state == BookState.camera) {
                bookShelfUiState.setBookWithDetail(this, this._bookDetail)
                bookShelfUiState.setVideoShowing(true)
            }
        })
        this._openBookAnim?.stop()
        this._closeBookAnim = animationGroups.find(animationGroup => animationGroup.name == "CloseBook")
        //关闭书后回到原位的回调
        this._closeBookAnim?.onAnimationGroupEndObservable.add(() => {
            this.moveToOriginStepTwo() //关书后进行接下来的动画
        })
        this._closeBookAnim?.stop()

        //设置纹理
        if (this._bookDetail.textureImgURL != "") {
            const texture = new Texture(this._bookDetail.textureImgURL, this._scene);
            const material = new StandardMaterial(`book-${this._bookDetail.uuid}-CoverMat`, this._scene);
            material.specularColor = Color3.Black()
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
                this.hoverOutAnim?.stop()

                this.cameraOutAnim = this._scene.beginDirectAnimation(this.bookNode, this.createMoveToCamera()
                    , 0, Book.frameRate * 2, false, undefined, () => {
                        this._state = BookState.camera
                        this.playOpenBook()
                        this.cameraOutAnim?.stop()
                        this._bookSound.playOpenBookSound()
                    })
                this._state = BookState.cameraOut
            }
        }))
    }

    public moveToOriginStepOne() { //动画到原始位置
        if (this._state == BookState.camera) {
            this.cameraOutAnim?.stop()
            this.playCloseBook()
        }
    }

    private moveToOriginStepTwo() {
        if (this._state == BookState.camera) {
            this._bookSound.playCloseBookSound() //关书的声音

            this.cameraInAnim = this._scene.beginDirectAnimation(this.bookNode, this.createMoveIn(), 0, Book.frameRate * 2, false, undefined, () => {
                this._state = BookState.init
            })

            this._state = BookState.cameraIn
        }
    }

    private playOpenBook() {
        const bookShelfUiState = useBookShelfUiState;
        bookShelfUiState.setShelfShowing(false) //关闭书架的UI 防止视频挡住
        this._openBookAnim?.play(false)
    }

    private playCloseBook() {
        this._closeBookAnim?.play(false)

    }

    private hoverOutAnim?: Animatable
    private cameraOutAnim?: Animatable
    private cameraInAnim?: Animatable
    private hoverInAnim?: Animatable

    private hoverOut() {  //书籍悬浮出来
        if (this._state == BookState.init || this._state == BookState.ining) { //初始位置 或者正在悬浮进入
            this.hoverInAnim?.stop()


            this.hoverOutAnim = this._scene.beginDirectAnimation(this.bookNode, this.createHoverOutAnimation(), 0, Book.frameRate, false, undefined, () => {
                this._state = BookState.done
            })
            this._bookSound.playClickBookSound()
            this._state = BookState.outing //悬浮出来
        }
    }

    private hoverIn() {   //书籍悬浮进入
        if (this._state == BookState.outing || this._state == BookState.done) { //完成位置 或者正在悬浮出来
            this.hoverOutAnim?.stop()

            this.hoverInAnim = this._scene.beginDirectAnimation(this.bookNode, this.createHoverInAnimation()
                , 0, Book.frameRate, false, undefined, () => {
                    this._state = BookState.init
                })

            this._state = BookState.ining //悬浮进入
        }
    }

    private createHoverOutAnimation() {
        let hoverOutAnimation = new Animation("hoverOut", "position", Book.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames: IAnimationKey[] = []

        console.log('hoverOutAnim', this.bookNode.position, this._targetPos)
        keyFrames.push({
            frame: 0,
            value: this.bookNode.position
        })
        keyFrames.push({
            frame: 30,
            value: this._targetPos
        })
        let easeFunction = new BackEase()
        easeFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
        hoverOutAnimation.setEasingFunction(easeFunction)
        hoverOutAnimation.setKeys(keyFrames)
        // this.bookNode.animations.push(hoverOutAnimation) //添加悬浮出来的动画
        return [hoverOutAnimation]
    }

    private createHoverInAnimation() {
        let hoverInAnimation = new Animation("hoverIn", "position", Book.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames: IAnimationKey[] = []
        keyFrames.push({
            frame: 0,
            value: this.bookNode.position
        })
        keyFrames.push({
            frame: 30,
            value: this._position
        })
        let easeFunction = new BackEase()
        easeFunction.setEasingMode(EasingFunction.EASINGMODE_EASEIN)
        hoverInAnimation.setEasingFunction(easeFunction)
        hoverInAnimation.setKeys(keyFrames)
        //this.bookNode.animations.push(hoverInAnimation) //添加悬浮出来的动画
        return [hoverInAnimation]
    }


    private createMoveToCamera() {
        const moveAnim = new Animation("moveAnim", "position", Book.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const moveKeyFrames: IAnimationKey[] = []
        moveKeyFrames.push({
            frame: 0,
            value: this.bookNode.position
        })

        moveKeyFrames.push({
            frame: 15,
            value: this._targetPos.add(new Vector3(-0.3, 0, 0))
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

        rotateYAnim.setKeys(rotateYkeyFrames)

        //X轴旋转
        const rotateXAnim = new Animation("rotateXAnim", "rotation.x", Book.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const rotateXkeyFrames: IAnimationKey[] = []
        rotateXkeyFrames.push({
            frame: 60,
            value: this.bookNode.rotation.x
        })

        rotateXkeyFrames.push({
            frame: 90,
            value: -Math.PI / 2.5
        })

        rotateXAnim.setKeys(rotateXkeyFrames)


        return [rotateYAnim, rotateXAnim, moveAnim]
    }

    static frameRate = 60


    private createMoveIn() {
        const moveAnim = new Animation("moveAnimReverse", "position", Book.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const moveKeyFrames: IAnimationKey[] = []

        moveKeyFrames.push({
            frame: 0,
            value: this.bookNode.position
        })

        moveKeyFrames.push({
            frame: 40,
            value: this.bookNode.position
        })

        //120 2秒钟
        moveKeyFrames.push({
            frame: 100,
            value: this._targetPos.add(new Vector3(-0.5, 0, 0))
        })

        moveKeyFrames.push({
            frame: 120,
            value: this._position
        })

        moveAnim.setKeys(moveKeyFrames)


        //X轴旋转
        const rotateXAnim = new Animation("rotateXAnimReverse", "rotation.x", Book.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const rotateXKeyFrames: IAnimationKey[] = []
        rotateXKeyFrames.push({
            frame: 0,
            value: this.bookNode.rotation.x
        })


        rotateXKeyFrames.push({
            frame: 60,
            value: -Math.PI / 2

        })
        rotateXAnim.setKeys(rotateXKeyFrames)

        //Y轴旋转
        const rotateYAnim = new Animation("rotateYAnimReverse", "rotation.y", Book.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const rotateYKeyFrames: IAnimationKey[] = []
        rotateYKeyFrames.push({
            frame: 60,
            value: this.bookNode.rotation.y
        })

        rotateYKeyFrames.push({
            frame: 100,
            value: 0
        })
        rotateYAnim.setKeys(rotateYKeyFrames)


        return [rotateXAnim, rotateYAnim, moveAnim]
    }
}

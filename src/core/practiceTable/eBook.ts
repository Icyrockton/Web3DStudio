import {
    ActionManager, Animatable, Animation, BackEase,
    CascadedShadowGenerator, Color3, EasingFunction, ExecuteCodeAction,
    HighlightLayer, IAnimationKey, Mesh,
    Scene,
    SceneLoader,
    SceneLoaderSuccessCallback, StandardMaterial, Texture, TransformNode,
    Vector3
} from "@babylonjs/core";
import {EBookDetail, EBookUtil, PracticeTable} from "./practiceTable";
import {AnimationGroup} from "@babylonjs/core/Animations/animationGroup";
import useBookShelfUiState from "../../components/GUI/bookShelf/bookShelfUiState";
import usePracticeTableUiState from "../../components/GUI/practiceTable/practiceTableUiState";
import usePlayerUiState from "../../components/GUI/player/playerUiState";

enum BookState {
    init, //原始位置
    outing, //正在悬浮出来
    done,//悬浮完成
    ining, //悬浮进入
    cameraOut, //移动到camera
    camera,
    cameraIn
}


export class EBook {
    private _scene: Scene;
    private _eBook: EBookDetail;
    private _position: Vector3;
    private _shadowGenerator: CascadedShadowGenerator;
    private _highLightLayer: HighlightLayer;

    static readonly EBOOK_URL = "model/book.glb"
    private _eBookNode: TransformNode;
    private _openBookAnim?: AnimationGroup;
    private _closeBookAnim?: AnimationGroup;
    private _state: BookState = BookState.init;
    private _targetPos: Vector3;
    private _util: EBookUtil;


    constructor(scene: Scene, eBook: EBookDetail, position: Vector3,
                util: EBookUtil, shadowGenerator: CascadedShadowGenerator,
                highLightLayer: HighlightLayer) {
        this._scene = scene;
        this._eBook = eBook;
        this._position = position;
        this._shadowGenerator = shadowGenerator;
        this._highLightLayer = highLightLayer;
        this._util = util
        this._eBookNode = new TransformNode(`eBook-${eBook.uuid}`, this._scene)
        this._eBookNode.position = position
        this._targetPos = new Vector3(position.x, position.y + 0.10, position.z)
        this._eBookNode.rotation.x = -Math.PI / 2
        SceneLoader.ImportMesh("", EBook.EBOOK_URL, undefined, this._scene, this._callback)

    }

    private _callback: SceneLoaderSuccessCallback = (meshes, particleSystems, skeletons, animationGroups, transformNodes) => {

        meshes[0].parent = this._eBookNode
        const content = meshes[1] as Mesh;
        const cover = meshes[2] as Mesh;
        //阴影
        this._shadowGenerator.addShadowCaster(content)
        this._shadowGenerator.addShadowCaster(cover)

        //高光
        const playerUiState = usePlayerUiState;
        this._scene.registerBeforeRender(()=>{
            const eBookUUID = playerUiState.currentSubTaskEBookUUID;
            if (eBookUUID && eBookUUID == this._eBook.uuid){
                this._highLightLayer.addMesh(cover,Color3.Green())
            }
            else{
                this._highLightLayer.removeMesh(cover)
            }
        })



        const practiceTableUiState = usePracticeTableUiState;
        //动画
        this._openBookAnim = animationGroups.find(animationGroup => animationGroup.name == "OpenBook")
        //打开书后开始播放回调
        this._openBookAnim?.onAnimationGroupEndObservable.add(() => {
            if (this._state == BookState.camera) {
                practiceTableUiState.setEBookWithDetail(this, this._eBook)
                practiceTableUiState.setEBookReaderShowing(true)
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
        if (this._eBook.textureImgURL != "") {
            const texture = new Texture(this._eBook.textureImgURL, this._scene);
            const material = new StandardMaterial(`eBook-${this._eBook.uuid}-CoverMat`, this._scene);
            material.specularColor = Color3.Black()
            material.diffuseTexture = texture
            cover.material = material
        }


        //设置关键帧动画
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

                this.cameraOutAnim = this._scene.beginDirectAnimation(this._eBookNode, this.createMoveToCamera()
                    , 0, EBook.frameRate * 2, false, undefined, () => {
                        this._state = BookState.camera
                        this.playOpenBook()
                        this.cameraOutAnim?.stop()
                        this._util.playOpenBookSound()
                    })
                this._state = BookState.cameraOut
            }
        }))
    }

    private playOpenBook() {
        //  const practiceTableUiState = usePracticeTableUiState;
        // practiceTableUiState.setEBookReaderShowing(false) //关闭书架的UI 防止视频挡住
        this._openBookAnim?.play(false)
    }

    private playCloseBook() {
        this._closeBookAnim?.play(false)

    }

    public moveToOriginStepOne() { //动画到原始位置
        if (this._state == BookState.camera) {
            this.cameraOutAnim?.stop()
            this.playCloseBook()
        }
    }

    private moveToOriginStepTwo() {
        if (this._state == BookState.camera) {
            this._util.playCloseBookSound()

            this.cameraInAnim = this._scene.beginDirectAnimation(this._eBookNode, this.createMoveIn(), 0, EBook.frameRate * 2, false, undefined, () => {
                this._state = BookState.init
            })

            this._state = BookState.cameraIn
        }
    }

    private hoverOutAnim?: Animatable
    private cameraOutAnim?: Animatable
    private cameraInAnim?: Animatable
    private hoverInAnim?: Animatable

    static frameRate = 60

    private hoverOut() {
        if (this._state == BookState.init || this._state == BookState.ining) { //初始位置 或者正在悬浮进入
            this.hoverInAnim?.stop()

            this.hoverOutAnim = this._scene.beginDirectAnimation(this._eBookNode, this.createHoverOutAnimation(), 0, EBook.frameRate, false, undefined, () => {
                this._state = BookState.done
            })
            this._util.playClickBookSound()
            this._state = BookState.outing //悬浮出来
        }
    }

    private hoverIn() {
        if (this._state == BookState.outing || this._state == BookState.done) { //完成位置 或者正在悬浮出来
            this.hoverOutAnim?.stop()

            this.hoverInAnim = this._scene.beginDirectAnimation(this._eBookNode, this.createHoverInAnimation()
                , 0, EBook.frameRate, false, undefined, () => {
                    this._state = BookState.init
                })

            this._state = BookState.ining //悬浮进入
        }
    }

    private createHoverOutAnimation() {
        let hoverOutAnimation = new Animation("hoverOut", "position", EBook.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames: IAnimationKey[] = []

        keyFrames.push({
            frame: 0,
            value: this._eBookNode.position
        })
        keyFrames.push({
            frame: 40,
            value: this._targetPos
        })
        let easeFunction = new BackEase()
        easeFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
        hoverOutAnimation.setEasingFunction(easeFunction)
        hoverOutAnimation.setKeys(keyFrames)
        return [hoverOutAnimation]
    }

    private createHoverInAnimation() {
        let hoverInAnimation = new Animation("hoverIn", "position", EBook.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames: IAnimationKey[] = []
        keyFrames.push({
            frame: 0,
            value: this._eBookNode.position
        })
        keyFrames.push({
            frame: 40,
            value: this._position
        })
        let easeFunction = new BackEase()
        easeFunction.setEasingMode(EasingFunction.EASINGMODE_EASEIN)
        hoverInAnimation.setEasingFunction(easeFunction)
        hoverInAnimation.setKeys(keyFrames)
        return [hoverInAnimation]
    }

    private createMoveToCamera() {
        const moveAnim = new Animation("moveAnim", "position", EBook.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const moveKeyFrames: IAnimationKey[] = []
        moveKeyFrames.push({
            frame: 0,
            value: this._eBookNode.position
        })

        moveKeyFrames.push({
            frame: 15,
            value: this._targetPos.add(new Vector3(0, 0.35, 0))
        })

        moveKeyFrames.push({
            frame: 60,
            value: this._util.targetCameraPos()
        })

        //120 2秒钟
        moveKeyFrames.push({
            frame: 120,
            value: this._util.targetCameraPos()
        })
        moveAnim.setKeys(moveKeyFrames)

        //Y轴旋转
        const rotateYAnim = new Animation("rotateYAnim", "rotation.y", EBook.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const rotateYkeyFrames: IAnimationKey[] = []
        rotateYkeyFrames.push({
            frame: 0,
            value: this._eBookNode.rotation.y
        })

        rotateYkeyFrames.push({
            frame: 60,
            value: Math.PI / 4
        })

        rotateYAnim.setKeys(rotateYkeyFrames)

        //X轴旋转
        const rotateXAnim = new Animation("rotateXAnim", "rotation.x", EBook.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const rotateXkeyFrames: IAnimationKey[] = []
        rotateXkeyFrames.push({
            frame: 60,
            value: this._eBookNode.rotation.x
        })

        rotateXkeyFrames.push({
            frame: 90,
            value: -Math.PI / 2.5
        })

        rotateXAnim.setKeys(rotateXkeyFrames)


        return [rotateYAnim, moveAnim]
    }

    private createMoveIn() {
        const moveAnim = new Animation("moveAnimReverse", "position", EBook.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const moveKeyFrames: IAnimationKey[] = []

        moveKeyFrames.push({
            frame: 0,
            value: this._eBookNode.position
        })

        moveKeyFrames.push({
            frame: 40,
            value: this._eBookNode.position
        })

        //120 2秒钟
        moveKeyFrames.push({
            frame: 100,
            value: this._targetPos.add(new Vector3(0.0, 0.35, 0))
        })

        moveKeyFrames.push({
            frame: 120,
            value: this._position
        })

        moveAnim.setKeys(moveKeyFrames)


        //X轴旋转
        const rotateXAnim = new Animation("rotateXAnimReverse", "rotation.x", EBook.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const rotateXKeyFrames: IAnimationKey[] = []
        rotateXKeyFrames.push({
            frame: 60,
            value: this._eBookNode.rotation.x
        })


        rotateXKeyFrames.push({
            frame: 90,
            value: -Math.PI / 2

        })
        rotateXAnim.setKeys(rotateXKeyFrames)

        //Y轴旋转
        const rotateYAnim = new Animation("rotateYAnimReverse", "rotation.y", EBook.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const rotateYKeyFrames: IAnimationKey[] = []
        rotateYKeyFrames.push({
            frame: 60,
            value: this._eBookNode.rotation.y
        })

        rotateYKeyFrames.push({
            frame: 100,
            value: 0
        })
        rotateYAnim.setKeys(rotateYKeyFrames)

        return [rotateXAnim, rotateYAnim, moveAnim]
    }

    public dispose(){
        this._eBookNode.dispose(false,true)
    }
}

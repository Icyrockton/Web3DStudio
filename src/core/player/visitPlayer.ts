import {Mesh, Scene, TransformNode, UniversalCamera, Vector3} from "@babylonjs/core";
import {PlayerAnimation, PlayerAssets} from "./player";
import {AnimationGroup} from "@babylonjs/core/Animations/animationGroup";


export class VisitPlayer extends TransformNode {  //游览楼层玩家
    private _animation:PlayerAnimation
    private _cameraRoot!: TransformNode//摄像机根节点
    private _yTilt!: TransformNode
    public camera!: UniversalCamera
    public mesh: Mesh

    constructor(assets: PlayerAssets, scene: Scene) {
        super("visitPlayerRoot", scene);
        this._setUpPlayerCamera()
        this.mesh = assets.collisionBox //碰撞检测盒子
        this._animation={
            idle:assets.animationGroups[0],
            leftTurn:assets.animationGroups[1],
            rightTurn:assets.animationGroups[2],
            run:assets.animationGroups[3],
            walk:assets.animationGroups[4]
        }as PlayerAnimation
        this._setUpAnimation()
    }

    private _setUpPlayerCamera() {
        this._cameraRoot = new TransformNode("playerCameraRoot", this._scene)
        this._cameraRoot.position = new Vector3(0, 0, 0)

        //相机要看着人物的背向
        let backRotate = new TransformNode("backRotate", this._scene);
        backRotate.parent = this._cameraRoot
        backRotate.rotation = new Vector3(0, Math.PI, 0)


        //绕X轴旋转
        this._yTilt = new TransformNode("yTilt");
        this._yTilt.parent = backRotate //设置父级关系
        // this._yTilt.rotation.set(-Math.PI/16,Math.PI/20,0)
        this._yTilt.rotation.set(-Math.PI / 4, 0, 0)

        this.camera = new UniversalCamera("playerCamera", new Vector3(0, 0, 12), this._scene)

        this.camera.lockedTarget = this._cameraRoot.position
        this.camera.parent = this._yTilt
        //this._scene.activeCamera = this.camera
    }


    private _currentAnimation!:AnimationGroup
    private _prevAnimation!:AnimationGroup

    private _setUpAnimation() {
        this._scene.stopAllAnimations()
        //循环动画
        this._animation.run.loopAnimation=true
        this._animation.idle.loopAnimation=true
        this._animation.walk.loopAnimation=true
        this._currentAnimation=this._animation.idle
        this._prevAnimation=this._animation.idle
    }
}

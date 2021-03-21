import {Mesh, Scene, TransformNode, UniversalCamera, Vector3} from "@babylonjs/core";
import {PlayerAnimation, PlayerAssets} from "./player";
import {AnimationGroup} from "@babylonjs/core/Animations/animationGroup";
import {PlayerManager} from "./playerManager";


export class VisitPlayer extends TransformNode {  //游览楼层玩家
    private _animation:PlayerAnimation
    private _cameraRoot!: TransformNode//摄像机根节点
    public camera!: UniversalCamera
    public mesh: Mesh
    public cameraRotate!: TransformNode;

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
        this._scene.registerBeforeRender(() => {
            this._playerUpdate()
        })
    }

    public reset() {
        this.cameraRotate.rotation = new Vector3(-Math.PI / 16, Math.PI, 0)
        this.camera.position.set(0,0,9)
    }

    private _setUpPlayerCamera() {
        this._cameraRoot = new TransformNode("playerCameraRoot", this._scene)
        this._cameraRoot.position = new Vector3(0, 0, 0)

        //相机要看着人物的背向
        let cameraRotate = new TransformNode("cameraRotate", this._scene);
        cameraRotate.parent = this._cameraRoot
        cameraRotate.rotation = new Vector3(-Math.PI / 16, Math.PI, 0)
        this.cameraRotate= cameraRotate


        this.camera = new UniversalCamera("playerCamera", new Vector3(0, 0, 9), this._scene)

        this.camera.lockedTarget = this._cameraRoot.position
        this.camera.parent =  cameraRotate
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

    public startWalkAnim(){
        this._animation.run.stop()
        this._animation.idle.stop()
        this._animation.walk.start(true)
    }

    public startIdleAnim(){
        this._animation.run.stop()
        this._animation.walk.stop()
        this._animation.idle.start(true)
    }
    public startRunAnim(){
        this._animation.walk.stop()
        this._animation.idle.stop()
        this._animation.run.start(true)
    }

    public startLeftTurnAnim(){
        this._animation.walk.stop()
        this._animation.idle.stop()
        this._animation.run.stop()
        this._animation.leftTurn.play(false)

    }

    public startRightTurnAnim(){
        this._animation.walk.stop()
        this._animation.idle.stop()
        this._animation.run.stop()
        this._animation.rightTurn.play(false)

    }

    insertArrow(_upArrow: Mesh, _downArrow: Mesh, _leftArrow: Mesh, _rightArrow: Mesh,
                _leftReturnArrow: Mesh, _rightReturnArrow: Mesh) {
        _upArrow.position.set(0,0,0)
        _downArrow.position.set(0,0,0)
        _leftArrow.position.set(0,0,0)
        _rightArrow.position.set(0,0,0)
        _leftReturnArrow.position.set(0,0,0)
        _rightReturnArrow.position.set(0,0,0)
        //设置父级关系
        _upArrow.parent =this.mesh
        _downArrow.parent =this.mesh
        _leftArrow.parent =this.mesh
        _rightArrow.parent =this.mesh
        _leftReturnArrow.parent =this.mesh
        _rightReturnArrow.parent =this.mesh
        //设置相对位置
        _upArrow.position.set(-0.5,0.3,1)
        _downArrow.position.set(-0.5,0.1,-1)
        _leftArrow.position.set(-1,0.1,1)
        _rightArrow.position.set(1,0.1,1)
        _leftReturnArrow.position.set(-1,0.1,1)
        _rightReturnArrow.position.set(1,0.1,1)
        //设置透明度
        _upArrow.visibility = 0.4
        _downArrow.visibility = 0.4
        _leftArrow.visibility = 0.4
        _rightArrow.visibility = 0.4
        _leftReturnArrow.visibility = 0.4
        _rightReturnArrow.visibility = 0.4
        //开启深度测试
        this.openDepthPrePass(_upArrow)
        this.openDepthPrePass(_downArrow)
        this.openDepthPrePass(_leftArrow)
        this.openDepthPrePass(_rightArrow)
        this.openDepthPrePass(_leftReturnArrow)
        this.openDepthPrePass(_rightReturnArrow)
    }

    private openDepthPrePass(mesh:Mesh){
        if (mesh.material){
            mesh.material.needDepthPrePass = true
        }
    }

    private _playerUpdate() {
        this._updateCamera()//更新相机

    }
    private _updateCamera() {
        //player的y轴方向的中心位置
        //let centerPlayer = this.mesh.position.y + PlayerManager.CollisionBoxHeight / 2
        // let centerPlayer = this.mesh.position.y + PlayerManager.CollisionBoxHeight
        let centerPlayer = this.mesh.position.y + PlayerManager.CollisionBoxHeight
        //平滑移动相机 相机的最终目标是玩家Mesh的位置
        this._cameraRoot.position = Vector3.Lerp(this._cameraRoot.position, new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.2)
    }


}

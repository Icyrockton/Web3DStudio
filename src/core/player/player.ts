import {
    AbstractMesh,
    Axis,
    Mesh,
    Quaternion,
    Ray,
    Scene,
    TransformNode,
    UniversalCamera,
    Vector3
} from "@babylonjs/core";
import {ISceneLoaderAsyncResult} from "@babylonjs/core/Loading/sceneLoader";
import {AnimationGroup} from "@babylonjs/core/Animations/animationGroup";
import {CollegeManager} from "../college/collegeManager";
import {InputController} from "./inputController";


export interface PlayerAssets {
    readonly collisionBox: Mesh //碰撞盒子
    readonly animationGroups: AnimationGroup[] //动画集合
}

export interface PlayerAnimation {
    idle:AnimationGroup
    walk:AnimationGroup
    run:AnimationGroup
    leftTurn:AnimationGroup
    rightTurn:AnimationGroup
}

export class Player extends TransformNode {

    static PLAYER_GRAVITY = 0.1
    static PLAYER_GRAVITY_MAX = 0.8
    static PLAYER_SPEED = 0.008//玩家速度
    private _cameraRoot!: TransformNode//摄像机根节点
    private _yTilt!: TransformNode
    public camera!: UniversalCamera
    public mesh: Mesh
    private _inputController: InputController;
    private _h: number = 0
    private _v: number = 0
    private _moveDirection = new Vector3(0, 0, 0)
    private _gravity: Vector3 = new Vector3(0, 0, 0)
    private _grounded: boolean = true
    private _animation:PlayerAnimation

    constructor(assets: PlayerAssets, scene: Scene, controller: InputController) {
        super("playerRoot", scene);
        this._inputController = controller;
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
        this._yTilt.rotation.set(-Math.PI / 16, 0, 0)

        this.camera = new UniversalCamera("playerCamera", new Vector3(0, 0, 8), this._scene)
        this.camera.lockedTarget = this._cameraRoot.position
        this.camera.parent = this._yTilt
        this._scene.activeCamera = this.camera


    }

    private _updateCamera() {
        //player的y轴方向的中心位置
        let centerPlayer = this.mesh.position.y + CollegeManager.CollisionBoxHeight / 2
        //平滑移动相机 相机的最终目标是玩家Mesh的位置
        this._cameraRoot.position = Vector3.Lerp(this._cameraRoot.position, new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.2)
    }

    //从InputController中更新按键响应信息
    private _updateFromInputController() {
        this._moveDirection = Vector3.Zero()
        //水平X轴
        this._h = this._inputController.horizontal
        //垂直Z轴
        this._v = this._inputController.vertical


        let forward = this._cameraRoot.forward;
        let right = this._cameraRoot.right;
        let correctedVertical = forward.scaleInPlace(this._v);
        let correctedHorizontal = right.scaleInPlace(this._h);

        let move = correctedVertical.addInPlace(correctedHorizontal).normalize() //水平+垂直 得到移动的向量 再归一化

        //冲刺 跑步
        if (this._inputController.dashing && this._canDash ) {
            this._dashStart = true
            this._canDash = false
        }

        let dashFactor = 1
        if (this._dashStart) {
            console.log('跑步')
            if (this._dashTime > Player.PLAYER_DASH_TIME) {
                this._dashTime = 0
                this._canDash = true
                this._dashStart = false
            } else
                dashFactor = Player.PLAYER_DASH_FACTOR
            this._dashTime ++
        }


        this._moveDirection = new Vector3(move.x , 0, move.z) //设置移动方向向量
        this._moveDirection = this._moveDirection.scaleInPlace(Player.PLAYER_SPEED * dashFactor) //玩家速度


        //计算旋转
        let input = new Vector3(this._inputController.horizontalAxis, 0, this._inputController.verticalAxis);
        if (input.length() == 0)
            return

        let angle = Math.atan2(this._inputController.horizontalAxis, this._inputController.verticalAxis);


        angle += this._cameraRoot.rotation.y //加上原来
        let quaternionTarget = Quaternion.FromEulerAngles(0, angle, 0)
        //角色旋转
        this.mesh.rotationQuaternion = Quaternion.Slerp(this.mesh.rotationQuaternion!, quaternionTarget, 0.075)


    }

    private _playerUpdate() {
        this._updateFromInputController()//更新控制
        this._updateCamera()//更新相机
        this._updateGroundDetection()//检测地面
        this._updatePlayerAnimation()//更新动画
        //更新人物模型的Mesh移动
        this.mesh.moveWithCollisions(this._moveDirection)
    }

    private _rayCastToGround(offsetX: number, offsetZ: number, rayCastLength: number): Vector3 { //检查是否与地面碰撞  空中 or 地上
        let rayCastOrigin = new Vector3(this.mesh.position.x + offsetX, this.mesh.position.y + CollegeManager.CollisionBoxHeight / 2, this.mesh.position.z + offsetZ);
        let ray = new Ray(rayCastOrigin, Vector3.Down(), rayCastLength)
        //从player的中心 向下发出射线 检查是否在空中
        let predicate = (mesh: AbstractMesh) => {
            return mesh.isPickable && mesh.isEnabled()
        }
        let pickInfo = this._scene.pickWithRay(ray, predicate);

        if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
            return pickInfo.pickedPoint;
        } else {
            return Vector3.Zero()
        }
    }

    private _isGrounded(): boolean { //是否在地面上
        if (this._rayCastToGround(0, 0, CollegeManager.CollisionBoxHeight / 2 + 0.1).equals(Vector3.Zero())) {
            return false;
        } else {
            return true;
        }

    }

    private _updateGroundDetection() { //检测是否在地面上 如果没在地面上 施加重力
        const deltaTime = this._scene.getEngine().getDeltaTime() / 1000;
        let isGrounded = this._isGrounded();
        if (!isGrounded) {
            //重力添加
            this._gravity = this._gravity.addInPlace(Vector3.Down().scale(Player.PLAYER_GRAVITY * deltaTime));
            this._grounded = false;
        }
        if (this._gravity.y < -Player.PLAYER_GRAVITY_MAX) { //最大的重力速度
            this._gravity.y = -Player.PLAYER_GRAVITY_MAX
        }



        if (isGrounded) {
            this._gravity.y = 0;
            this._grounded = true;
            this._canJump = true
        }

        if (this._inputController.jump && this._canJump) {
            this._gravity.y = Player.PLAYER_GRAVITY_MAX * deltaTime * 6  //向上的重力速度
            this._canJump = false
        }


        this.mesh.moveWithCollisions(this._moveDirection.addInPlace(this._gravity)); //重力移动

    }

    static PLAYER_DASH_FACTOR = 2
    static PLAYER_DASH_TIME = 10
    private _dashTime: number = 0
    private _dashStart: boolean = false
    private _canJump: boolean = true //空中不能跳跃了 只有在地上时 此值为true
    private _canDash: boolean = true //只能冲刺一次


    private _currentAnimation!:AnimationGroup
    private _prevAnimation!:AnimationGroup

    private _setUpAnimation() { //设置动画
        this._scene.stopAllAnimations()
        //循环动画
        this._animation.run.loopAnimation=true
        this._animation.idle.loopAnimation=true
        this._animation.walk.loopAnimation=true
        this._currentAnimation=this._animation.idle
        this._prevAnimation=this._animation.idle
    }

    private _updatePlayerAnimation(){ //更新玩家动画
        if(this._inputController.idle){
            this._currentAnimation=this._animation.idle
        }else  if(this._inputController.walk){
            this._currentAnimation=this._animation.walk

        }else if(this._inputController.dashing){
            this._currentAnimation=this._animation.run

        }else{
            this._currentAnimation=this._animation.idle
        }

        if (this._currentAnimation!==this._prevAnimation){
            console.log('播放动画')
            this._prevAnimation.stop()
            this._currentAnimation.play(this._currentAnimation.loopAnimation)
            this._prevAnimation=this._currentAnimation
        }
    }
}
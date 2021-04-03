import {
    AbstractMesh, Animation,
    Axis, BackEase, Color3, EasingFunction, IAnimationKey,
    Mesh, MeshBuilder,
    Quaternion,
    Ray, Scalar,
    Scene, ShadowGenerator, StandardMaterial, Texture,
    TransformNode,
    UniversalCamera,
    Vector3, Viewport
} from "@babylonjs/core";
import {ISceneLoaderAsyncResult} from "@babylonjs/core/Loading/sceneLoader";
import {AnimationGroup} from "@babylonjs/core/Animations/animationGroup";
import {CollegeManager} from "../college/collegeManager";
import {InputController} from "./inputController";
import {PlayerManager} from "./playerManager";
import {MINI_MAP_LAYER_MASK} from "../studio/miniMap";
import useAchievementUiState from "../../components/GUI/achievement/achievementUiState";
import useNavUiState from "../../components/GUI/nav/navUiState";


export interface PlayerAssets {
    readonly collisionBox: Mesh //碰撞盒子
    readonly animationGroups: AnimationGroup[] //动画集合
    readonly avatarMiniMapURL: string //小地图
}

export interface PlayerAnimation {
    idle: AnimationGroup
    walk: AnimationGroup
    run: AnimationGroup
    leftTurn: AnimationGroup
    rightTurn: AnimationGroup
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
    private _animation: PlayerAnimation
    private _assets: PlayerAssets;

    constructor(assets: PlayerAssets, scene: Scene, controller: InputController) {
        super("playerRoot", scene);
        this._assets = assets
        this._inputController = controller;
        this._setUpPlayerCamera()
        this.mesh = assets.collisionBox //碰撞检测盒子
        this._setUpMiniMap()

        this._animation = {
            idle: assets.animationGroups[0],
            leftTurn: assets.animationGroups[1],
            rightTurn: assets.animationGroups[2],
            run: assets.animationGroups[3],
            walk: assets.animationGroups[4]
        } as PlayerAnimation
        this._setUpAnimation()
        this._scene.registerBeforeRender(() => {
            this._playerUpdate()
        })
        useAchievementUiState.player = this //注入player
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
        this.camera.viewport = new Viewport(0, 0, 1, 1)
        this._scene.activeCameras?.push(this.camera)
    }

    private _updateCamera() {
        //player的y轴方向的中心位置
        let centerPlayer = this.mesh.position.y + PlayerManager.CollisionBoxHeight / 2
        //平滑移动相机 相机的最终目标是玩家Mesh的位置
        this._cameraRoot.position = Vector3.Lerp(this._cameraRoot.position, new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.2)
    }

    //从InputController中更新按键响应信息
    private _updateFromInputController() {
        if (this._acceptInput){
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
            if (this._inputController.dashing && this._canDash) {
                this._dashStart = true
                this._canDash = false
            }

            let dashFactor = 1
            if (this._dashStart) {
                if (this._dashTime > Player.PLAYER_DASH_TIME) {
                    this._dashTime = 0
                    this._canDash = true
                    this._dashStart = false
                } else
                    dashFactor = Player.PLAYER_DASH_FACTOR
                this._dashTime++
            }


            this._moveDirection = new Vector3(move.x, 0, move.z) //设置移动方向向量
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
        let rayCastOrigin = new Vector3(this.mesh.position.x + offsetX, this.mesh.position.y + PlayerManager.CollisionBoxHeight / 2, this.mesh.position.z + offsetZ);
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
        if (this._rayCastToGround(0, 0, PlayerManager.CollisionBoxHeight / 2 + 0.1).equals(Vector3.Zero())) {
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


    private _currentAnimation!: AnimationGroup
    private _prevAnimation!: AnimationGroup

    private _setUpAnimation() { //设置动画
        this._scene.stopAllAnimations()
        //循环动画
        this._animation.run.loopAnimation = true
        this._animation.idle.loopAnimation = true
        this._animation.walk.loopAnimation = true
        this._currentAnimation = this._animation.idle
        this._prevAnimation = this._animation.idle
    }

    private _updatePlayerAnimation() { //更新玩家动画
        if (this._acceptInput){
            if (this._inputController.idle) {
                this._currentAnimation = this._animation.idle
            } else if (this._inputController.walk) {
                this._currentAnimation = this._animation.walk

            } else if (this._inputController.dashing) {
                this._currentAnimation = this._animation.run

            } else {
                this._currentAnimation = this._animation.idle
            }
        }
        else{
            this._currentAnimation = this._animation.idle
        }

        if (this._currentAnimation !== this._prevAnimation) {
            console.log('播放动画')
            this._prevAnimation.stop()
            this._currentAnimation.play(this._currentAnimation.loopAnimation)
            this._prevAnimation = this._currentAnimation
        }
    }

    public rotateCameraAroundYAxis(target: number) { //目标角度
        this._scene.registerBeforeRender(() => {
            this._cameraRoot.rotation.y = Scalar.Lerp(this._cameraRoot.rotation.y, target, 0.01)
        })
    }

    private _miniMapMesh?: Mesh

    private _setUpMiniMap() {
        //小地图

        const miniMap = MeshBuilder.CreateGround(`playerMiniMap`, {width: 2, height: 2});
        miniMap.billboardMode = AbstractMesh.BILLBOARDMODE_Z
        miniMap.isPickable = false
        const material = new StandardMaterial("player-miniMap-Mat", this._scene);
        const avatarTexture = new Texture(this._assets.avatarMiniMapURL, this._scene);
        avatarTexture.hasAlpha = true
        avatarTexture.uAng = Math.PI
        material.specularColor = Color3.Black()
        material.emissiveColor = Color3.White() //自发光 亮一些
        material.diffuseTexture = avatarTexture
        miniMap.material = material
        miniMap.parent = this.mesh
        miniMap.layerMask = MINI_MAP_LAYER_MASK
        this._miniMapMesh = miniMap

    }

    public setUpShadow(_shadowGenerator: ShadowGenerator) {
        const meshes = this.mesh.getChildMeshes();
        meshes.forEach(mesh => {
            if (mesh == this._miniMapMesh)
                return
            _shadowGenerator.addShadowCaster(mesh)
        })
    }

    private _isInAchievement: boolean = false //是否在成就状态?
    private _isCameraClose: boolean = false //镜头是否靠近player?

    achievementCamera() {
        if (!this._isInAchievement) {
            this._acceptInput =false
            this._scene.beginDirectAnimation(this._yTilt, this.createYTiltAnim(false), 0, Player.frame_rate, false, 1, () => {
            })
            this._scene.beginDirectAnimation(this.camera, this.createAchievementCameraAnim(false), 0, Player.frame_rate, false, 1, () => {
                this._isInAchievement = true
            })
            this._scene.beginDirectAnimation(this.mesh, this.createPlayerTowardCamera(false), 0, Player.frame_rate, false, 1, () => {
            })
        } else {

            this._scene.beginDirectAnimation(this._yTilt, this.createYTiltAnim(true), 0, Player.frame_rate, false, 1, () => {
            })
            this._scene.beginDirectAnimation(this.camera, this.createAchievementCameraAnim(true), 0, Player.frame_rate, false, 1, () => {
                this._isInAchievement = false
                this._acceptInput =true
            })
            this._scene.beginDirectAnimation(this.mesh, this.createPlayerTowardCamera(true), 0, Player.frame_rate, false, 1, () => {
            })
        }
    }

    static CAMERA_DISTANCE_FAR = 12
    static CAMERA_DISTANCE_NEAR = 5
    static CAMERA_FAR_Y_TILT=-Math.PI / 4
    static CAMERA_NEAR_Y_TILT=-Math.PI / 9

    private _cameraFar:boolean =true
    private _cameraPositionZ = Player.CAMERA_DISTANCE_FAR
    private _cameraYTilt  = Player.CAMERA_FAR_Y_TILT
    private _acceptInput: boolean = true

    private createAchievementCameraAnim(backToOrigin: boolean = false) {
        //backToOrigin 回到原始位置
        //镜头距离
        const distanceAnimation = new Animation("distanceAnimation", "position.z", Player.frame_rate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const distanceKeyFrames: IAnimationKey [] = []
        distanceKeyFrames.push({
            frame: 0,
            value: this.camera.position.z
        })
        distanceKeyFrames.push({
            frame: Player.frame_rate,
            value: backToOrigin ? this._cameraPositionZ : 2.7
        })
        distanceAnimation.setKeys(distanceKeyFrames)

        const backEase = new BackEase(0.1);
        backEase.setEasingMode(EasingFunction.EASINGMODE_EASEIN)
        distanceAnimation.setEasingFunction(backEase)

        return [distanceAnimation]
    }

    private createYTiltAnim(backToOrigin: boolean = false) {
        //俯仰角
        const yTiltRotateAnimation = new Animation("yTiltRotateAnimation", "rotation.x", Player.frame_rate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const yTiltRotateKeyFrames: IAnimationKey [] = []
        yTiltRotateKeyFrames.push({
            frame: 0,
            value: this._yTilt.rotation.x
        })
        yTiltRotateKeyFrames.push({
            frame: Player.frame_rate,
            value: backToOrigin ? this._cameraYTilt : -Math.PI / 16
        })
        yTiltRotateAnimation.setKeys(yTiltRotateKeyFrames)

        //位置 向人的左边靠
        const yTiltPositionAnimation = new Animation("yTiltPositionAnimation", "position.x", Player.frame_rate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const yTiltPositionKeyFrames: IAnimationKey [] = []
        yTiltPositionKeyFrames.push({
            frame: 0,
            value: this._yTilt.position.x
        })
        yTiltPositionKeyFrames.push({
            frame: Player.frame_rate,
            value: backToOrigin ? 0 : 1.25
        })
        yTiltPositionAnimation.setKeys(yTiltPositionKeyFrames)


        return [yTiltRotateAnimation, yTiltPositionAnimation]
    }

    private _prevRotation:Quaternion=Quaternion.FromEulerAngles(0,0,0)
    private createPlayerTowardCamera(backToOrigin: boolean = false){
        const playerRotateAnimation = new Animation("playerRotateAnimation", "rotationQuaternion", Player.frame_rate, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const playerRotateKeyFrames: IAnimationKey [] = []
        if (!backToOrigin){ //保存之前的旋转
            this._prevRotation = this.mesh.rotationQuaternion!
        }
        playerRotateKeyFrames.push({
            frame: 0,
            value: this.mesh.rotationQuaternion
        })

        const target= Quaternion.FromEulerAngles(this._cameraRoot.rotation.x,this._cameraRoot.rotation.y + Math.PI,this._cameraRoot.rotation.z)

        playerRotateKeyFrames.push({
            frame: Player.frame_rate,
            value: backToOrigin ? this._prevRotation: target
        })
        playerRotateAnimation.setKeys(playerRotateKeyFrames)

        return [playerRotateAnimation]
    }
    static readonly frame_rate = 60

    cameraFarOrNear() {
        this._scene.beginDirectAnimation(this.camera,this.createCameraFarOrNearAnim(),0,Player.frame_rate,false,1,()=>{
            this._cameraFar  = !this._cameraFar
            this._cameraPositionZ = this._cameraFar ? Player.CAMERA_DISTANCE_FAR : Player.CAMERA_DISTANCE_NEAR
            this._cameraYTilt = this._cameraFar ? Player.CAMERA_FAR_Y_TILT : Player.CAMERA_NEAR_Y_TILT
        })
        this._scene.beginDirectAnimation(this._yTilt,this.createCameraFarOrNearYTiltAnim(),0,Player.frame_rate,false,1,()=>{

        })
    }


    private createCameraFarOrNearAnim(){
        //镜头距离
        const distanceAnimation = new Animation("distanceAnimation", "position.z", Player.frame_rate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const distanceKeyFrames: IAnimationKey [] = []
        distanceKeyFrames.push({
            frame: 0,
            value: this.camera.position.z
        })
        distanceKeyFrames.push({
            frame: Player.frame_rate,
            value: this._cameraFar ? Player.CAMERA_DISTANCE_NEAR : Player.CAMERA_DISTANCE_FAR
        })
        distanceAnimation.setKeys(distanceKeyFrames)


        return [distanceAnimation]
    }

    private createCameraFarOrNearYTiltAnim(){
        //俯仰角
        const yTiltRotateAnimation = new Animation("yTiltRotateAnimation", "rotation.x", Player.frame_rate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const yTiltRotateKeyFrames: IAnimationKey [] = []
        yTiltRotateKeyFrames.push({
            frame: 0,
            value: this._yTilt.rotation.x
        })
        yTiltRotateKeyFrames.push({
            frame: Player.frame_rate,
            value: this._cameraFar ?  Player.CAMERA_NEAR_Y_TILT : Player.CAMERA_FAR_Y_TILT
        })
        yTiltRotateAnimation.setKeys(yTiltRotateKeyFrames)
        return [yTiltRotateAnimation]
    }
}

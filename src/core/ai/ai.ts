import {
     Color3,
    ICrowd,
    Matrix, Mesh,
    MeshBuilder,
    Quaternion,
    RecastJSPlugin,
    Scene,
    SceneLoader, setAndStartTimer, ShadowGenerator, Sound, Sprite, SpriteManager, StandardMaterial, Texture,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {StudioAI, StudioAIDialog} from "../studio/Studio";
import {IAgentParameters} from "@babylonjs/core/Navigation/INavigationEngine";
import {AbstractMesh} from "@babylonjs/core/Meshes/abstractMesh";
import {IParticleSystem} from "@babylonjs/core/Particles/IParticleSystem";
import {Skeleton} from "@babylonjs/core/Bones/skeleton";
import {AnimationGroup} from "@babylonjs/core/Animations/animationGroup";
import {Geometry} from "@babylonjs/core/Meshes/geometry";
import {Light} from "@babylonjs/core/Lights/light";
import {PlayerManager} from "../player/playerManager";
import useAiUiState from "../../components/GUI/ai/aiUiState";
import aiUiState from "../../components/GUI/ai/aiUiState";
import {MINI_MAP_LAYER_MASK} from "../studio/miniMap";

interface PathDetail {
    desPos: Vector3, // 要走到的点的位置
    residenceTime: number //在该点的滞留时间

}

enum AIState {
    wait,
    waitFinished, //等待结束 开始进入moving
    moving, // moving完毕后 查看是否需要wait
    closeToPlayer //靠近玩家
}

export class Ai {


    private _aiInfo: StudioAI;
    private _scene: Scene;
    private _path: PathDetail[] = []
    private _aiIndex: number;
    private _aiCrowd: ICrowd;
    private _navigationPlugin: RecastJSPlugin;
    private _aiTransformNode: TransformNode
    private idleAnimation!: AnimationGroup;
    private walkAnimation!: AnimationGroup;
    private leftTurnAnimation!: AnimationGroup;
    private rightTurnAnimation!: AnimationGroup;
    private _playerManager?: PlayerManager;
    private _infoSound: Sound[] = []
    private _miniMapMesh? : Mesh

    constructor(scene: Scene, aiInfo: StudioAI, crowd: ICrowd, navigationPlugin: RecastJSPlugin) {
        this._scene = scene;
        this._aiInfo = aiInfo;  //AI路径信息
        this._navigationPlugin = navigationPlugin;
        this._aiCrowd = crowd;

        this.findPath() //查找结点

        const aiParameter: IAgentParameters = {
            radius: 0.2,
            height: 0.2,
            maxAcceleration: 1.0,
            maxSpeed: 0.4,
            collisionQueryRange: 0.5,
            pathOptimizationRange: 0.0,
            separationWeight: 1.0
        }
        //将第一个结点作为起始位置
        let startPos = this._path[0].desPos
        this._aiTransformNode = new TransformNode(`AI-${this._aiInfo.name}`, this._scene)
        this._aiIndex = crowd.addAgent(startPos, aiParameter, this._aiTransformNode) //AI的索引号
        this.setUpSound()

        SceneLoader.ImportMesh("", this._aiInfo.modelURL, undefined, this._scene, this.modelLoaded)
    }

    private _collisionBox? : Mesh
    private modelLoaded = (meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], animationGroups: AnimationGroup[], ) => {
        //设置父级关系
        const root = meshes[0];

        //创建碰撞盒子
        let collisionBox = MeshBuilder.CreateBox(`AI-${this._aiInfo.name}-CollisionBox`, {
            width: PlayerManager.PlayerCollisionBoxWidth,
            height: PlayerManager.PlayerCollisionBoxHeight,
            depth: PlayerManager.PlayerCollisionBoxDepth
        },this._scene);
        collisionBox.bakeTransformIntoVertices(Matrix.Translation(0, PlayerManager.PlayerCollisionBoxHeight / 2, 0))
        collisionBox.isVisible = false //不可见
        collisionBox.isPickable = false //不可拾取
        collisionBox.checkCollisions = true //检查碰撞
        //碰撞的椭球体
        //https://doc.babylonjs.com/divingDeeper/cameras/camera_collisions
        collisionBox.ellipsoid = new Vector3(PlayerManager.PlayerCollisionBoxWidth / 2, PlayerManager.PlayerCollisionBoxHeight / 2, PlayerManager.PlayerCollisionBoxDepth / 2)
        //现在玩家的原点位于(0,0,0)的位置 原始的碰撞椭球体的中心与玩家的原点重合 我们需要将碰撞椭球体沿y轴向上移动 移动到玩家的中心
        collisionBox.ellipsoidOffset = new Vector3(0, PlayerManager.PlayerCollisionBoxHeight / 2, 0)

        collisionBox.rotationQuaternion = new Quaternion(0, 0, 0, 0)

        ////////////////设置父级关系
        root.parent = collisionBox
        collisionBox.parent = this._aiTransformNode
        this._collisionBox = collisionBox
        ////////////////

        this.setUpMiniMap()


        //动画
        this.idleAnimation = animationGroups.find(animationGroup => animationGroup.name == this._aiInfo.idleAnimationGroupName)!
        this.idleAnimation.loopAnimation = true
        this.idleAnimation.stop()
        this.walkAnimation = animationGroups.find(animationGroup => animationGroup.name == this._aiInfo.walkAnimationGroupName)!
        this.walkAnimation.loopAnimation = true
        this.walkAnimation.stop()

        this.leftTurnAnimation = animationGroups.find(animationGroup => animationGroup.name == this._aiInfo.leftTurnAnimationGroupName)!
        this.leftTurnAnimation.loopAnimation = false
        this.leftTurnAnimation.stop()
        this.rightTurnAnimation = animationGroups.find(animationGroup => animationGroup.name == this._aiInfo.rightTurnAnimationGroupName)!
        this.rightTurnAnimation.loopAnimation = false
        this.rightTurnAnimation.stop()
        this.idleAnimation.play()
        this.setUpPath()
        this.setUpEllipsisHint()
    }

    private _currentIndex = 0 //当前所在的点
    private _state: AIState = AIState.waitFinished //初始的AI的状态
    private _prevState: AIState = AIState.wait

    setUpPath() {

        this._scene.registerBeforeRender(() => {
            if (!this._encounterPlayer) {
                //旋转AI
                let velocity = this._aiCrowd.getAgentVelocity(this._aiIndex) //获取AI的速度
                if (velocity.length() > 0.4) {
                    let desiredRotation = Math.atan2(velocity.x, velocity.z);
                    //防止转360°
                    if (Math.abs(desiredRotation - this._aiTransformNode.rotation.y) >= Math.PI) {
                        if (desiredRotation > this._aiTransformNode.rotation.y) {
                            this._aiTransformNode.rotation.y = this._aiTransformNode.rotation.y + (Math.PI * 2 + this._aiTransformNode.rotation.y - desiredRotation) * 0.025
                        } else {
                            this._aiTransformNode.rotation.y = this._aiTransformNode.rotation.y + (Math.PI * 2 + desiredRotation - this._aiTransformNode.rotation.y) * 0.025
                        }
                    } else {

                        this._aiTransformNode.rotation.y = this._aiTransformNode.rotation.y + (desiredRotation - this._aiTransformNode.rotation.y) * 0.025
                    }

                }

                if (this._state == AIState.wait) { //等待 什么也不干

                } else if (this._state == AIState.waitFinished) { //等待结束 进入moving状态
                    let nextIndex = (this._currentIndex + 1) % this._path.length //需要走到的下一个点
                    const nextPath = this._path[nextIndex];
                    this._aiCrowd.agentGoto(this._aiIndex, nextPath.desPos)
                    this._state = AIState.moving
                    this.idleAnimation.stop()
                    this.walkAnimation.play(true)
                } else if (this._state == AIState.moving) { //移动中
                    let nextIndex = (this._currentIndex + 1) % this._path.length //需要走到的下一个点
                    const nextPath = this._path[nextIndex];
                    const aiCurrentPos = this._aiCrowd.getAgentPosition(this._aiIndex);//AI当前的位置
                    if (aiCurrentPos.subtract(nextPath.desPos).length() < 0.05) { //接近终点了
                        this._state = AIState.wait
                        //动画
                        this.walkAnimation.stop()
                        this.idleAnimation.play(true)
                        this._currentIndex++ //下一条路径
                        //开启定时器等待
                        setAndStartTimer({
                            timeout: nextPath.residenceTime, //停留时间
                            contextObservable: this._scene.onBeforeRenderObservable,
                            onEnded: () => {
                                this._state = AIState.waitFinished
                            }
                        })
                    }
                }
            } else {
                if (this._playerManager) {
                    const currentPos = this._aiCrowd.getAgentPosition(this._aiIndex);
                    this._aiCrowd.agentGoto(this._aiIndex, currentPos)
                    //动画
                    this.walkAnimation.stop()
                    this.idleAnimation.play()

                    const dis = this._aiTransformNode.position.subtract(this._playerManager.playerPosition).normalize().scale(-1);
                    let desiredRotation = Math.atan2(dis.x, dis.z);
                    //防止转360°
                    if (Math.abs(desiredRotation - this._aiTransformNode.rotation.y) >= Math.PI) {
                        if (desiredRotation > this._aiTransformNode.rotation.y) {
                            this._aiTransformNode.rotation.y = this._aiTransformNode.rotation.y + (Math.PI * 2 + this._aiTransformNode.rotation.y - desiredRotation) * 0.025
                        } else {
                            this._aiTransformNode.rotation.y = this._aiTransformNode.rotation.y + (Math.PI * 2 + desiredRotation - this._aiTransformNode.rotation.y) * 0.025
                        }
                    } else {
                        this._aiTransformNode.rotation.y = this._aiTransformNode.rotation.y + (desiredRotation - this._aiTransformNode.rotation.y) * 0.025
                    }


                }
            }


        })
    }

    private findPath() {        //查找结点
        this._aiInfo.path.forEach(path => {
            const blenderNode = this._scene.getTransformNodeByName(path.nodeName);
            if (blenderNode) {
                //转换坐标系  x 乘以 -1
                let pos = this._navigationPlugin.getClosestPoint(new Vector3(blenderNode.position.x * -1, blenderNode.position.y, blenderNode.position.z))
                pos = this._navigationPlugin.getClosestPoint(pos) //找到最近点
                this._path.push({
                    desPos: pos,
                    residenceTime: path.residenceTime
                })
            }
        })
    }

    private _encounterPlayer: boolean = false


    private _trigger: boolean = false

    setUpWithPlayer(playerManager: PlayerManager) {
        this._playerManager = playerManager
        //设置玩家与AI的对话场景
        this._scene.registerBeforeRender(() => {
            //和玩家的距离
            const distance = playerManager.playerPosition.subtract(this._aiTransformNode.position).length();
            if (distance < 1.5) {
                if (!this._trigger) {
                    if (!playerManager.busy && !this.checkIfSoundPlaying()) {  //如果玩家不忙碌
                        this.showEllipsisHint()
                        playerManager.currentAIName = this._aiInfo.name
                        playerManager.busy = true
                        this.randomDialog()
                        this._prevState = this._state
                        this._encounterPlayer = true
                        this._trigger = true
                    }
                }
            } else {
                if (this._encounterPlayer) {
                    if (playerManager.currentAIName = this._aiInfo.name){
                        playerManager.busy = false
                    }
                    this.hideHintSprite()
                    //this.stopAllSound()
                    this._state = this._prevState
                    if (this._state == AIState.moving || this._state == AIState.wait) { //继续之前没走的路
                        let nextIndex = (this._currentIndex + 1) % this._path.length //需要走到的下一个点
                        const nextPath = this._path[nextIndex];
                        this._aiCrowd.agentGoto(this._aiIndex, nextPath.desPos)
                        this._state = AIState.moving
                        this.idleAnimation.stop()
                        this.walkAnimation.play(true)
                    }
                    aiUiState.setDialogShowing(false)

                }
                this._encounterPlayer = false
                this._trigger = false
            }

        })
    }

    private randomDialog() {  //随机生成对话
        const index = Math.floor(Math.random() * this._aiInfo.info.length)
        let dialogInfo = {
            avatarURL: this._aiInfo.avatarURL,
            info: this._aiInfo.info[index],
            position: this._aiInfo.position,
            title: this._aiInfo.title
        } as StudioAIDialog
        const aiUiState = useAiUiState;
        if (aiUiState.count == 0) {
            this._infoSound.forEach(sound => sound.stop()) //停止所有声音
            this._infoSound[index].play() //播放声音
        }
        aiUiState.setDialogInfo(dialogInfo)
        aiUiState.setDialogShowing(true)
    }

    private setUpSound() { //加载AI声音
        this._aiInfo.infoSoundURL.forEach((soundURL, index) => {
            const sound = new Sound(`${this._aiInfo.name}-sound-${index}`, soundURL, this._scene, () => {
            }, {loop: false, autoplay: false,
                spatialSound:true,
                maxDistance:4,
                distanceModel: "exponential",
                rolloffFactor: 2
            });
            this._infoSound.push(
                sound
            )
            sound.attachToMesh(this._aiTransformNode)
        })
    }

    private checkIfSoundPlaying(){
        for (let i = 0; i < this._infoSound.length; i++) {
            if (this._infoSound[i].isPlaying)
                return true
        }
        return  false
    }

    setUpShadow(_shadowGenerator: ShadowGenerator ) {
        if (this._collisionBox){
            const childMeshes = this._collisionBox.getChildMeshes();
            childMeshes.forEach(mesh=>{
                if (mesh == this._miniMapMesh)
                    return
                _shadowGenerator.addShadowCaster(mesh)
            })
        }
    }

    private stopAllSound() {
        this._infoSound.forEach(sound=>{
            sound.stop()
        })
    }

    public clearAIState(){ //当玩家打开书架/练习台时 清除与AI的对话
        this.hideHintSprite()
        if (this._encounterPlayer) {
            if (this._playerManager) {
                this._playerManager.currentAIName = ""
            }
            this.stopAllSound()
            this._state = this._prevState
            if (this._state == AIState.moving || this._state == AIState.wait) { //继续之前没走的路
                let nextIndex = (this._currentIndex + 1) % this._path.length //需要走到的下一个点
                const nextPath = this._path[nextIndex];
                this._aiCrowd.agentGoto(this._aiIndex, nextPath.desPos)
                this._state = AIState.moving
                this.idleAnimation.stop()
                this.walkAnimation.play(true)
            }
            aiUiState.setDialogShowing(false)

        }
        this._encounterPlayer = false
        this._trigger = false
    }

    setUpMiniMap() {
        //小地图
        const miniMap = MeshBuilder.CreateGround(`${this._aiInfo.name}-miniMap`,{width:2,height:2});
        miniMap.isPickable=false
        miniMap.billboardMode = AbstractMesh.BILLBOARDMODE_Z
        const material = new StandardMaterial(`${this._aiInfo.name}-miniMap-Mat`,this._scene);
        const avatarTexture = new Texture(this._aiInfo.miniMapAvatarURL,this._scene);
        avatarTexture.hasAlpha = true
        avatarTexture.uAng = Math.PI

        material.specularColor = Color3.Black()
        material.emissiveColor = Color3.White() //自发光 亮一些
        material.diffuseTexture = avatarTexture
        miniMap.material = material
        miniMap.parent = this._collisionBox!
        miniMap.layerMask = MINI_MAP_LAYER_MASK
        this._miniMapMesh = miniMap
    }

    private _ellipsisHint? : Sprite
    private setUpEllipsisHint() {
        const spriteManager = new SpriteManager("spriteManager", "img/sprite/ellipsisHint.png", 1, {
            width: 520,
            height: 248
        }, this._scene);
        spriteManager.texture.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);
        spriteManager.texture.anisotropicFilteringLevel = this._scene.getEngine().getCaps().maxAnisotropy
        spriteManager.texture.gammaSpace = false
        const hint = new Sprite("Hint", spriteManager);

        hint.width = 1
        hint.height = 0.5
        this._ellipsisHint = hint
        this._ellipsisHint.isPickable =false
        this._ellipsisHint.isVisible =false
        const distance = new Vector3(0,2.2 ,0)
        this._scene.registerBeforeRender(()=>{
            hint.position = this._aiTransformNode.position.add(distance)
            hint.position.y += Math.sin(this.time) * 0.08
            this.time += 0.01
        })
    }
    hideHintSprite(){
        if (this._ellipsisHint)
            this._ellipsisHint.isVisible =false
    }
    showEllipsisHint(){
        if (this._ellipsisHint)
            this._ellipsisHint.isVisible =true
    }

    private time:number = 0

}

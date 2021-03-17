import {
    AdvancedTimer,
    ICrowd,
    Matrix,
    MeshBuilder,
    Quaternion,
    RecastJSPlugin,
    Scene,
    SceneLoader, setAndStartTimer,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {StudioAI} from "../studio/Studio";
import {IAgentParameters} from "@babylonjs/core/Navigation/INavigationEngine";
import {AbstractMesh} from "@babylonjs/core/Meshes/abstractMesh";
import {IParticleSystem} from "@babylonjs/core/Particles/IParticleSystem";
import {Skeleton} from "@babylonjs/core/Bones/skeleton";
import {AnimationGroup} from "@babylonjs/core/Animations/animationGroup";
import {Geometry} from "@babylonjs/core/Meshes/geometry";
import {Light} from "@babylonjs/core/Lights/light";
import {PlayerManager} from "../player/playerManager";

interface PathDetail {
    desPos: Vector3, // 要走到的点的位置
    residenceTime: number //在该点的滞留时间

}

enum AIState {
    wait,
    waitFinished, //等待结束 开始进入moving
    moving // moving完毕后 查看是否需要wait
}

export class Ai {

    private _aiInfo: StudioAI;
    private _scene: Scene;
    private _path: PathDetail[] = []
    private _aiIndex: number;
    private _aiCrowd: ICrowd;
    private _navigationPlugin: RecastJSPlugin;
    private _aiTransformNode: TransformNode
    private idleAnimation!: AnimationGroup ;
    private walkAnimation!: AnimationGroup ;

    constructor(scene: Scene, aiInfo: StudioAI, crowd: ICrowd, navigationPlugin: RecastJSPlugin) {
        this._scene = scene;
        this._aiInfo = aiInfo;  //AI路径信息
        this._navigationPlugin = navigationPlugin;
        this._aiCrowd = crowd;

        this.findPath() //查找结点

        const aiParameter: IAgentParameters = {
            radius: 0.1,
            height: 0.2,
            maxAcceleration: 1.0,
            maxSpeed: 0.5,
            collisionQueryRange: 0.5,
            pathOptimizationRange: 0.0,
            separationWeight: 1.0
        }
        //将第一个结点作为起始位置
        let startPos = this._path[0].desPos
        this._aiTransformNode = new TransformNode(`AI-${this._aiInfo.name}`, this._scene)
        this._aiIndex = crowd.addAgent(startPos, aiParameter, this._aiTransformNode) //AI的索引号
        SceneLoader.ImportMesh("", this._aiInfo.modelURL, undefined, this._scene, this.modelLoaded)
    }

    private modelLoaded = (meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], animationGroups: AnimationGroup[], transformNodes: TransformNode[], geometries: Geometry[], lights: Light[]) => {
        //设置父级关系
        const root = meshes[0];

        //创建碰撞盒子
        let collisionBox = MeshBuilder.CreateBox(`AI-${this._aiInfo.name}-CollisionBox`, {
            width: PlayerManager.PlayerCollisionBoxWidth,
            height: PlayerManager.PlayerCollisionBoxHeight,
            depth: PlayerManager.PlayerCollisionBoxDepth
        });
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
        ////////////////

        //动画
        this.idleAnimation = animationGroups.find(animationGroup => animationGroup.name == this._aiInfo.idleAnimationGroupName)!
        this.idleAnimation.loopAnimation =true
        this.idleAnimation.stop()
        this.walkAnimation = animationGroups.find(animationGroup => animationGroup.name == this._aiInfo.walkAnimationGroupName)!
        this.walkAnimation.loopAnimation =true
        this.walkAnimation.stop()
        this.idleAnimation.play()
        this.setUpPath()

    }

    private _currentIndex = 0 //当前所在的点
    private _state: AIState = AIState.waitFinished //初始的AI的状态

    setUpPath() {

        this._scene.registerBeforeRender(() => {
            //旋转AI
            let velocity=this._aiCrowd.getAgentVelocity(this._aiIndex) //获取AI的速度
            if(velocity.length() > 0.05){
                let desiredRotation = Math.atan2(velocity.x, velocity.z);
                this._aiTransformNode.rotation.y = this._aiTransformNode.rotation.y +(desiredRotation - this._aiTransformNode.rotation.y) * 0.05

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
                    this._currentIndex ++ //下一条路径
                    //开启定时器等待
                    setAndStartTimer({
                        timeout: nextPath.residenceTime,
                        contextObservable: this._scene.onBeforeRenderObservable,
                        onEnded: () => {
                            this._state = AIState.waitFinished
                        }
                    })
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
}

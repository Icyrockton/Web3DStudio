import { Animatable, Animation, BackEase, EasingFunction, IAnimationKey, Mesh, MeshBuilder, NodeMaterial, Scene, Vector3, VertexData } from "@babylonjs/core";
import { CollegeMapManager } from "./collegeMapManager";


enum FenceState {
    init, //还在原位置
    uping,//正在上升
    done, //上升到指定的位置了
    downing, //下降到指定的位置了
}

export class CollegeFence {
    private _fence: Mesh
    private _scene: Scene
    private _position: Vector3 = new Vector3()
    public get fence() {
        return this._fence
    }
    constructor(width: number, height: number, depth: number, scene: Scene) {
        this._fence = new Mesh('fence', scene)
        this._fence.isPickable = false //不可拾取
        this._scene = scene
        //顶点坐标
        let positions = []
        positions[0 * 3 + 0] = width * 0.5
        positions[0 * 3 + 1] = 0
        positions[0 * 3 + 2] = -height * 0.5

        positions[1 * 3 + 0] = width * 0.5
        positions[1 * 3 + 1] = 0
        positions[1 * 3 + 2] = height * 0.5

        positions[2 * 3 + 0] = - width * 0.5
        positions[2 * 3 + 1] = 0
        positions[2 * 3 + 2] = height * 0.5

        positions[3 * 3 + 0] = - width * 0.5
        positions[3 * 3 + 1] = 0
        positions[3 * 3 + 2] = -height * 0.5

        positions[4 * 3 + 0] = width * 0.5
        positions[4 * 3 + 1] = depth
        positions[4 * 3 + 2] = -height * 0.5

        positions[5 * 3 + 0] = width * 0.5
        positions[5 * 3 + 1] = depth
        positions[5 * 3 + 2] = height * 0.5

        positions[6 * 3 + 0] = - width * 0.5
        positions[6 * 3 + 1] = depth
        positions[6 * 3 + 2] = height * 0.5

        positions[7 * 3 + 0] = - width * 0.5
        positions[7 * 3 + 1] = depth
        positions[7 * 3 + 2] = -height * 0.5

        let indices: number[] = []
        let normals: number[] = []
        //索引
        indices.push(0, 1, 4)
        indices.push(5, 4, 1)
        indices.push(6, 5, 2)
        indices.push(1, 2, 5)
        indices.push(3, 6, 2)
        indices.push(7, 6, 3)
        indices.push(7, 0, 4)
        indices.push(7, 3, 0)
        //uv坐标
        let uv: number[] = [
            0, 0,
            1 / 3, 0,
            1 / 3 * 2, 0,
            1, 0,
            0, 1,
            1 / 3, 1,
            1 / 3 * 2, 1,
            1, 1
        ]

        let vertexData = new VertexData()
        //法线
        VertexData.ComputeNormals(positions, indices, normals)
        vertexData.indices = indices
        vertexData.positions = positions
        vertexData.normals = normals
        vertexData.uvs = uv
        vertexData.applyToMesh(this._fence)
        this.loadMat()


    }

    async loadMat() {
        let fenceMat = new NodeMaterial('fence_Mat', this._scene)
        fenceMat.backFaceCulling = false // 关闭背面剪裁 两面都可以看见
        await fenceMat.loadAsync("nodeMaterial/fence.json")
        fenceMat.build(false)
        this._fence.material = fenceMat
    }
    private _upAnim?: Animatable
    private _downAnim?: Animatable
    private _state = FenceState.init
    public up() { //上升动画

        if (this._state == FenceState.init || this._state == FenceState.downing) { //上升...
            if(this._downAnim){
                this._downAnim.stop()
            }
            this.createUpAnimation()
            this._upAnim = this._scene.beginAnimation(this._fence, 0, CollegeFence.frameRate , false, undefined, () => {
                this._state = FenceState.done
            })
            this._state=FenceState.uping //上升
        }
        else if (this._state == FenceState.uping || this._state == FenceState.done) { //什么也不做

        }

    }

    public down() { //下降动画
        if(this._state==FenceState.done || this._state == FenceState.uping){ //下降
            if(this._upAnim){
                this._upAnim.stop()
            }
            this.createDownAnimation()
            this._downAnim = this._scene.beginAnimation(this._fence, 0,CollegeFence.frameRate  , false, undefined, () => {
                this._state = FenceState.init
            })
            this._state=FenceState.downing //下降
        }
        else if(this._state == FenceState.init || this._state==FenceState.downing){//什么也不做

        }

    }

    public set position(positon: Vector3) {
        this._position.copyFrom(positon)
        this._fence.position.copyFrom(this._position)
        //设置动画
        this._fence.animations = [] //清空动画
    }
    static frameRate = 60
    private createUpAnimation() {
        let upAnimation = new Animation("up", "position.y", CollegeFence.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const keyFrames: IAnimationKey[] = []
        keyFrames.push({
            frame: 0,
            value: this._fence.position.y
        })
        keyFrames.push({
            frame: 60,
            value: this._position.y + 1.2
        })
        upAnimation.setKeys(keyFrames)
        let easeFunction=new BackEase()
        easeFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
        upAnimation.setEasingFunction(easeFunction)
        this._fence.animations.push(upAnimation) //添加向上动画
    }
    private createDownAnimation() {
        let downAnimation = new Animation("down", "position.y", CollegeFence.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const keyFrames: IAnimationKey[] = []
        keyFrames.push({
            frame: 0,
            value: this._fence.position.y
        })
        keyFrames.push({
            frame: 60,
            value: this._position.y
        })
        let easeFunction=new BackEase()
        easeFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
        downAnimation.setEasingFunction(easeFunction)
        downAnimation.setKeys(keyFrames)
        this._fence.animations.push(downAnimation) //添加向下动画
    }
}

import {Floor} from "./collegeManager";
import {IState} from "../IState";
import {Animation, Engine, IAnimationKey, Mesh, Scene, TransformNode} from "@babylonjs/core";


export class CollegeFloor {
    private _floor: Floor;
    private _web3DStudio: IState;
    private _floorTransformNode: TransformNode
    private _scene: Scene
    private _originYPos: number //在y轴方向的原始位置
    private _maxYPos: number //在y轴方向的最高位置
    static readonly HEIGHT = 6 //每层楼的高度

    constructor(scene: Scene, web3DStudio: IState, floor: Floor, floorRoot: Mesh, maxYPos: number) {
        this._scene = scene
        this._floor = floor;
        this._web3DStudio = web3DStudio; //为了转换状态
        this._floorTransformNode = new TransformNode(`floor-${floor.floorNumber}`, this._scene)
        const cloneFloor = floorRoot.clone(`floor-${floor.floorNumber}-meshes`);
        cloneFloor.parent = this._floorTransformNode
        //设置高度
        this._originYPos = (this._floor.floorNumber - 1) * CollegeFloor.HEIGHT
        this._maxYPos = maxYPos - (this._floor.floorNumber - 1) * CollegeFloor.HEIGHT
        this._floorTransformNode.position.y = this._originYPos
        this.translucent()
    }

    private translucent() { //半透明
        const childMeshes = this._floorTransformNode.getChildMeshes();
        childMeshes.forEach(mesh => {
            const material = mesh.material;
            mesh.visibility = 0.2
        })
    }

    public pushToOrigin(delay: number) {  //压入到原位置   延迟时间
        console.log('开始push动画')
        const seconds = delay / 1000 //秒
        this._scene.beginDirectAnimation(this._floorTransformNode, this.createPushAnim(seconds), 0,
            CollegeFloor.frameRate * seconds + CollegeFloor.pushAnimationTime,false)
    }

    public popToMaxHeight(delay:number){ //弹出到最高的位置上去 延迟时间
        console.log('开始pop动画')
        const seconds = delay / 1000 //秒
        this._scene.beginDirectAnimation(this._floorTransformNode, this.createPopAnim(seconds), 0,
            CollegeFloor.frameRate * seconds + CollegeFloor.popAnimationTime,false)
    }

    private createPushAnim(delaySecond: number) {
        const animation = new Animation(`pushAnim-${this._floor.floorNumber}`, "position.y", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames: IAnimationKey[] = []
        keyFrames.push({
            frame: 0,
            value: this._floorTransformNode.position.y
        })
        keyFrames.push({
            frame: CollegeFloor.frameRate * delaySecond,
            value: this._floorTransformNode.position.y
        })
        keyFrames.push({
            frame: CollegeFloor.frameRate * delaySecond + CollegeFloor.pushAnimationTime,
            value: this._originYPos  //回到原来的位置上去
        })

        animation.setKeys(keyFrames)
        return [animation]
    }

    private createPopAnim(delaySecond: number) {
        const animation = new Animation(`popAnim-${this._floor.floorNumber}`, "position.y", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keyFrames: IAnimationKey[] = []
        keyFrames.push({
            frame: 0,
            value: this._floorTransformNode.position.y
        })
        keyFrames.push({
            frame: CollegeFloor.frameRate * delaySecond,
            value: this._floorTransformNode.position.y
        })
        keyFrames.push({
            frame: CollegeFloor.frameRate * delaySecond + CollegeFloor.pushAnimationTime,
            value: this._maxYPos  //弹出去
        })

        animation.setKeys(keyFrames)
        return [animation]
    }

    static frameRate = 60
    static pushAnimationTime = CollegeFloor.frameRate  / 4
    static popAnimationTime = CollegeFloor.frameRate
}

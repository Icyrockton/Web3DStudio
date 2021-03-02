

//接待员
import {AbstractMesh, Scene, TransformNode, Vector3} from "@babylonjs/core";
import {AnimationGroup} from "@babylonjs/core/Animations/animationGroup";


export interface ReceptionistAsset {
    readonly receptionistMesh:AbstractMesh, //接待员Root对象
    readonly greetingAnimation:AnimationGroup //打招呼的动画
}
export class Receptionist  extends TransformNode{

    private _greetAnimation: AnimationGroup;
    constructor(assets:ReceptionistAsset,scene:Scene) {
        super("receptionistRoot",scene);
        assets.receptionistMesh.parent=this //设置父级对象
        this._greetAnimation=assets.greetingAnimation
        this.setUpAnimation()
    }

    private setUpAnimation() {
        this._greetAnimation.loopAnimation=false
        this._greetAnimation.stop()

    }



    setUpRotateAlongYAxis(receptionistRotateYAxis: number) {
        this.rotation.y = receptionistRotateYAxis
    }
}
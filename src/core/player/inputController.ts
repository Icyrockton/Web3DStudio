import {ActionManager, ExecuteCodeAction, Scalar, Scene} from "@babylonjs/core";


export class InputController {

    //水平 垂直 移动
    public horizontal: number = 0
    public vertical: number = 0
    //跟踪轴向
    public horizontalAxis: number = 0
    public verticalAxis: number = 0
    //
    inputMap: { [key: string]: boolean } = {}

    constructor(scene: Scene) {
        scene.actionManager = new ActionManager(scene)

        //按键按下
        scene.actionManager.registerAction(new ExecuteCodeAction(
            ActionManager.OnKeyDownTrigger,
            (event) => {
                if (event.sourceEvent instanceof KeyboardEvent) {
                    let sourceEvent = <KeyboardEvent>event.sourceEvent
                    this.inputMap[sourceEvent.key] = this.checkKeyDown(sourceEvent.type)
                }
            }
        ))

        //按键松开
        scene.actionManager.registerAction(new ExecuteCodeAction(
            ActionManager.OnKeyUpTrigger,
            (event) => {
                if (event.sourceEvent instanceof KeyboardEvent) {
                    let sourceEvent = <KeyboardEvent>event.sourceEvent
                    this.inputMap[sourceEvent.key] = this.checkKeyDown(sourceEvent.type)
                }
            }
        ))

        scene.registerBeforeRender(()=>{
            this._updateFromKeyBoard() //更新按键
        })
    }

    private _updateFromKeyBoard() {
        if (this.inputMap["ArrowUp"]) {
            this.vertical = Scalar.Lerp(this.vertical, 1, 0.2)
            this.verticalAxis = 1
        } else if (this.inputMap["ArrowDown"]) {
            this.vertical = Scalar.Lerp(this.vertical, -1, 0.2)
            this.verticalAxis = -1
        }
        else{
            this.vertical=0
            this.verticalAxis=0
        }

        if (this.inputMap["ArrowLeft"]) {
            this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
            this.horizontalAxis = -1;
        } else if (this.inputMap["ArrowRight"]) {
            this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
            this.horizontalAxis = 1;
        }
        else {
            this.horizontal = 0;
            this.horizontalAxis = 0;
        }
    }


    //检查按键事件是否为keydown事件
    private checkKeyDown(type: string): boolean {
        return type == "keydown"
    }
}
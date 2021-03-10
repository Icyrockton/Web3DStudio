import {Engine, MeshBuilder, Scene} from "@babylonjs/core";


export class BookShelf {
    private _scene: Scene;

    constructor(engine: Engine) {
        this._scene = new Scene(engine)
        this._scene.autoClear = false //关闭自动清除  作为前景
        this._scene.createDefaultLight()
        this._scene.createDefaultCamera(true,false,true)
        MeshBuilder.CreateBox("box", {size: 1}, this._scene)
        this._scene.debugLayer.show()
    }


    public render(){
        this._scene.render()
    }
}
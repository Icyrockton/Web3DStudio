import {ArcRotateCamera, MeshBuilder, Scene, Vector3} from "@babylonjs/core";


export class CollegeManager {
    private _scene: Scene;

    constructor(collegeScene: Scene) {
        this._scene = collegeScene;
    }

    async load() {
        this._scene.createDefaultLight()
        this._scene.createDefaultEnvironment()
        MeshBuilder.CreateBox("box",{size:2})
        MeshBuilder.CreatePlane("plane",{size:2})
        const camera = new ArcRotateCamera("camera",0,0,10,Vector3.Zero(),this._scene);
        camera.attachControl()

    }
}
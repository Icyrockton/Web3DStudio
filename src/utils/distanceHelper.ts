import {Mesh, Scene} from "@babylonjs/core";
import {PlayerManager} from "../core/player/playerManager";


//距离检测的助手类
export  class DistanceHelper {

    private _triggeredMoreThan: boolean = false  //大于
    private _triggeredLessThan: boolean = false  //小于
    private _scene: Scene;
    private _mesh: Mesh;
    private _player: PlayerManager;

    constructor(scene:Scene,mesh:Mesh,player:PlayerManager) {
        this._scene = scene;
        this._mesh = mesh;
        this._player = player;


    }

    public triggerOnceWhenDistanceLessThan(length: number, func: () => void) {
        this._scene.registerBeforeRender(() => {
            const distance = this._player.playerPosition.subtract(this._mesh.position).length()
            if (!this._triggeredLessThan && distance < length) {
                this._triggeredLessThan = true
                func()
            }
        })
        this._scene.registerAfterRender(() => {
            const distance = this._player.playerPosition.subtract(this._mesh.position).length()
            if (distance > length) {
                this._triggeredLessThan = false
            }
        })
    }


    public triggerOnceWhenDistanceMoreThan(length: number, func: () => void) {
        this._scene.registerBeforeRender(() => {
            const distance = this._player.playerPosition.subtract(this._mesh.position).length()
            if (!this._triggeredMoreThan && distance > length) {
                this._triggeredMoreThan = true
                func()
            }
        })
        this._scene.registerAfterRender(() => {
            const distance = this._player.playerPosition.subtract(this._mesh.position).length()
            if (distance < length) {
                this._triggeredMoreThan = false

            }
        })
    }

    //小于length时 始终触发
    public triggerWhenDistanceLessThan(length: number, func: () => void) {
        this._scene.registerBeforeRender(() => {
            const distance = this._player.playerPosition.subtract(this._mesh.position).length()
            if (distance < length) {
                func()
            }
        })
    }
}
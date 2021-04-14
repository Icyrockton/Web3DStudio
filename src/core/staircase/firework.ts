import {
    Color4,
    Mesh,
    MeshBuilder,
    ParticleSystem,
    Scene, Sound,
    Texture,
    TransformNode,
    Vector3,
    VertexBuffer
} from "@babylonjs/core";
import {FireWorkSound} from "../player/playerManager";


export class Firework {

    private _emitter: Mesh
    private _particleSys: ParticleSystem
    private _scene: Scene;
    private _height: number
    private _started: boolean = false //是否启动烟花
    private _exploded: boolean = false //是否爆炸
    static readonly flareImageURL = "img/flare.png";


    private _flareTexture : Texture
    private _fireWorkSound: FireWorkSound;

    constructor(scene: Scene,fireworkSound: FireWorkSound,flareTexture: Texture, startNode: TransformNode, height: number) {
        this._scene = scene;
        this._fireWorkSound = fireworkSound
        this._flareTexture = flareTexture

        //火箭向上发射
        const rocket = MeshBuilder.CreateSphere("rocket", {segments: 1, diameter: 1},this._scene);
        this._emitter = rocket
        rocket.isVisible = false
        //设置火箭的初始位置
        this._emitter.position.copyFrom(startNode.position)
        this._height = height
        //粒子系统
        let particle = new ParticleSystem(`${startNode.name}-particleSystem`, 30, scene)
        particle.preWarmCycles = 1
        //设置粒子纹理
        particle.particleTexture = this._flareTexture.clone()
        //设置粒子发射原点 （在火箭的位置
        particle.emitter = rocket
        //发射区域限制为点
        particle.minEmitBox = new Vector3(0, 0, 0)
        particle.maxEmitBox = new Vector3(0, 0, 0)
        //颜色
        particle.color1 =  new Color4(224 / 255, 191 / 255, 152 / 255, 1.0)
        particle.color2 =  new Color4(187 / 255, 51 / 255, 78 /255, 1.0)
        particle.colorDead = new Color4(0, 0, 0, 0.0);
        //大小
        particle.minSize = 0.4
        particle.maxSize =  0.6
        particle.minLifeTime = 0.5;
        particle.maxLifeTime = 0.5;
        // particle.addSizeGradient(0, 1)
        // particle.addSizeGradient(1, 0.1)
        particle.emitRate = 30
        //速率
        particle.minEmitPower = 1
        particle.maxEmitPower = 1
        particle.updateSpeed = 0.01

        this._particleSys = particle

    }

    public launchFireWork() {
        if (this._started) {

            if (this._emitter.position.y >= this._height) {
                if (!this._exploded) {
                    this._fireWorkSound.explosionSound.play() //播放爆炸声音
                    this._exploded = true
                    this.explosion(this._emitter.position)
                    this._emitter.dispose() //销毁Mesh
                    this._particleSys.stop() //停止粒子系统
                }
            } else {
                this._emitter.position.y += 0.02
            }
        } else {
            this._started = true
            this._particleSys.start()
            this._fireWorkSound.rocketSound.play() //播放上升声音
        }
    }


    //爆炸
    private explosion(position: Vector3) {

        const explosion = Mesh.CreateSphere("explosion", 2, 1, this._scene);
        explosion.isVisible = false;
        explosion.position = position;

        let emitter = explosion;
        emitter.useVertexColors = true;
        let vertPos = emitter.getVerticesData(VertexBuffer.PositionKind)!;
        let vertNorms = emitter.getVerticesData(VertexBuffer.NormalKind)!;
        let vertColors = [];

        for (let i = 0; i < vertPos.length; i += 3) {
            let vertPosition = new Vector3(
                vertPos[i], vertPos[i + 1], vertPos[i + 2]
            )
            let vertNormal = new Vector3(
                vertNorms[i], vertNorms[i + 1], vertNorms[i + 2]
            )
            let r = Math.random();
            let g = Math.random();
            let b = Math.random();
            let alpha = 1.0;
            let color = new Color4(r, g, b, alpha);
            vertColors.push(r);
            vertColors.push(g);
            vertColors.push(b);
            vertColors.push(alpha);

            let gizmo = Mesh.CreateBox("gizmo", 0.001, this._scene);
            gizmo.position = vertPosition;
            gizmo.parent = emitter;
            let direction = vertNormal.normalize().scale(1);

            const particleSys = new ParticleSystem("particles", 20, this._scene);
            particleSys.particleTexture = this._flareTexture.clone()
            particleSys.emitter = gizmo;
            particleSys.minEmitBox = new Vector3(1, 0, 0);
            particleSys.maxEmitBox = new Vector3(1, 0, 0);
            particleSys.minSize = .3;
            particleSys.maxSize = .3;
            particleSys.color1 = color;
            particleSys.color2 = color;
            particleSys.colorDead = new Color4(0, 0, 0, 0.0);
            particleSys.minLifeTime = 1;
            particleSys.maxLifeTime = 2;
            particleSys.emitRate = 20;
            particleSys.gravity = new Vector3(0, -9.8, 0);
            particleSys.direction1 = direction;
            particleSys.direction2 = direction;
            particleSys.minEmitPower = 10;
            particleSys.maxEmitPower = 13;
            particleSys.updateSpeed = 0.01;
            particleSys.targetStopDuration = 0.2;
            particleSys.blendMode = ParticleSystem.BLENDMODE_ONEONE
            particleSys.disposeOnStop = true;
            particleSys.start();
            particleSys.onDisposeObservable.add(()=>{
                gizmo.dispose(false,true)
            })
        }

        emitter.setVerticesData(VertexBuffer.ColorKind, vertColors);

    }

}

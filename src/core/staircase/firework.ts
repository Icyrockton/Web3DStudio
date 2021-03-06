import {
    Color4,
    Mesh,
    MeshBuilder,
    ParticleSystem,
    Scene,
    Texture,
    TransformNode,
    Vector3,
    VertexBuffer
} from "@babylonjs/core";


export class Firework {

    private _emitter: Mesh
    private _particleSys: ParticleSystem
    private _scene: Scene;
    private _height: number
    private _started: boolean = false //是否启动烟花
    private _exploded: boolean = false //是否爆炸
    private readonly flareImageURL = "src/assets/img/flare.png";

    constructor(scene: Scene, startNode: TransformNode, height: number) {
        this._scene = scene;
        //火箭向上发射
        const rocket = MeshBuilder.CreateSphere("rocket", {segments: 4, diameter: 1});
        this._emitter = rocket
        rocket.isVisible = false
        //设置火箭的初始位置
        this._emitter.position.copyFrom(startNode.position)
        this._height = height
        //粒子系统
        let particle = new ParticleSystem(`${startNode.name}-particleSystem`, 100, scene)
        //设置粒子纹理
        particle.particleTexture = new Texture(this.flareImageURL, scene)
        //设置粒子发射原点 （在火箭的位置
        particle.emitter = rocket
        //发射区域限制为点
        particle.minEmitBox = new Vector3(0, 0, 0)
        particle.maxEmitBox = new Vector3(0, 0, 0)
        //颜色
        particle.color1 = new Color4(1, 0.8, 1.0, 1.0);
        particle.color2 = new Color4(1, 0.5, 1.0, 1.0);
        particle.colorDead = new Color4(0, 0, 0.2, 0.5);
        //大小
        particle.minSize = .7
        particle.maxSize = .7
        particle.addSizeGradient(0, 1)
        particle.addSizeGradient(1, 0.1)
        //生存周期
        particle.minLifeTime = 1
        particle.maxLifeTime = 1
        particle.emitRate = 40
        //速率
        particle.minEmitPower = 1
        particle.maxEmitPower = 1
        particle.updateSpeed = 0.02
        particle.blendMode = ParticleSystem.BLENDMODE_ONEONE
        this._particleSys = particle

    }

    public launchFireWork() {
        if (this._started) {

            if (this._emitter.position.y >= this._height) {
                if (!this._exploded) {
                    this._exploded = true
                    this.explosion(this._emitter.position)
                    this._emitter.dispose() //销毁Mesh
                    this._particleSys.stop() //停止粒子系统
                }
            } else {
                this._emitter.position.y += 0.05
            }
        } else {
            this._started = true
            this._particleSys.start()
        }
    }


    //爆炸
    private explosion(position: Vector3) {

        const explosion = Mesh.CreateSphere("explosion", 4, 0.5, this._scene);
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
            particleSys.particleTexture = new Texture(this.flareImageURL, this._scene);
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
            particleSys.disposeOnStop = true;
            particleSys.start();
        }

        emitter.setVerticesData(VertexBuffer.ColorKind, vertColors);

    }

}
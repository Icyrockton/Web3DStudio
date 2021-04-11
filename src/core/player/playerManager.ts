import {Player, PlayerAssets} from "./player";
import {
    AbstractMesh,
    Matrix,
    MeshBuilder,
    Quaternion,
    Scene,
    SceneLoader,
    ShadowGenerator, Sound, Sprite, SpriteManager, Texture, TransformNode,
    Vector3
} from "@babylonjs/core";
import {InputController} from "./inputController";
import {RotateCamera} from "../studio/Studio";
import {Firework} from "../staircase/firework";


export interface FireWorkSound {
    rocketSound: Sound
    explosionSound: Sound
}

export class PlayerManager {
    private _flareTexture: Texture; //烟花的贴图
    private _fireWorkSound: FireWorkSound

    get currentAIName(): string {
        return this._currentAIName;
    }

    set currentAIName(value: string) {
        this._currentAIName = value;
    }

    static PlayerCollisionBoxWidth = 0.7
    static PlayerCollisionBoxHeight = 1.8
    static PlayerCollisionBoxDepth = 0.5
    private _scene: Scene;
    private _playerModelURL: string;
    public player!: Player;
    private _collisionBox!: AbstractMesh
    static CollisionBoxWidth = 0.7
    static CollisionBoxHeight = 1.8
    static CollisionBoxDepth = 0.5
    private _busy: boolean = false  //忙碌   打开工作台.. 图书... 不允许AI产生对话
    private _currentAIName: string = "" //和交谈的AI
    constructor(scene: Scene, playerModelURL: string) {
        this._scene = scene;
        this._playerModelURL = playerModelURL;
        this._flareTexture = new Texture(Firework.flareImageURL, this._scene)
        this._fireWorkSound = {
            rocketSound: new Sound("rocketSound", "sound/firework/rocket.wav", this._scene, () => {
            }),
            explosionSound: new Sound("rocketSound", "sound/firework/explosion.wav", this._scene, () => {
            })
        }
    }

    async loadPlayer(playerRotateYAxis: number) {

        let playerImport = await SceneLoader.ImportMeshAsync("", this._playerModelURL, undefined, this._scene)
        playerImport.meshes.forEach(mesh => {
            mesh.isPickable = false //全部设置为不可拾取
        })
        //创建碰撞盒子
        let collisionBox = MeshBuilder.CreateBox("playerCollisionBox", {
            width: PlayerManager.PlayerCollisionBoxWidth,
            height: PlayerManager.PlayerCollisionBoxHeight,
            depth: PlayerManager.PlayerCollisionBoxDepth
        }, this._scene);
        collisionBox.bakeTransformIntoVertices(Matrix.Translation(0, PlayerManager.PlayerCollisionBoxHeight / 2, 0))
        collisionBox.isVisible = false //不可见
        collisionBox.isPickable = false //不可拾取
        collisionBox.checkCollisions = true //检查碰撞
        //碰撞的椭球体
        //https://doc.babylonjs.com/divingDeeper/cameras/camera_collisions
        collisionBox.ellipsoid = new Vector3(PlayerManager.PlayerCollisionBoxWidth / 2, PlayerManager.PlayerCollisionBoxHeight / 2, PlayerManager.PlayerCollisionBoxDepth / 2)
        //现在玩家的原点位于(0,0,0)的位置 原始的碰撞椭球体的中心与玩家的原点重合 我们需要将碰撞椭球体沿y轴向上移动 移动到玩家的中心
        collisionBox.ellipsoidOffset = new Vector3(0, PlayerManager.PlayerCollisionBoxHeight / 2, 0)

        collisionBox.rotationQuaternion = Quaternion.FromEulerAngles(0, playerRotateYAxis, 0)
        this._collisionBox = collisionBox
        let playerAssets = {
            collisionBox: collisionBox,
            animationGroups: playerImport.animationGroups,
            avatarMiniMapURL: "img/miniMap/player.png"
        } as PlayerAssets

        let playerMesh = playerImport.meshes[0]; //Player的模型对象
        playerMesh.parent = collisionBox
        playerMesh.isPickable = false

        let playerController = new InputController(this._scene);
        let player = new Player(playerAssets, this._scene, playerController);
        this.player = player
        this.setUpPlayerHint()

    }


    private _fireworks: Firework[] = []

    private _fireworkStartPos: TransformNode [] = []

    private _fireworkStart: boolean = false

    public set playerPosition(position: Vector3) {
        this._collisionBox.position.set(-position.x, position.y, position.z)
    }

    public get playerPosition(): Vector3 {
        return this._collisionBox.position
    }

    startFireWork() {
        this.setUpFireWork()
    }


    private setUpFireWork() {
        // const pos_1 = new TransformNode("pos_1", this._scene);
        // pos_1.position.copyFrom(this._collisionBox.position)

        this._fireworkStartPos.forEach(node=>node.dispose())
        this._fireworkStartPos.splice(0,this._fireworkStartPos.length)
        const fireworkStartPos: TransformNode[] = []
        //fireworkStartPos.push(pos_1)


        console.log(this._fireworkStartPos.length)
        for (let i = 0; i < 3; i++) {
            const R = Math.random() * 4 + 2//半径
            const angle = Math.random() * 2 * Math.PI //角度
            const node = new TransformNode(`fireWord_${i}`, this._scene);
            node.position.copyFrom(this._collisionBox.position).addInPlace(new Vector3(R * Math.sin(angle), 0, R * Math.cos(angle)))
            this._fireworkStartPos.push(node)
        }


        let fireWork: Firework[] = []
        this._fireworkStartPos.forEach(startPos => {
            fireWork.push(new Firework(this._scene, this._fireWorkSound, this._flareTexture, startPos, 5))
        })


        this._scene.registerBeforeRender(() => {
            fireWork.forEach(fireWork => {
                fireWork.launchFireWork()
            })

        })

    }


    setUpRotateCamera(rotateCamera: RotateCamera[]) {
        rotateCamera.forEach(value => {
            let mesh = this._scene.getMeshByName(value.mesh);
            if (mesh) {
                mesh.isVisible = false

                this._scene.registerBeforeRender(() => {
                    if (mesh!.intersectsMesh(this._collisionBox, false, false)) {
                        this.player.rotateCameraAroundYAxis(value.rotate)
                    }


                })
            }
        })
    }

    get busy(): boolean {
        return this._busy;
    }

    set busy(value: boolean) {
        this._busy = value;
    }

    setUpShadow(_shadowGenerator: ShadowGenerator) {
        this.player.setUpShadow(_shadowGenerator)
    }


    private bookShelfHint?: Sprite
    private practiceTableHint?: Sprite

    private setUpPlayerHint() {
        const bookShelfSpriteManager = new SpriteManager("spriteManager_book", "img/sprite/bookShelfHint.png", 1, {
            width: 520,
            height: 248
        }, this._scene);
        bookShelfSpriteManager.texture.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);
        bookShelfSpriteManager.texture.anisotropicFilteringLevel = this._scene.getEngine().getCaps().maxAnisotropy

        this.bookShelfHint = new Sprite("bookShelfHint", bookShelfSpriteManager);

        this.bookShelfHint.width = 1.5
        this.bookShelfHint.height = 0.75
        this.bookShelfHint.isPickable = false
        this.bookShelfHint.isVisible = false

        const practiceTableSpriteManager = new SpriteManager("spriteManager_table", "img/sprite/practiceTableHint.png", 1, {
            width: 520,
            height: 248
        }, this._scene);
        practiceTableSpriteManager.texture.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);
        practiceTableSpriteManager.texture.anisotropicFilteringLevel = this._scene.getEngine().getCaps().maxAnisotropy

        this.practiceTableHint = new Sprite("practiceTableHint", practiceTableSpriteManager);

        this.practiceTableHint.width = 1.5
        this.practiceTableHint.height = 0.75
        this.practiceTableHint.isPickable = false
        this.practiceTableHint.isVisible = false

        const distance = new Vector3(0, 2.5, 0)
        this._scene.registerBeforeRender(() => {
            this.bookShelfHint!.position = this._collisionBox!.position.add(distance)
            this.bookShelfHint!.position.y += Math.sin(this.time) * 0.08
            this.practiceTableHint!.position = this._collisionBox!.position.add(distance)
            this.practiceTableHint!.position.y += Math.sin(this.time) * 0.08
            this.time += 0.01
        })
    }

    hideHintSprite() {
        if (this.bookShelfHint)
            this.bookShelfHint.isVisible = false
        if (this.practiceTableHint)
            this.practiceTableHint.isVisible = false
    }

    showPracticeTableHint() {
        if (this.practiceTableHint)
            this.practiceTableHint.isVisible = true
    }

    showBookShelfHint() {
        if (this.bookShelfHint)
            this.bookShelfHint.isVisible = true
    }

    private time: number = 0


}

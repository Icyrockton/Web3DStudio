import {
    ArcRotateCamera, Color3,
    DynamicTexture,
    Matrix,
    Mesh,
    MeshBuilder,
    Quaternion,
    Scene,
    SceneLoader, StandardMaterial,
    Vector3
} from "@babylonjs/core";
import {Player, PlayerAssets} from "../player/player";
import {InputController} from "../player/inputController";


export class CollegeManager {
    private _scene: Scene;
    private _player!:Player
    static PlayerModelUrl = "src/assets/model/player.glb"

    constructor(collegeScene: Scene) {
        this._scene = collegeScene;
    }

    async load() {
        this._scene.collisionsEnabled=true //打开碰撞
        let ground = MeshBuilder.CreateBox("box",{width:10,height:1,depth:10});
        ground.position.y-=0.5
        ground.checkCollisions=true
        this._scene.createDefaultLight()
        const camera = new ArcRotateCamera("camera", 0, 0, 10, Vector3.Zero(), this._scene);
        camera.attachControl()

        await this.loadPlayer()

        this.showWorldAxis(7)
    }

    static CollisionBoxWidth = 0.7
    static CollisionBoxHeight = 1.8
    static CollisionBoxDepth = 0.5

    async loadPlayer() {
        let playerImport = await SceneLoader.ImportMeshAsync("", CollegeManager.PlayerModelUrl, undefined, this._scene)
        playerImport.meshes.forEach(mesh=>{
            mesh.isPickable = false //全部设置为不可拾取
        })
        //创建碰撞盒子
        let collisionBox = MeshBuilder.CreateBox("playerCollisionBox", {
            width: CollegeManager.CollisionBoxWidth,
            height: CollegeManager.CollisionBoxHeight,
            depth: CollegeManager.CollisionBoxDepth
        });
        //沿y轴向上移动 ， 而不改变碰撞网格的原点 原点处于（0，0，0）
        collisionBox.bakeTransformIntoVertices(Matrix.Translation(0, CollegeManager.CollisionBoxHeight / 2, 0))
        collisionBox.isVisible = false //不可见
        collisionBox.isPickable = false //不可拾取
        collisionBox.checkCollisions = true //检查碰撞

        //碰撞的椭球体
        //https://doc.babylonjs.com/divingDeeper/cameras/camera_collisions
        collisionBox.ellipsoid = new Vector3(CollegeManager.CollisionBoxWidth / 2, CollegeManager.CollisionBoxHeight / 2, CollegeManager.CollisionBoxDepth / 2)

        //现在玩家的原点位于(0,0,0)的位置 原始的碰撞椭球体的中心与玩家的原点重合 我们需要将碰撞椭球体沿y轴向上移动 移动到玩家的中心
        collisionBox.ellipsoidOffset = new Vector3(0,CollegeManager.CollisionBoxHeight / 2,0)

        collisionBox.rotationQuaternion=new Quaternion(0,0,0,0)
        let playerAssets = {
            collisionBox:collisionBox,
            animationGroups:playerImport.animationGroups
        } as PlayerAssets

        let playerMesh = playerImport.meshes[0]; //Player的模型对象
        playerMesh.parent=collisionBox
        playerMesh.isPickable=false

        let playerController = new InputController(this._scene);
        let player = new Player(playerAssets,this._scene,playerController);
        this._player=player
    }


    showWorldAxis(size:number) {
        let makeTextPlane = (text:string, color:string, size:number) => {
            let dynamicTexture = new DynamicTexture("DynamicTexture", 50, this._scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color , "transparent", true);
            let plane = Mesh.CreatePlane("TextPlane", size, this._scene, true);
            plane.isPickable=false
            let mat=new StandardMaterial("TextPlaneMaterial", this._scene);
            mat.backFaceCulling = false;
            mat.specularColor = new Color3(0, 0, 0);
            mat.diffuseTexture = dynamicTexture;
            plane.material=mat
            return plane;
        };
        let axisX = Mesh.CreateLines("axisX", [
            Vector3.Zero(), new Vector3(size, 0, 0), new Vector3(size * 0.95, 0.05 * size, 0),
            new Vector3(size, 0, 0), new Vector3(size * 0.95, -0.05 * size, 0)
        ], this._scene);
        axisX.isPickable=false
        axisX.color = new Color3(1, 0, 0);
        let xChar = makeTextPlane("X", "red", size / 10);
        xChar.position = new Vector3(0.9 * size, -0.05 * size, 0);
        let axisY = Mesh.CreateLines("axisY", [
            Vector3.Zero(), new Vector3(0, size, 0), new Vector3( -0.05 * size, size * 0.95, 0),
            new Vector3(0, size, 0), new Vector3( 0.05 * size, size * 0.95, 0)
        ], this._scene);
        axisY.color = new Color3(0, 1, 0);
        axisY.isPickable=false
        var yChar = makeTextPlane("Y", "green", size / 10);
        yChar.position = new Vector3(0, 0.9 * size, -0.05 * size);
        var axisZ = Mesh.CreateLines("axisZ", [
            Vector3.Zero(), new Vector3(0, 0, size), new Vector3( 0 , -0.05 * size, size * 0.95),
            new Vector3(0, 0, size), new Vector3( 0, 0.05 * size, size * 0.95)
        ], this._scene);
        axisZ.color = new Color3(0, 0, 1);
        axisZ.isPickable=false
        var zChar = makeTextPlane("Z", "blue", size / 10);
        zChar.position = new Vector3(0, 0.05 * size, 0.9 * size);
    };
}
import  { AbstractMesh, Animation, AnimationGroup, ArcRotateCamera, Color4, IAnimationKey, Mesh, MeshBuilder, MorphTarget, NodeMaterial, NodeMaterialSystemValues, Scene, SceneLoader, TextureBlock, TransformNode, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
export class LoadingScene{

    private _scene:Scene
    private _camera: ArcRotateCamera;

    constructor(scene:Scene){
        this._scene=scene
        let camera = new ArcRotateCamera('camera',Math.PI/2,1.186,10,Vector3.Zero(),this._scene)
        this._camera=camera
        this._scene.clearColor = Color4.FromInts(72, 128, 215, 255)
        this.startLoadingAnimation()



    }
    public get scene(){
        this._scene.activeCamera = this._camera
        return this._scene
    }


    async startLoadingAnimation() { //开启加载动画

        //结点编辑器材质
        let cubeLoaderMat = new NodeMaterial('cubeLoaderMat',this._scene,{ emitComments:false})

        let guiNode = new TransformNode('guiNode') //GUI的结点
        guiNode.position.y=-1


        this.setLoadingLabel(guiNode)//设置加载文本

        //加载 立方体 以及 结点材质


        await SceneLoader.AppendAsync("model/cubeLoading.glb")

        await cubeLoaderMat.loadAsync("nodeMaterial/loading.json")


        cubeLoaderMat.build(false)

       let meshes = [this._scene.getMeshByName("spinnerLeft"), this._scene.getMeshByName("spinnerCenter"), this._scene.getMeshByName("spinnerRight")];
       let meshInfluence : MorphTarget[] = []


        meshes.forEach((mesh,index) => { //设置材质 以及获取morph target

            if(mesh && mesh instanceof Mesh){ //nullable 转换成Mesh class
               mesh.material = cubeLoaderMat //设置结点材质

                if(mesh.morphTargetManager !== null){
                    meshInfluence.push(mesh.morphTargetManager.getTarget(0)) //获取变换的目标（tartget）
                }
            }
        })

        let loadingSpin = this._scene.getAnimationGroupByName('loadingSpin')!  //获取立方体的旋转动画

        this.animateInfluence( meshInfluence[0],LoadingScene.morphAnimations.leftMorph,loadingSpin,false)
        this.animateInfluence( meshInfluence[1],LoadingScene.morphAnimations.centerMorph,loadingSpin,false)
        this.animateInfluence( meshInfluence[2],LoadingScene.morphAnimations.rightMorph,loadingSpin,true)

    }

    private progressText?: TextBlock


    setLoadingLabel(guiNode:TransformNode) { //设置加载文本
         let advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('loadingGUI')

         this.progressText = new TextBlock();
         this.progressText.text = "加载中... ";
         this.progressText.fontSize = 25;
         this.progressText.color = "white";

         advancedTexture.addControl( this.progressText)
         this.progressText.linkWithMesh(guiNode)

    }

    updateProgress(progress:number,hintText?:string){
        if(this.progressText){
            if(hintText){
                // this.progressText.text=`加载中... \n ${hintText} \n ${progress}/100`
                this.progressText.text=`加载中... \n`
            }
            else{
                this.progressText.text=`加载中... `
            }
        }
    }


    animateInfluence(target:MorphTarget,keys:IAnimationKey[],group:AnimationGroup,start:boolean){
        let animation = new Animation('influenceAnimation','influence',60,Animation.ANIMATIONTYPE_FLOAT,Animation.ANIMATIONLOOPMODE_CYCLE)
        animation.setKeys(keys)
        group.addTargetedAnimation(animation, target)
        if(start){
            group.play(true)
        }
    }

    static morphAnimations={
        "leftMorph": [
            {frame: 0, value: 0},
            {frame: 20, value: 0},
            {frame: 35, value: 1},
            {frame: 115, value: 1},
            {frame: 130, value: 0},
            {frame: 400, value: 0}
        ],
        "centerMorph": [
            {frame: 0, value: 0},
            {frame: 135, value: 0},
            {frame: 150, value: 1},
            {frame: 220, value: 1},
            {frame: 235, value: 0},
            {frame: 400, value: 0}
        ],
        "rightMorph": [
            {frame: 0, value: 0},
            {frame: 250, value: 0},
            {frame: 265, value: 1},
            {frame: 335, value: 1},
            {frame: 350, value: 0},
            {frame: 400, value: 0}
        ]
    }
}

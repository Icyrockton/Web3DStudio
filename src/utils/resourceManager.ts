import { AbstractAssetTask, AssetContainer, AssetsManager, MeshAssetTask, Scene, TextureAssetTask } from "@babylonjs/core";


export class ResourceManager { //继承BabylonJS的AssetsManager
    private _assetManager:AssetsManager;
    private taskCount:number = 0;
    private loaded: number; //已经加载完成的数量
    private totoalLoadNum: number;//全部任务的数量
    public onFishedCallback: () => void  //加载完成回调
    public onProgess:(progress:number)=>void //正在加载回调 
    public meshItems:{[name:string]:MeshAssetTask} = {} //Mesh资源
    public textureItems:{[name:string] : TextureAssetTask} =  {} //Texture资源

    constructor(scene: Scene,onProgress:(progress:number)=>void, onFishedCallback: () => void) {
        // if (__DEBUG__) {
        //     console.log('Loading....');
        // }

        scene.debugLayer.show()


        this.loaded = 0;
        this.totoalLoadNum = 0;
        this.onFishedCallback = onFishedCallback //加载完成的回调函数
        this.onProgess=onProgress
        this._assetManager = new AssetsManager(scene) //资源加载
        this._assetManager.useDefaultLoadingScreen=false
        this._assetManager.onFinish = this.onFishedCallback
    }

    loadScene() { //加载场景
        this._assetManager.load() //加载
    }

    addTexutreTask(url: string){ //添加Texutre资源
        let task = this._assetManager.addTextureTask(`Task ${++this.taskCount}`, url)
        task.onSuccess=this.resourceLoadEnd //加载完毕的回调
        this.textureItems[task.name] = task
        
    }

    addMeshTask(meshResource:MeshResource) { //添加需要加载的Mesh资源
        let {meshName , rootUrl, fileName }=meshResource
        let task = this._assetManager.addMeshTask(`Task ${++this.taskCount}`, meshName, rootUrl,fileName)
        task.onSuccess=this.resourceLoadEnd //加载完毕的回调
        this.meshItems[meshName]=task //添加到meshItems中

    }

    resourceLoadEnd(task : AbstractAssetTask){
        this.loaded++
        let progress= this.loaded / this.taskCount //计算进度

        if(this.loaded == this.taskCount){ //加载完毕
            // if(__DEBUG__){
            //     console.log('加载完毕');
            // }
            this.onFishedCallback()
        }
        else{
            // if(__DEBUG__){
            //     console.log('一个task加载完毕');
            // }
            this.onProgess(progress) //调用onProgress 处理进度
        }
        
    }






}
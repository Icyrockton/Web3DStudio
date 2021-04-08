import {
    ArcRotateCamera, CascadedShadowGenerator, DirectionalLight,
    Engine, HemisphericLight, HighlightLayer,
    Scene,
    SceneLoader,
    ShadowGenerator,
    Sound,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import useBookShelfUiState from "../../components/GUI/bookShelf/bookShelfUiState";
import {Book} from "./book";

//数据的位置名称  为了寻找...transformNode
interface BookLocName {
    A_Area: string,
    B_Area: string,
    C_Area: string,
    D_Area: string,
}

//保存书籍位置
interface BookLocTransformNode {
    A_Area: TransformNode[]
    B_Area: TransformNode[]
    C_Area: TransformNode[]
    D_Area: TransformNode[]
}

export interface BookDetail {
    uuid: number //ID
    videoName: string //视频名称
    videoURL: string //视频地址
    textureImgURL: string //纹理的地址
    area: AreaType
    thickness: number  //书的厚度
}

export interface StudioBook {
    uuid: number  //工作室的UID
    books:BookDetail[] //工作室内的书
}

export interface BookSound {
    playOpenBookSound(): void

    playCloseBookSound(): void

    playClickBookSound(): void
}

export type AreaType = keyof BookLocTransformNode //每个区域的名称 作为类型


export class BookShelf implements BookSound {

    private readonly _scene: Scene;
    private _bookLocName: BookLocName = {
        A_Area: "BookLocA",
        B_Area: "BookLocB",
        C_Area: "BookLocC",
        D_Area: "BookLocD",
    }
    private _bookLocTransformNode: BookLocTransformNode = {
        A_Area: [],
        B_Area: [],
        C_Area: [],
        D_Area: [],
    }
    private _openBookSound?: Sound
    private _closeBookSound?: Sound
    private _clickBookSound?: Sound;
    private _count: Map<TransformNode, number> = new Map<TransformNode, number>() //记录当前每个槽的位置上放置的书的个数
    static readonly MAX_PLACE = 3 //最大每个槽 放3本书
    private _shadowGenerator: CascadedShadowGenerator
    private _directionalLight: DirectionalLight
    private _highLightLayer : HighlightLayer

    constructor(engine: Engine) {
        this._scene = new Scene(engine)
        this._scene.autoClear = false //关闭自动清除  作为前景
        const hemisphericLight = new HemisphericLight("bookShelfHemisphericLight", Vector3.Up(), this._scene);
        hemisphericLight.intensity = 0.6
        this._directionalLight = new DirectionalLight("bookShelfLight", new Vector3(1, -1, 1), this._scene)
        this._directionalLight.intensity = 0.7
        this._shadowGenerator = new CascadedShadowGenerator(1024, this._directionalLight) //阴影贴图
        this._shadowGenerator.stabilizeCascades = true;
        this._shadowGenerator.forceBackFacesOnly = true;
        this._shadowGenerator.shadowMaxZ = 20;
        this._shadowGenerator.autoCalcDepthBounds = true;
        this._shadowGenerator.lambda = 0.5;
        this._shadowGenerator.depthClamp = true;
        this._shadowGenerator.penumbraDarkness = 0.8;
        this._shadowGenerator.usePercentageCloserFiltering = true;
        this._shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;  //高质量阴影
        this._highLightLayer =new HighlightLayer("bookShelfHighLightLayer",this._scene)
        this.setUpSound()
        this.setUpCamera()
        this.setUpShelf()
        const bookShelfUiState = useBookShelfUiState;
        bookShelfUiState.bookShelfInstance= this
        // this._scene.debugLayer.show()
    }


    public render() {
        this._scene.render()
    }

    private setUpCamera() {

        const arcRotateCamera = new ArcRotateCamera("camera", Math.PI, Math.PI / (2.4), 3.300, new Vector3(0, 0.8, 0), this._scene);
        //arcRotateCamera.attachControl(true)   //摄像机控制
        arcRotateCamera.minZ = 0.1
        arcRotateCamera.wheelPrecision = 50
    }

    //书架模型的位置
    static readonly BOOK_SHELF_URL = "model/bookShelf.glb"

    private setUpShelf() {

        SceneLoader.ImportMesh("", BookShelf.BOOK_SHELF_URL, undefined, this._scene, (meshes, particleSystems, skeletons, animationGroups, transformNodes) => {

            meshes.forEach(mesh => {
                this._shadowGenerator.addShadowCaster(mesh) //自阴影
                mesh.receiveShadows = true//接受阴影
            })

            transformNodes.forEach(transformNode => {
                this.initCount(transformNode)

                //添加结点位置
                if (transformNode.name.startsWith(this._bookLocName.A_Area)) {
                    this._bookLocTransformNode.A_Area.push(transformNode)
                } else if (transformNode.name.startsWith(this._bookLocName.B_Area)) {
                    this._bookLocTransformNode.B_Area.push(transformNode)
                } else if (transformNode.name.startsWith(this._bookLocName.C_Area)) {
                    this._bookLocTransformNode.C_Area.push(transformNode)
                } else if (transformNode.name.startsWith(this._bookLocName.D_Area)) {
                    this._bookLocTransformNode.D_Area.push(transformNode)
                }
            })

            this.updateBookShelf()


        })
    }

    updateBookShelf(){ //更新书架上的书籍
        this.disposeAllBook()
        //放置书籍
        const bookShelfUiState = useBookShelfUiState;

        bookShelfUiState.books.forEach(book => {
            switch (book.area) {
                case "A_Area":
                    this.placeBook(book, this._bookLocTransformNode.A_Area)
                    break
                case "B_Area":
                    this.placeBook(book, this._bookLocTransformNode.B_Area)
                    break
                case "C_Area":
                    this.placeBook(book, this._bookLocTransformNode.C_Area)
                    break
                case "D_Area":
                    this.placeBook(book, this._bookLocTransformNode.D_Area)
                    break
                default:

            }
        })
    }

    private disposeAllBook(){ //dispose所有的图书
        this._bookInstances.forEach(book => book.dispose())
    }

    private _bookInstances:Book[] = []
    // shelfTransformNode 要放置的那一行
    private placeBook(book: BookDetail, shelfTransformNodes: TransformNode[]) {
        for (let i = 0; i < shelfTransformNodes.length; i++) {
            const slot = shelfTransformNodes[i]
            const hasPlacedNum = this._count.get(slot); //已经放置了多少书籍
            console.log(hasPlacedNum)
            if (hasPlacedNum != undefined && hasPlacedNum < BookShelf.MAX_PLACE) {  //可以放置
                this._count.set(slot, hasPlacedNum + 1)
                const position = new Vector3(-slot.position.x, slot.position.y, slot.position.z - 0.1 * (hasPlacedNum))  //z轴进行偏移

                const bookInstance = new Book(this._scene, book, position, this, this._shadowGenerator,this._highLightLayer);
                this._bookInstances.push(bookInstance)
                break; //停止放置
            }
        }
    }

    private initCount(node: TransformNode) {
        this._count.set(node, 0) //清空当前有的书籍
    }

    private setUpSound() { //加载声音
        this._openBookSound = new Sound("openBookSound", "sound/book/openBook.mp3", this._scene, () => {
        }, {loop: false, autoplay: false})
        this._closeBookSound = new Sound("closeBookSound", "sound/book/closeBook.mp3", this._scene, () => {
        }, {loop: false, autoplay: false})
        this._clickBookSound = new Sound("clickBookSound", "sound/book/clickBook.mp3", this._scene, () => {
        }, {loop: false, autoplay: false, volume: 0.2})
    }

    playCloseBookSound(): void {
        this._closeBookSound?.play()
    }

    playOpenBookSound(): void {
        this._openBookSound?.play()
    }

    playClickBookSound(): void {
        this._clickBookSound?.play()
    }

    //https://forum.babylonjs.com/t/two-scene-and-actionmanager-question/19712
    attachControl() {  //action manager 连接
        this._scene.attachControl()
    }

    detachControl(){ // actionManger 关闭
        this._scene.detachControl()
    }
}

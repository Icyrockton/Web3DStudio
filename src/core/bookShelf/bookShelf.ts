import {ArcRotateCamera, Engine, Scene, SceneLoader, Sound, TransformNode, Vector3} from "@babylonjs/core";
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
    uuid: string //ID
    videoName: string //视频名称
    videoURL: string //视频地址
    textureImgURL: string //纹理的地址
    area: AreaType
}
export interface BookSound{
    playOpenBookSound():void
    playCloseBookSound():void
}
export type AreaType = keyof BookLocTransformNode //每个区域的名称 作为类型


export class BookShelf implements BookSound{
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
    private _openBookSound?:Sound
    private _closeBookSound?:Sound
    private _count: Map<TransformNode, number> = new Map<TransformNode, number>() //记录当前每个槽的位置上放置的书的个数
    static readonly MAX_PLACE = 3 //最大每个槽 放3本书

    constructor(engine: Engine) {
        this._scene = new Scene(engine)
        this._scene.autoClear = false //关闭自动清除  作为前景
        this.setUpSound()
        this.setUpCamera()

        this.setUpShelf()

        this._scene.debugLayer.show()
    }


    public render() {
        this._scene.render()
    }

    private setUpCamera() {
        this._scene.createDefaultLight()
        const arcRotateCamera = new ArcRotateCamera("camera", Math.PI, Math.PI / (2.5), 2.640, new Vector3(0, 1, 0), this._scene);
        //arcRotateCamera.attachControl(true)
        arcRotateCamera.minZ =0.1
        arcRotateCamera.wheelPrecision = 50
    }

    //书架模型的位置
    static readonly BOOK_SHELF_URL = "src/assets/model/bookShelf.glb"

    private setUpShelf() {

        SceneLoader.ImportMesh("", BookShelf.BOOK_SHELF_URL, undefined, this._scene, (meshes, particleSystems, skeletons, animationGroups, transformNodes) => {

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

        })
    }

    // shelfTransformNode 要放置的那一行
    private placeBook(book: BookDetail, shelfTransformNodes: TransformNode[]) {
        console.log('开始放置书籍')
        for (let i = 0; i < shelfTransformNodes.length; i++) {
            const slot = shelfTransformNodes[i]
            const hasPlacedNum = this._count.get(slot); //已经放置了多少书籍
            console.log(hasPlacedNum)
            if (hasPlacedNum != undefined && hasPlacedNum < BookShelf.MAX_PLACE) {  //可以放置
                this._count.set(slot, hasPlacedNum + 1)
                const position = new Vector3(-slot.position.x, slot.position.y, slot.position.z - 0.1 * (hasPlacedNum))  //z轴进行偏移

                new Book(this._scene, book, position,this)
                break; //停止放置
            }
        }
    }

    private initCount(node: TransformNode) {
        this._count.set(node, 0) //清空当前有的书籍
    }

    private setUpSound() { //加载声音
        this._openBookSound=new Sound("openBookSound","src/assets/sound/book/openBook.mp3",this._scene,()=>{},{loop:false,autoplay:false})
    }

    playCloseBookSound(): void {
        this._closeBookSound?.play()
    }

    playOpenBookSound(): void {
        this._openBookSound?.play(1000)
    }


}
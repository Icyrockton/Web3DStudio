import {
    Angle,
    ArcRotateCamera, CascadedShadowGenerator, DirectionalLight,
    Engine,
    HemisphericLight, HighlightLayer,
    MeshBuilder, Ray,
    Scene,
    SceneLoader, Sound,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import useBookShelfUiState from "../../components/GUI/bookShelf/bookShelfUiState";
import usePracticeTableUiState from "../../components/GUI/practiceTable/practiceTableUiState";
import {EBook} from "./eBook";

export interface EBookDetail {
    uuid: number //ID
    bookName: string //电子书名称
    bookURL: string //电子书地址
    textureImgURL: string //纹理的地址
    thickness: number  //书的厚度
}

export interface EBookUtil {
    playOpenBookSound(): void

    playCloseBookSound(): void

    playClickBookSound(): void

    targetCameraPos(): Vector3

}


export class PracticeTable implements EBookUtil {
    private _scene: Scene;
    private _shadowGenerator: CascadedShadowGenerator
    private _highLightLayer: HighlightLayer
    private _directionalLight: DirectionalLight;
    private _camera!: ArcRotateCamera

    constructor(_engine: Engine) {
        this._scene = new Scene(_engine)
        this._scene.autoClear = false //关闭自动清除  作为前景
        //光源
        const hemisphericLight = new HemisphericLight("practiceTableHemisphericLight", Vector3.Up(), this._scene);
        hemisphericLight.intensity = 1
        this._directionalLight = new DirectionalLight("practiceTableLight", new Vector3(1, -1, 1), this._scene)
        this._directionalLight.intensity = 0.0
        //阴影
        this._shadowGenerator = new CascadedShadowGenerator(1024, this._directionalLight) //阴影贴图


        //高亮
        this._highLightLayer = new HighlightLayer("bookShelfHighLightLayer", this._scene)

        //MeshBuilder.CreateBox("box", {size: 2})
        this.setUpSound()
        this.setUpCamera()


        this.setUpPracticeTable()

        this._scene.debugLayer.show()
    }

    public render() {
        this._scene.render()
    }

    //练习台模型的位置
    static readonly Practice_Table_URL = "src/assets/model/practiceTable.glb"
    //电子书籍位置的transformNode起始名称
    static readonly EBookLocStartName = "Book"

    private _EBookLocTransformNodes: TransformNode [ ] = []
    private _count: Map<TransformNode, number> = new Map<TransformNode, number>() //记录当前每个槽的位置上放置的书的个数

    private setUpCamera() {
        const arcRotateCamera = new ArcRotateCamera("camera", -(Math.PI / 2 + Math.PI / 4), Math.PI / (2.0), 2.800, new Vector3(0, 1, 0), this._scene);
        arcRotateCamera.attachControl(true)   //摄像机控制
        arcRotateCamera.minZ = 0.1
        arcRotateCamera.lowerAlphaLimit = -(Math.PI / 2 + Math.PI / 4)
        arcRotateCamera.upperAlphaLimit = -(Math.PI / 2 + Math.PI / 4)
        arcRotateCamera.lowerBetaLimit = Math.PI / (2.0)
        arcRotateCamera.upperBetaLimit = Math.PI / (2.0)
        arcRotateCamera.wheelPrecision = 50
        this._camera = arcRotateCamera
    }

    private setUpPracticeTable() {
        SceneLoader.ImportMesh("", PracticeTable.Practice_Table_URL, undefined, this._scene, (meshes, particleSystems, skeletons, animationGroups, transformNodes) => {

            //查找书籍位置
            transformNodes.forEach(transformNode => {
                if (transformNode.name.startsWith(PracticeTable.EBookLocStartName)) {

                    this._EBookLocTransformNodes.push(transformNode)
                    this._count.set(transformNode, 0) //初始化电子书籍数量
                }
            })
            const practiceTableUiState = usePracticeTableUiState;

            //放置书籍
            practiceTableUiState.eBooks.forEach(eBook => {
                let index = -1
                //找到放置的索引号
                for (let i = 0; i < this._EBookLocTransformNodes.length; i++) {
                    const bookCount = this._count.get(this._EBookLocTransformNodes[i])!;
                    if (bookCount >= 1) {
                        continue
                    } else {
                        index = i
                        this._count.set(this._EBookLocTransformNodes[i], bookCount + 1);
                        break
                    }
                }
                if (index == -1) { //不放置了
                    return
                } else { //放置书籍
                    this.placeBook(eBook, this._EBookLocTransformNodes[index])
                }
            })


        })
    }

    private placeBook(eBook: EBookDetail, transformNode: TransformNode) {

        const position = new Vector3(-transformNode.position.x, transformNode.position.y, transformNode.position.z)
        new EBook(this._scene, eBook, position, this, this._shadowGenerator, this._highLightLayer)
    }


    private _openBookSound?: Sound
    private _closeBookSound?: Sound
    private _clickBookSound?: Sound;

    playClickBookSound(): void {
        this._clickBookSound?.play()
    }

    playCloseBookSound(): void {
        this._closeBookSound?.play()
    }

    playOpenBookSound(): void {
        this._openBookSound?.play()
    }

    targetCameraPos(): Vector3 { //返回摄像机前面一个距离的位置
        let pos = new Vector3()
        pos.copyFrom(this._camera.position)
        const direction = this._camera.target.subtract(this._camera.position).normalize();

        pos.addInPlace(direction.multiply(new Vector3(0.6, 0.6, 0.6))).subtractInPlace(new Vector3(0, 0.15, 0))

        return pos
    }


    private setUpSound() { //加载声音
        this._openBookSound = new Sound("openBookSound", "src/assets/sound/book/openBook.mp3", this._scene, () => {
        }, {loop: false, autoplay: false})
        this._closeBookSound = new Sound("closeBookSound", "src/assets/sound/book/closeBook.mp3", this._scene, () => {
        }, {loop: false, autoplay: false})
        this._clickBookSound = new Sound("clickBookSound", "src/assets/sound/book/clickBook.mp3", this._scene, () => {
        }, {loop: false, autoplay: false, volume: 0.2})
    }



}

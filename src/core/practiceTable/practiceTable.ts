import {
    Angle,
    ArcRotateCamera, CascadedShadowGenerator, Color3, DirectionalLight, DynamicTexture,
    Engine,
    HemisphericLight, HighlightLayer, Material, Mesh,
    MeshBuilder, Ray,
    Scene,
    SceneLoader, ShadowGenerator, Sound, StandardMaterial,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {
    GUI3DManager, Button3D, HolographicButton, TextBlock, MeshButton3D, StackPanel3D, AdvancedDynamicTexture, Button
    , Rectangle, StackPanel, Control
} from "@babylonjs/gui"
import useBookShelfUiState from "../../components/GUI/bookShelf/bookShelfUiState";
import usePracticeTableUiState from "../../components/GUI/practiceTable/practiceTableUiState";
import {EBook} from "./eBook";
import usePlayerUiState from "../../components/GUI/player/playerUiState";

export interface EBookDetail { //电子书详细信息
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
    private _3DGUIManager: GUI3DManager;
    private _practiceColumn?: StackPanel; //练习按钮 ...

    constructor(_engine: Engine) {
        this._scene = new Scene(_engine)
        this._scene.autoClear = false //关闭自动清除  作为前景
        //光源
        const hemisphericLight = new HemisphericLight("practiceTableHemisphericLight", Vector3.Up(), this._scene);
        hemisphericLight.intensity = 0.7
        this._directionalLight = new DirectionalLight("practiceTableLight", new Vector3(1, -2, 2), this._scene)
        this._directionalLight.position.set(0,2,-1)
        this._directionalLight.intensity = 1.0
        //阴影
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
        this._3DGUIManager = new GUI3DManager(this._scene)
        //高亮
        this._highLightLayer = new HighlightLayer("bookShelfHighLightLayer", this._scene)

        this.setUpCamera()
        this.setUpSound()


        this.setUpPracticeTable()

         // this._scene.debugLayer.show()
    }

    public render() {
        this._scene.render()
    }

    static readonly COMPUTER_POWER = "PracticeTableComputerPower"
    static readonly COMPUTER_POWER_LOC = "PracticeTableComputerPowerLoc"
    static readonly COMPUTER_SCREEN = "PracticeTableComputerScreen"
    //练习台模型的位置
    static readonly Practice_Table_URL = "model/practiceTable.glb"
    //电子书籍位置的transformNode起始名称
    static readonly EBookLocStartName = "Book"

    private _currentEBooks: EBook[] = []
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
        arcRotateCamera.upperRadiusLimit = 2.75
        arcRotateCamera.lowerRadiusLimit = 1.75
        arcRotateCamera.wheelPrecision = 50
        this._camera = arcRotateCamera
    }

    private setUpPracticeTable() {
        SceneLoader.ImportMesh("", PracticeTable.Practice_Table_URL, undefined, this._scene, (meshes, particleSystems, skeletons, animationGroups, transformNodes) => {

            let powerTransformNode: null | TransformNode = null
            //查找书籍位置
            transformNodes.forEach(transformNode => {
                if (transformNode.name.startsWith(PracticeTable.EBookLocStartName)) {

                    this._EBookLocTransformNodes.push(transformNode)
                    this._count.set(transformNode, 0) //初始化电子书籍数量
                }
                if (transformNode.name == PracticeTable.COMPUTER_POWER_LOC) {
                    powerTransformNode = transformNode
                }
            })

            //制作按钮
            meshes.forEach((mesh) => {
                //阴影
                mesh.receiveShadows =true
                this._shadowGenerator.addShadowCaster(mesh)
                if ((mesh instanceof Mesh) && mesh.name == PracticeTable.COMPUTER_POWER && powerTransformNode) {
                    this.setUpComputerPower(mesh, powerTransformNode)
                }
                if ((mesh instanceof Mesh) && mesh.name == PracticeTable.COMPUTER_SCREEN) { //电脑屏幕
                    this.setUpComputerScreen(mesh)
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
        const book = new EBook(this._scene, eBook, position, this, this._shadowGenerator, this._highLightLayer);
        this._currentEBooks.push(book)
    }

    private disposeCurrentBook() { //销毁所有书
        this._currentEBooks.forEach(book => book.dispose())
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
        this._openBookSound = new Sound("openBookSound", "sound/book/openBook.mp3", this._scene, () => {
        }, {loop: false, autoplay: false})
        this._closeBookSound = new Sound("closeBookSound", "sound/book/closeBook.mp3", this._scene, () => {
        }, {loop: false, autoplay: false})
        this._clickBookSound = new Sound("clickBookSound", "sound/book/clickBook.mp3", this._scene, () => {
        }, {loop: false, autoplay: false, volume: 0.2})
    }


    private _computerPowerOn: boolean = false

    private setUpComputerPower(mesh: Mesh, powerTransformNode: TransformNode) {
        powerTransformNode.position.multiplyInPlace(new Vector3(-1, 1, 1))
        const buttonMat = new StandardMaterial("powerButtonMat", this._scene);
        buttonMat.diffuseColor = Color3.Black()

        mesh.material = buttonMat

        const button3D = new MeshButton3D(mesh, "powerOnOff");
        const panel = new StackPanel3D();
        this._3DGUIManager.addControl(panel)
        panel.node!.position.copyFrom(powerTransformNode.position)
        panel.node!.rotation.y += Math.PI / (1.9)
        panel.addControl(button3D)

        button3D.pointerDownAnimation = () => {
            mesh.scaling.set(0.8, 0.8, 0.8)
            this._computerPowerOn = !this._computerPowerOn
            if (!this._computerPowerOn) {
                buttonMat.diffuseColor = Color3.Black()
                this._computerScreenTurnOff() //关闭显示器
            } else { //开机
                buttonMat.diffuseColor = Color3.Red()
                this._computerScreenTurnOn() //打开显示器
            }
        }
        button3D.pointerUpAnimation = () => {
            mesh.scaling.set(1, 1, 1)
        }
        button3D.pointerEnterAnimation = () => {
            buttonMat.diffuseColor = Color3.Red()
        }
        button3D.pointerOutAnimation = () => {
            if (!this._computerPowerOn)
                buttonMat.diffuseColor = Color3.Black()
        }
    }

    private _screenMatBlack: Material | null = null
    private _screenMat: Material | null = null
    private _screenMesh?: Mesh

    private _computerScreenTurnOn() {
        if (this._screenMesh && this._screenMat) {
            this._screenMesh.material = this._screenMat
        }
    }

    private _computerScreenTurnOff() {
        if (this._screenMesh && this._screenMatBlack) {
            this._screenMesh.material = this._screenMatBlack
        }
    }

    private setUpComputerScreen(mesh: Mesh) {
        this._screenMesh = mesh //屏幕的mesh
        this._screenMatBlack = mesh.material; //保存之前的纹理
        const dynamicTexture = AdvancedDynamicTexture.CreateForMesh(mesh, 1024, 1024, true, false)
        dynamicTexture.uOffset = -0.25
        dynamicTexture.uScale = 1.5
        // const dynamicTexture = new AdvancedDynamicTexture("haha", 1024, 1024, this._scene, false, undefined, true);
        const context = dynamicTexture.getContext();
        //https://forum.babylonjs.com/t/generating-new-dynamic-texture-is-inverted-upside-down/18703/8
        //context.setTransform(1, 0, 0, -1, 0, 1024) //翻转?  纹理不对...


        const topLevel = new StackPanel();
        topLevel.isVertical = true
        topLevel.height = "100%"
        topLevel.width = "100%"
        topLevel.background = "#4880D7"


        //工作室标题
        const title = new TextBlock("main", "Java工作室练习台");
        title.fontSize = "60px"
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
        title.color = "white"
        title.height = "100px"  //标题高度100px
        title.width = "100%"
        topLevel.addControl(title)
        dynamicTexture.addControl(topLevel)


        //列
        const columns = new StackPanel();
        columns.isVertical = false
        columns.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
        columns.height = "700px"
        columns.width = "1000px"
        //columns.background = "orange"
        topLevel.addControl(columns)


        //电子书籍
        const eBookColumn = new StackPanel();
        eBookColumn.isVertical = true
        eBookColumn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
        eBookColumn.width = "500px"

        const eBookTitle = new TextBlock("eBook", "电子书架");
        eBookTitle.height = "100px"
        eBookTitle.color = "white"
        eBookTitle.fontSize = "50px"
        eBookColumn.addControl(eBookTitle)
        columns.addControl(eBookColumn)

        /////////////////////

        const practiceColumn = new StackPanel();
        this._practiceColumn = practiceColumn
        practiceColumn.isVertical = true
        practiceColumn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
        practiceColumn.width = "500px"

        this.updatePracticeButton() //动态刷新练习按钮
        columns.addControl(practiceColumn)

        ///////////////////////// 添加按钮
        this.addButton("首页", eBookColumn, this.updateEBookToFirst)
        this.addButton("上一页", eBookColumn, this.updateEBookUp)
        this.addButton("下一页", eBookColumn, this.updateEBookDown)

        ///////////////////////// 提示


        this._screenMat = mesh.material //屏幕材质
        //////////////////////////
        // screenMat.diffuseTexture = dynamicTexture
        // this._screenMat = screenMat
        this._computerScreenTurnOff() //关闭显示器
    }

    public updatePracticeButton() { //刷新练习按钮
        if (this._practiceColumn) {

            //清空之前的东西
            this._practiceColumn.children.splice(0,this._practiceColumn.children.length)
            //标题
            const practiceColumn = this._practiceColumn;
            const practiceTitle = new TextBlock("practice", "练习");
            practiceTitle.height = "100px"
            practiceTitle.color = "white"
            practiceTitle.fontSize = "50px"
            practiceColumn.addControl(practiceTitle)
            //练习按钮
            const playerUiState = usePlayerUiState;
            const practiceTableUiState = usePracticeTableUiState;
            playerUiState.currentPracticeSubTask.forEach(subTask => {

                this.addButton(subTask.name, this._practiceColumn!, () => {
                    practiceTableUiState.setCurrentPractice(subTask) //设置当前正在进行的练习...
                    practiceTableUiState.setPracticeShowing(true) //显示
                })
            })
        }
    }


    private eBookGroupIndex: number = 0 //索引
    private updateEBookUp = () => {  //向上更新
        console.log('向上翻页')
        const eBooks = usePracticeTableUiState.eBooks;
        if (this.eBookGroupIndex > 0)
            this.eBookGroupIndex--
        else
            return //不更新
        this.disposeCurrentBook()
        console.log(this.eBookGroupIndex)
        for (let i = this.eBookGroupIndex * 4; i < (this.eBookGroupIndex + 1) * 4 && i < eBooks.length; i++) {
            const bookDetail = eBooks[i];
            this.placeBook(bookDetail, this._EBookLocTransformNodes[i % 4])
        }

    }
    private updateEBookDown = () => { //向下更新
        console.log('向下翻页')
        const eBooks = usePracticeTableUiState.eBooks;
        if ((this.eBookGroupIndex + 1) * 4 >= eBooks.length)
            return
        else
            this.eBookGroupIndex++
        this.disposeCurrentBook()

        console.log(this.eBookGroupIndex)

        for (let i = this.eBookGroupIndex * 4; i < (this.eBookGroupIndex + 1) * 4 && i < eBooks.length; i++) {
            const bookDetail = eBooks[i];
            this.placeBook(bookDetail, this._EBookLocTransformNodes[i % 4])
        }

    }
    private updateEBookToFirst = () => { //回到首页
        console.log('回到首页')
        if (this.eBookGroupIndex == 0)
            return
        this.disposeCurrentBook()
        this.eBookGroupIndex = 0
        const eBooks = usePracticeTableUiState.eBooks;
        console.log(this.eBookGroupIndex)
        for (let i = this.eBookGroupIndex * 4; i < (this.eBookGroupIndex + 1) * 4 && i < eBooks.length; i++) {
            const bookDetail = eBooks[i];
            this.placeBook(bookDetail, this._EBookLocTransformNodes[i % 4])
        }
    }

    private addButton(label: string, panel: StackPanel, func: () => void) {
        const button = Button.CreateSimpleButton(label, label);
        button.width = "100%"
        button.height = "100px"
        button.cornerRadius = 25
        button.color = "white"
        button.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
        button.background = "#f5af19"
        button.paddingLeft = 5
        button.paddingRight = 5
        button.paddingTop = 10
        button.fontSize = "50px"
        button.onPointerEnterObservable.add(()=>{
            button.background ="#38ef7d"
        })
        button.onPointerOutObservable.add(()=>{
            button.background ="#f5af19"
        })
        button.onPointerDownObservable.add(() => {
            func()
        })
        button.onPointerUpObservable.add(()=>{
            button.background ="#f5af19"
        })

        panel.addControl(button)

    }
}

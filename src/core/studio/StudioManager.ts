import {
    AbstractMesh, Animation, Camera,
    Color3, Color4, DefaultRenderingPipeline,
    DirectionalLight, FreeCamera,
    HemisphericLight, IAnimationKey,
    KeyboardEventTypes,
    KeyboardInfo,
    Mesh,
    Observer, PBRMaterial, RecastJSPlugin,
    RenderTargetTexture,
    Scene,
    SceneLoader,
    ShadowGenerator,
    Sound, StandardMaterial, Texture,
    TransformNode,
    Vector3, Viewport
} from "@babylonjs/core";
import {Studio} from "./Studio";
import {PlayerManager} from "../player/playerManager";
import {ReceptionistManager} from "../receptionist/receptionistManager";
import {AdvancedDynamicTexture} from "@babylonjs/gui";
import useReceptionistUiState, {ReceptionistDescription} from "../../components/GUI/receptionist/receptionistUiState";
import usePlayerUiState from "../../components/GUI/player/playerUiState";
import {DistanceHelper} from "../../utils/distanceHelper";
import {IState} from "../IState";
import {Ai} from "../ai/ai";
// @ts-ignore
import Recast from "recast-detour"
import useBookShelfUiState from "../../components/GUI/bookShelf/bookShelfUiState";
import usePracticeTableUiState from "../../components/GUI/practiceTable/practiceTableUiState";
import {Light} from "@babylonjs/core/Lights/light";
import {MINI_MAP_LAYER_MASK} from "./miniMap";
import useTaskUiState from "../../components/GUI/task/taskUiState";
import useFloorUiState from "../../components/GUI/floor/floorUiState";

interface StudioSound {
    bookShelf: Sound
    practiceTable: Sound
    enter: Sound
    select: Sound
    selectSimple: Sound
    buttonHit: Sound
}

type CurrentArea = "BookShelf" | "PracticeTable" | null

export class StudioManager {

    private _studio: Studio;
    private _scene: Scene;
    private _playerSpawn ?: TransformNode //玩家的出生点
    private _receptionistSpawn  ?: TransformNode //接待员的出生点
    static PlayerModelUrl = "model/receptionist.glb"
    static PlayerCollisionBoxWidth = 0.7
    static PlayerCollisionBoxHeight = 1.8
    static PlayerCollisionBoxDepth = 0.5
    private _playerManager!: PlayerManager;
    private _directionalLight!: DirectionalLight
    private _hemisphericLight! : HemisphericLight
    private _receptionManager!: ReceptionistManager;
    private _bookShelfMesh: Mesh[] = [] //书架
    private _practiceTableMesh: Mesh [] = [] //练习台
    private _sound!: StudioSound
    private _web3DStudio: IState;
    private _navigationPlugin = new RecastJSPlugin(new Recast())
    private _AIs: Ai[] = []

    constructor(scene: Scene, studio: Studio, web3DStudio: IState) {
        this._scene = scene;
        this._scene.clearColor = Color4.FromHexString("#6fabffff").toLinearSpace()

        this._studio = studio;
        this._web3DStudio = web3DStudio;
        this._scene.collisionsEnabled = true //打开碰撞
        const playerUiState = usePlayerUiState;
        playerUiState.setStudioManager(this) //注入

        //更新书架上的内容
        useBookShelfUiState.updateBookShelf(this._studio.uuid)
        //更新练习台的内容
        usePracticeTableUiState.updatePracticeTable(this._studio.uuid)

        useTaskUiState.currentStudioUUid  = this._studio.uuid

        setTimeout(()=>{
            useFloorUiState.setVisitStudioUiShowing(false)
            useFloorUiState.setVisitUiShowing(false)
        },3000)
    }

    async load() {
        this.setUpLight()
        this.setUpCamera()
        await this.loadModel() //加载地图模型
        await this.setUpShadow() //设置阴影
        await this.setUpPlayer() //加载玩家模型
        await this.setUpReceptionist() //加载虚拟人员模型
        this.setUpMiniMapCamera()
        this.setUpRotateCamera() //设置自动旋转相机
        this.setUpSound() //设置声音
        this.setUpBookShelf() //设置书架
        this.setUpPracticeTable() //设置练习台
        // let arcRotateCamera = new ArcRotateCamera("arc",0,0,10,Vector3.Zero(),this._scene);
        // arcRotateCamera.attachControl()
        // this._scene.activeCamera = arcRotateCamera
       this.setPostProcess()

    }
    private _pipeLine? : DefaultRenderingPipeline
    setPostProcess() {
        const pipeline = new DefaultRenderingPipeline(
            "pipeline",
            true,
            this._scene,
            this._scene.cameras
        );
        //开启测晕的效果
        pipeline.imageProcessingEnabled = true;
        pipeline.imageProcessing.vignetteEnabled = false;
        pipeline.imageProcessing.vignetteWeight = 1.5;
        pipeline.imageProcessing.vignetteColor = Color4.FromHexString("#2e80ffff")
        pipeline.imageProcessing.exposure = 1.2

        //开启抗锯齿
        pipeline.samples = 4

        //开启景深
        pipeline.depthOfFieldEnabled = true
        pipeline.depthOfField.focalLength = 180
        pipeline.depthOfField.fStop = 18
        pipeline.depthOfField.focusDistance = 4000
        this._pipeLine = pipeline
    }

    private setUpLight() {
        const hemisphericLight = new HemisphericLight("hemisphericLight", Vector3.Up(), this._scene);
        hemisphericLight.intensity = 0.5
        this._hemisphericLight = hemisphericLight
        const direction = new Vector3(this._studio.directionalLightDirection[0], this._studio.directionalLightDirection[1], this._studio.directionalLightDirection[2]);
        this._directionalLight = new DirectionalLight("directionalLight", direction, this._scene)
        this._directionalLight.position = new Vector3(this._studio.directionalLightPosition[0], this._studio.directionalLightPosition[1], this._studio.directionalLightPosition[2])
        this._directionalLight.intensity = 0.15
        this._directionalLight.lightmapMode = Light.LIGHTMAP_SHADOWSONLY
    }

    private setUpCamera() {
        this._scene.createDefaultCamera()
    }

    private async loadModel() {
        let model = await SceneLoader.ImportMeshAsync("", this._studio.modelURL, undefined, this._scene)
        let transformNodes = model.transformNodes
        let meshes = model.meshes
        //找到玩家的出生点
        this._playerSpawn = transformNodes.find(node => node.name == this._studio.playerSpawn)
        //找到接待员的出生点
        this._receptionistSpawn = transformNodes.find(node => node.name == this._studio.receptionistConfig.receptionistSpawn)

        meshes.forEach(mesh => {
            if (mesh instanceof Mesh) {
                if (mesh.name.startsWith(this._studio.bookShelfStartName)) {
                    this._bookShelfMesh.push(mesh)
                } else if (mesh.name.startsWith(this._studio.practiceTableStartName)) {
                    this._practiceTableMesh.push(mesh)
                }
            }
        })

        this.setUpCollisionBox(meshes) //设置碰撞盒子

        //小地图
        const miniMapMesh = meshes.find(mesh => mesh.name == this._studio.miniMap);
        if (miniMapMesh) {
            miniMapMesh.layerMask = MINI_MAP_LAYER_MASK
        }

    }

    private setUpCollisionBox(meshes: AbstractMesh[]) { //设置碰撞盒子
        let collisionMeshes: Mesh[] = []
        meshes.forEach(mesh => {
            if (this._studio.collisionBox.find(collision => collision == mesh.name)) {
                mesh.isVisible = false //不可见
                mesh.checkCollisions = true //碰撞检测
                if (mesh instanceof Mesh) {
                    collisionMeshes.push(mesh) //碰撞盒子
                }
            }
        })

        //设置地面为可见的
        let ground = meshes.find(mesh => mesh.name == this._studio.groundName);
        if (ground) {
            ground.isVisible = true
            if (ground instanceof Mesh) {
                collisionMeshes.push(ground) //碰撞盒子
            }
        }

        this.setUpNavMesh(collisionMeshes) //设置导航Mesh
    }

    private async setUpPlayer() { //设置玩家
        this._playerManager = new PlayerManager(this._scene, this._studio.playerModelURL);
        await this._playerManager.loadPlayer(this._studio.playerRotateYAxis)
        if (this._shadowGenerator) {
            this._playerManager.setUpShadow(this._shadowGenerator)
            this._AIs.forEach(ai => {
                ai.setUpShadow(this._shadowGenerator!)
            })
        }
        //设置玩家的位置
        if (this._playerSpawn) {
            this._playerManager.playerPosition = this._playerSpawn.position
        } else {
            console.log('没有设置玩家的起始位置')
        }
        this._AIs.forEach(ai => {
            ai.setUpWithPlayer(this._playerManager)
        })
    }

    private _shadowGenerator?: ShadowGenerator  // 阴影

    //异步->转换成promise
    private _loadLightMapTexture = () => {
        return new Promise<Texture>((resolve, reject) => {
            const lightMapTexture = new Texture(this._studio.groundLightMapUrl, this._scene);
            lightMapTexture.onLoadObservable.addOnce(() => {
                resolve(lightMapTexture)
            })
        })
    }

    private async setUpShadow() {
        const shadowGenerator = new ShadowGenerator(1024, this._directionalLight);
        shadowGenerator.usePercentageCloserFiltering = true //使用PCF阴影
        shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH //高质量
        this._shadowGenerator = shadowGenerator
        let ground = this._scene.getMeshByName(this._studio.groundName); //地面
        if (ground) {
            if ((ground.material instanceof PBRMaterial) || (ground.material instanceof StandardMaterial)) {
                const lightMapTexture = await this._loadLightMapTexture();  //等待加载lightmap
                lightMapTexture.uAng = Math.PI   // u轴旋转180°
                ground.material.lightmapTexture = lightMapTexture
            }
            ground.receiveShadows = true //地面接受阴影
        }

        //其它的mesh设置receiveShadows
        this._studio.receiveShadowName.forEach(name => {

            const mesh = this._scene.getMeshByName(name);
            if (mesh) {
                mesh.receiveShadows = true
            }

        })
    }

    private setUpRotateCamera() {
        this._playerManager.setUpRotateCamera(this._studio.rotateCamera)
    }

    private async setUpReceptionist() {
        this._receptionManager = new ReceptionistManager(this._scene, this._studio.receptionistConfig)
        usePlayerUiState.setReceptionistManager(this._receptionManager) //设置玩家的虚拟人员
        await this._receptionManager.loadReceptionist()
        //设置虚拟人员的位置
        if (this._receptionistSpawn) {
            this._receptionManager.receptionistPosition = this._receptionistSpawn.position
        }
        //旋转虚拟人员
        this._receptionManager.receptionist.setUpRotateAlongYAxis(this._studio.receptionistConfig.receptionistRotateYAxis)

        //设置虚拟人员的谈话UI
        AdvancedDynamicTexture.CreateFullscreenUI("")


        const receptionistUiState = useReceptionistUiState; //UI状态

        let description = {
            avatarURL: "img/avatar/javaReceptionistAvatar.png",
            info: "Hi~，欢迎来到北京三维学院Java工作室，我是你的培训师姐，我叫李丹",
            position: "Java架构高级工程师",
            title: "高级工程师"
        } as ReceptionistDescription

        receptionistUiState.setDescription(description)

        //设置  如果玩家在length距离以内,触发问候事件
        this._receptionManager.triggerOnceWhenDistanceLessThan(this._studio.receptionistConfig.distanceTrigger, this._playerManager, () => {
            this._receptionManager.playGreeting() //问候语
            receptionistUiState.setDescriptionShow(true)
        })

        this._receptionManager.triggerOnceWhenDistanceMoreThan(this._studio.receptionistConfig.distanceTrigger, this._playerManager, () => {
            receptionistUiState.setDescriptionShow(false)
        })


        //虚拟人员始终面向玩家
        this._scene.registerBeforeRender(() => {
            this._receptionManager.receptionist.lookAt(this._playerManager.playerPosition)
        })

        if (this._shadowGenerator) {
            this._receptionManager.setUpShadow(this._shadowGenerator)
        }

    }

    //高亮
    private _highlightBookShelf: boolean = false
    private _highlightPracticeTable: boolean = false

    public setHighLightBookShelf(highLight: boolean) {
        this._highlightBookShelf = highLight
    }

    public setHighlightPracticeTable(highLight: boolean) {
        this._highlightPracticeTable = highLight;
    }

    public turnOffAllHighLight() {//关闭所有highlight
        this._highlightBookShelf = false
        this._highlightPracticeTable = false
    }

    //
    private _currentArea: CurrentArea = null //当前所在区域 为了键盘事件
    private _bookShelfAreaHint = true //书架位置提示 只显示一次
    private _practiceTableAreaHint = true //书架位置提示 只显示一次

    private setUpBookShelf() {

        this._bookShelfMesh.forEach(bookShelf => {
            bookShelf.renderOutline = false
            const sourceColor = Color3.FromHexString("#ED213A")
            const targetColor = Color3.FromHexString("#93291E")
            bookShelf.outlineColor = sourceColor


            bookShelf.outlineWidth = 3
            let up = true
            let down = false
            //边框动画
            this._scene.registerBeforeRender(() => {
                //高亮书架
                if (this._highlightBookShelf) {
                    bookShelf.renderOutline = true //打开渲染边框
                    if (up) { //向target进行过渡
                        bookShelf.outlineWidth += 0.05
                        bookShelf.outlineColor = Color3.Lerp(bookShelf.outlineColor, targetColor, 0.02)
                        if (bookShelf.outlineWidth > 5) {
                            up = false
                            down = true
                        }
                    }
                    if (down) { //向source进行过渡
                        bookShelf.outlineColor = Color3.Lerp(bookShelf.outlineColor, sourceColor, 0.02)

                        bookShelf.outlineWidth -= 0.05
                        if (bookShelf.outlineWidth < 3) {
                            up = true
                            down = false
                        }
                    }
                } else {
                    bookShelf.renderOutline = false
                }
            })


            //距离按键。。进入
            const playerUiState = usePlayerUiState;

            const distanceHelper = new DistanceHelper(this._scene, bookShelf, this._playerManager);

            distanceHelper.triggerOnceWhenDistanceLessThan(2, () => {
                this._currentArea = "BookShelf" //当前所在位置为 图书架
                if (!this._playerManager.busy && this._bookShelfAreaHint) {
                    playerUiState.setDialogShowing(true) //打开对话框
                    this._playerManager.busy = true
                    if (!this._sound.bookShelf.isPlaying) {
                        this._sound.bookShelf.play()//播放一次
                        this._sound.bookShelf.onEndedObservable.add(() => {
                        })
                    }
                    playerUiState.setDialogInfo({
                        avatarURL: this._studio.playerAvatarURL,
                        title: "视频图书架",
                        info: "这里是Java工作室的电子视频图书架,按E键可以打开书架"
                    })
                    this._bookShelfAreaHint = false
                }
                this._playerManager.showBookShelfHint()
                //注册键盘的监听器
                if (!this.keyBoardObserver) {
                    this.keyBoardObserver = this._scene.onKeyboardObservable.add(this.keyboardEventHandler)
                }

            })

            distanceHelper.triggerOnceWhenDistanceMoreThan(2, () => {
                this._currentArea = null //设置位置为null
                playerUiState.setDialogShowing(false) //关闭对话框
                this._playerManager.busy = false
                this._playerManager.hideHintSprite()
                if (this.keyBoardObserver) { //如果走出了这个范围的话 清除键盘的监听器
                    this._scene.onKeyboardObservable.remove(this.keyBoardObserver) //清除这个监听器
                    this.keyBoardObserver = null
                }
            })
        })

    }


    private keyBoardObserver: Observer<KeyboardInfo> | null | undefined
    private keyboardEventHandler = (kbInfo: KeyboardInfo) => {
        switch (kbInfo.type) {
            case KeyboardEventTypes.KEYDOWN:
                switch (kbInfo.event.key) {
                    case 'E':
                    case "e":
                        if (this._currentArea == "BookShelf") {
                            const bookShelfUiState = useBookShelfUiState;
                            bookShelfUiState.playerManager = this._playerManager
                            this._web3DStudio.setBookShelfShow(true)
                            this._playerManager.busy = true //忙碌
                            this.clearAIState()
                        } else if (this._currentArea == "PracticeTable") {
                            const practiceTableUiState = usePracticeTableUiState;
                            practiceTableUiState.playerManager = this._playerManager
                            this._web3DStudio.setPracticeTableShow(true)
                            this._playerManager.busy = true //忙碌
                            this.clearAIState()
                        }
                }
        }
    }


    private setUpSound() {
        const bookShelf = new Sound("", "sound/bookShelf.mp3", this._scene, () => {
        }, {loop: false, autoplay: false});

        const practiceTable = new Sound("", "sound/practiceTable.mp3", this._scene, () => {
        }, {loop: false, autoplay: false});

        const enter = new Sound("enterSound", "/sound/college/enter.mp3", this._scene, null, {
            loop: false,
            autoplay: false
        })
        const floorSelect = new Sound("floorSelectSound", "/sound/college/floorSelect.mp3", this._scene, null, {
            loop: false,
            autoplay: false
        })
        const floorSelectSimple = new Sound("floorSelectSimpleSound", "/sound/college/floorSelectSimple.mp3", this._scene, null, {
            loop: false,
            autoplay: false
        })
        const buttonHit = new Sound("buttonHitSound", "/sound/college/buttonHitSound.mp3", this._scene, null, {
            loop: false,
            autoplay: false
        })

        this._sound = {
            bookShelf: bookShelf,
            practiceTable: practiceTable,
            enter: enter,
            select: floorSelect,
            selectSimple: floorSelectSimple,
            buttonHit: buttonHit
        } as StudioSound
    }

    playEnterSound() {
        if (!this._sound.enter.isPlaying) {
            this._sound.enter.play()
        }
    }

    playSelectSound() {
        this._sound.select.play()
    }


    playSelectSimpleSound() {
        this._sound.selectSimple.play()
    }

    playButtonHitSound() {
        if (!this._sound.buttonHit.isPlaying)
            this._sound.buttonHit.play()
    }


    private setUpPracticeTable() {
        this._practiceTableMesh.forEach(mesh => {
            mesh.renderOutline = false
            const sourceColor = Color3.FromHexString("#ED213A")
            const targetColor = Color3.FromHexString("#93291E")
            mesh.outlineColor = sourceColor
            mesh.outlineWidth = 1
            let up = true
            let down = false
            //边框动画
            this._scene.registerBeforeRender(() => {
                //高亮书架
                if (this._highlightPracticeTable) {
                    mesh.renderOutline = true //打开渲染边框
                    if (up) { //向target进行过渡
                        mesh.outlineWidth += 0.05
                        mesh.outlineColor = Color3.Lerp(mesh.outlineColor, targetColor, 0.02)
                        if (mesh.outlineWidth > 3) {
                            up = false
                            down = true
                        }
                    }
                    if (down) { //向source进行过渡
                        mesh.outlineColor = Color3.Lerp(mesh.outlineColor, sourceColor, 0.02)

                        mesh.outlineWidth -= 0.05
                        if (mesh.outlineWidth < 1) {
                            up = true
                            down = false
                        }
                    }
                } else {
                    mesh.renderOutline = false
                }
            })


            //距离按键。。进入
            const playerUiState = usePlayerUiState;

            if (mesh.name == this._studio.practiceTableStartName) {
                const distanceHelper = new DistanceHelper(this._scene, mesh, this._playerManager);

                distanceHelper.triggerOnceWhenDistanceLessThan(2, () => {

                    this._currentArea = "PracticeTable" //当前所在位置为 练习台
                    if (!this._playerManager.busy && this._practiceTableAreaHint) {
                        this._playerManager.busy = true
                        playerUiState.setDialogShowing(true) //打开对话框
                        if (!this._sound.practiceTable.isPlaying) {
                            this._sound.practiceTable.play()//播放一次
                            this._sound.practiceTable.onEndedObservable.add(() => {
                            })
                        }
                        playerUiState.setDialogInfo({
                            avatarURL: this._studio.playerAvatarURL,
                            title: "课后练习台",
                            info: "这里是Java工作室的课后练习台,按E键可以打开练习台"
                        })
                        this._practiceTableAreaHint = false
                    }
                    this._playerManager.showPracticeTableHint()
                    //注册键盘的监听器
                    if (!this.keyBoardObserver) {
                        this.keyBoardObserver = this._scene.onKeyboardObservable.add(this.keyboardEventHandler)
                    }

                })

                distanceHelper.triggerOnceWhenDistanceMoreThan(2, () => {
                    this._currentArea = null //设置位置为null
                    playerUiState.setDialogShowing(false) //关闭对话框
                    this._playerManager.hideHintSprite()
                    this._playerManager.busy = false
                    if (this.keyBoardObserver) { //如果走出了这个范围的话 清除键盘的监听器
                        this._scene.onKeyboardObservable.remove(this.keyBoardObserver) //清除这个监听器
                        this.keyBoardObserver = null
                    }
                })
            }
        })

    }

    private setUpNavMesh(collisionMeshes: Mesh[]) {
        const parameters = {
            cs: 0.2,
            ch: 0.01,
            walkableSlopeAngle: 10,
            walkableHeight: 1,
            walkableClimb: 0.0,
            walkableRadius: 1,
            maxEdgeLen: 12.,
            maxSimplificationError: 1.3,
            minRegionArea: 8,
            mergeRegionArea: 20,
            maxVertsPerPoly: 6,
            detailSampleDist: 6,
            detailSampleMaxError: 1,
        };
        const navigationPlugin = this._navigationPlugin;
        navigationPlugin.createNavMesh(collisionMeshes, parameters)

        // const navMeshDebug = navigationPlugin.createDebugNavMesh(this._scene);
        // const material = new StandardMaterial("navMeshMat", this._scene);
        // material.diffuseColor = Color3.Green()
        // material.alpha = 0.2
        // navMeshDebug.material = material
        // debug Mesh
        const crowd = navigationPlugin.createCrowd(this._studio.studioAIs.length, 0.5, this._scene);

        //创建AI
        this._studio.studioAIs.forEach(studioAI => {
            const ai = new Ai(this._scene, studioAI, crowd, navigationPlugin);
            this._AIs.push(ai)
        })

    }

    private clearAIState() {
        this._AIs.forEach(ai => {
            ai.clearAIState()
        })
    }

    private _miniMapCamera?: FreeCamera

    private setUpMiniMapCamera() {
        const miniMapCamera = new FreeCamera("miniMapCamera", new Vector3(0, 10, 0), this._scene);
        miniMapCamera.target = new Vector3(0, 0, 0)
        miniMapCamera.viewport = new Viewport(0.01, 0.71, 0.14, 0.28)
        miniMapCamera.layerMask = MINI_MAP_LAYER_MASK
        miniMapCamera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        miniMapCamera.orthoBottom = -7.5;
        miniMapCamera.orthoTop = 7.5;
        miniMapCamera.orthoLeft = -7.5;
        miniMapCamera.orthoRight = 7.5;
        this._miniMapCamera = miniMapCamera
        this._scene.registerBeforeRender(() => {
            miniMapCamera.position.set(this._playerManager.playerPosition.x, 10, this._playerManager.playerPosition.z)
        })
        this._scene.activeCameras?.push(miniMapCamera)
        // window.addEventListener('keydown', ev => {
        //     if (ev.keyCode == 81) {
        //       this.startFireWork()
        //     }
        // })
    }

    setPlayerBusy(busy: boolean) {
        this._playerManager.busy = busy
    }


    clearPlayerState() {  //该方法用来清除玩家与AI的对话状态  并将玩家置位忙状态
        this._playerManager.busy = true
        usePlayerUiState.setDialogShowing(false)
        this._AIs.forEach(ai => {
            ai.clearAIState()
        })
    }

    startFireWork(){ //开启烟花的场景

        this._playerManager.busy = true
        this._playerManager.player.blockInput()   //暂停输入
        //阳光变黑
        this._playerManager.startFireWork()  //开始烟花
        this._scene.beginDirectAnimation(this._hemisphericLight,this.createLightDarkAnim(true),0,StudioManager.frame_rate,false,1,()=>{

            this._playerManager.player.cameraRotateOneRound(()=>{
                usePlayerUiState.setScoreInfoShowing(true)
            }) //围绕一圈
        })
    }

    afterFireWork(){ //关闭烟花的场景

        this._playerManager.player.acceptInput() //接受输入
        this._playerManager.busy = false
        //阳光变亮
        this._scene.beginDirectAnimation(this._hemisphericLight,this.createLightDarkAnim(false),0,StudioManager.frame_rate,false,2,()=>{

        })
    }


    private _vagued:boolean =false

    startVague(vague:boolean ){ //模糊？
        if (vague != this._vagued) {
            this._vagued = vague;
            this._scene.beginDirectAnimation(this._pipeLine, this.createDepthOfLensAnim(vague), 0, StudioManager.frame_rate, false, 1, () => {

            })
        }
    }


    private createLightDarkAnim( dark : boolean = true){  //太阳光减弱 为了烟花效果
        const intensityAnimation = new Animation("intensityAnimation", "intensity",StudioManager.frame_rate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const intensityKeyFrames: IAnimationKey [] = []
        intensityKeyFrames.push({
            frame: 0,
            value : dark ? 0.5 : 0.1
        })
        intensityKeyFrames.push({
            frame:StudioManager.frame_rate,
            value : dark ? 0.1 : 0.5
        })
        intensityAnimation.setKeys(intensityKeyFrames)
        return [intensityAnimation]

    }


    private createDepthOfLensAnim(vague : boolean = false ){ // 模糊?
        this._pipeLine?.depthOfField.focusDistance
        const animation = new Animation("lensAnim","depthOfField.focusDistance",StudioManager.frame_rate,Animation.ANIMATIONTYPE_FLOAT,Animation.ANIMATIONLOOPMODE_CONSTANT)
        const animationKeyframe:IAnimationKey[ ] = []

        if (vague){
            animationKeyframe.push({
                frame:0,
                value : this._pipeLine?.depthOfField.focusDistance
            })
            animationKeyframe.push({
                frame:10,
                value:1500
            })
            animationKeyframe.push({
                frame:StudioManager.frame_rate,
                value:500
            })
        }
        else{
            animationKeyframe.push({
                frame:0,
                value : 500
            })
            animationKeyframe.push({
                frame:50,
                value:1500
            })
            animationKeyframe.push({
                frame:StudioManager.frame_rate,
                value:4000
            })
        }

        animation.setKeys(animationKeyframe)
        return [animation]
    }

    static readonly frame_rate = 60
}

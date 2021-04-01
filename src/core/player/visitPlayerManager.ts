import {
    AbstractMesh,
    ActionManager, Animation, Color3, CubicEase, EasingFunction, ExecuteCodeAction, IAnimationKey,
    Matrix,
    Mesh,
    MeshBuilder,
    Scene,
    SceneLoader, ShadowGenerator, StandardMaterial, Texture, TransformNode,
    Vector3, VideoTexture
} from "@babylonjs/core";
import { PlayerAssets} from "./player";
import {PlayerManager} from "./playerManager";
import {VisitPlayer} from "./visitPlayer";
import { Update} from "../college/collegeManager";
import {CollegeFloor} from "../college/collegeFloor";
import useFloorUiState from "../../components/GUI/floor/floorUiState";

export interface BillBoard {
    playingBillBoard: Mesh
    infoBillBoard: Mesh
}

export class VisitPlayerManager {
    static readonly TV_MODEL_URL = "model/tv.glb"

    private _scene: Scene;
    private _playerModelURL: string;
    public player!: VisitPlayer;

    private _collisionBox!: AbstractMesh
    private _arrowModelURL: string;
    public _visitStudioIndex: number = 0 //访问的工作室索引值
    public floorTotalStudioNum: number = 0;
    private _billBoard?: BillBoard
    private _tvRoot?: Mesh
    private _tvShow: boolean = false
    private _tvAnimating: boolean = false //动画执行中
    private _update: Update

    constructor(scene: Scene, update: Update, playerModelURL: string, arrowModelURL: string) {
        this._scene = scene;
        this._playerModelURL = playerModelURL;
        this._arrowModelURL = arrowModelURL;
        this._scene.registerBeforeRender(() => {
            this._time += 0.01
        })
        this._update = update
    }

    async loadPlayer() {

        let playerImport = await SceneLoader.ImportMeshAsync("", this._playerModelURL, undefined, this._scene)
        playerImport.meshes.forEach(mesh => {
            mesh.isPickable = false //全部设置为不可拾取
        })
        //创建碰撞盒子
        let collisionBox = MeshBuilder.CreateBox("playerCollisionBox", {
            width: PlayerManager.PlayerCollisionBoxWidth,
            height: PlayerManager.PlayerCollisionBoxHeight,
            depth: PlayerManager.PlayerCollisionBoxDepth
        });
        collisionBox.bakeTransformIntoVertices(Matrix.Translation(0, PlayerManager.PlayerCollisionBoxHeight / 2, 0))
        collisionBox.isVisible = false //不可见
        collisionBox.isPickable = false //不可拾取
        collisionBox.checkCollisions = true //检查碰撞
        //碰撞的椭球体
        //https://doc.babylonjs.com/divingDeeper/cameras/camera_collisions
        collisionBox.ellipsoid = new Vector3(PlayerManager.PlayerCollisionBoxWidth / 2, PlayerManager.PlayerCollisionBoxHeight / 2, PlayerManager.PlayerCollisionBoxDepth / 2)
        //现在玩家的原点位于(0,0,0)的位置 原始的碰撞椭球体的中心与玩家的原点重合 我们需要将碰撞椭球体沿y轴向上移动 移动到玩家的中心
        collisionBox.ellipsoidOffset = new Vector3(0, PlayerManager.PlayerCollisionBoxHeight / 2, 0)

        // collisionBox.rotationQuaternion = new Quaternion(0, 0, 0, 0)
        this._collisionBox = collisionBox
        let playerAssets = {
            collisionBox: collisionBox,
            animationGroups: playerImport.animationGroups
        } as PlayerAssets

        let playerMesh = playerImport.meshes[0]; //Player的模型对象
        playerMesh.parent = collisionBox
        playerMesh.isPickable = false

        let player = new VisitPlayer(playerAssets, this._scene);
        this.player = player

        //加载箭头
        let arrowImport = await SceneLoader.ImportMeshAsync("", this._arrowModelURL, undefined, this._scene)
        arrowImport.meshes.forEach(mesh => {
            if (mesh instanceof Mesh) {
                switch (mesh.name) {
                    case VisitPlayerManager.UP_ARROW:
                        this._upArrow = mesh
                        mesh.isVisible = false //不可见
                        break
                    case VisitPlayerManager.DOWN_ARROW:
                        this._downArrow = mesh
                        mesh.isVisible = false //不可见
                        break
                    case VisitPlayerManager.LEFT_ARROW:
                        this._leftArrow = mesh
                        mesh.isVisible = false //不可见
                        break
                    case VisitPlayerManager.RIGHT_ARROW:
                        this._rightArrow = mesh
                        mesh.isVisible = false //不可见
                        break
                    case VisitPlayerManager.LEFT_RETURN_ARROW:
                        this._leftReturnArrow = mesh
                        mesh.isVisible = false
                        break
                    case VisitPlayerManager.RIGHT_RETURN_ARROW:
                        this._rightReturnArrow = mesh
                        mesh.isVisible = false
                        break
                }
            }
        })
        if (this._upArrow && this._downArrow && this._leftArrow && this._rightArrow && this._leftReturnArrow && this._rightReturnArrow) {
            this.player.insertArrow(this._upArrow, this._downArrow, this._leftArrow, this._rightArrow, this._leftReturnArrow, this._rightReturnArrow)
        }

        //导入TV
        let tvImport = await SceneLoader.ImportMeshAsync("", VisitPlayerManager.TV_MODEL_URL, undefined, this._scene)
        this._tvRoot = tvImport.meshes[0] as Mesh
        this.setUpTV()
        this.setUpHint()
        //设置箭头的点击事件
        this.setUpArrowAction()
    }

    private _tvVideoTexture?: VideoTexture

    setUpTV() {
        if (this._tvRoot) {

            this._tvRoot.parent = this._collisionBox
            this._tvRoot.position.set(0, 0, 2)

            //找到TV的屏幕
            const tvScreen = this._tvRoot.getChildMeshes().find(mesh => mesh.name == "tv_screen");
            if (tvScreen) {
                const material = new StandardMaterial("screenMat", this._scene);
                const videoTexture = new VideoTexture("videoTexture", "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", this._scene);
                videoTexture.uAng = Math.PI // 旋转180°
                videoTexture.video.pause() //暂停播放视频
                this._tvVideoTexture = videoTexture
                material.diffuseTexture = videoTexture
                material.roughness = 1
                material.emissiveColor = Color3.White()
                tvScreen.material = material
                this._tvRoot.isVisible = false
            }


            const closeBillBoard = MeshBuilder.CreatePlane("closeBillBoard", {size: 0.3}, this._scene)
            closeBillBoard.billboardMode = AbstractMesh.BILLBOARDMODE_ALL
            closeBillBoard.parent = this._tvRoot
            closeBillBoard.position.set(0, 0, 2)

            //关闭按钮按键
            const closeTexture = new Texture("img/sprite/close.png", this._scene);
            closeTexture.hasAlpha = true

            const closeHoverTexture = new Texture("img/sprite/closeHover.png", this._scene);
            closeHoverTexture.hasAlpha = true

            const closeMat = new StandardMaterial("closeBillBoardMat", this._scene);
            closeMat.diffuseTexture = closeTexture
            closeMat.backFaceCulling = false
            closeMat.diffuseTexture.hasAlpha = true
            closeBillBoard.material = closeMat

            closeBillBoard.actionManager = new ActionManager(this._scene)
            closeBillBoard.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                (<StandardMaterial>closeBillBoard.material).diffuseTexture = closeHoverTexture;
                this.billboardAnim(closeBillBoard, true)
                useFloorUiState.collegeManager?.playFloorSelectSound()

            }))
            closeBillBoard.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                (<StandardMaterial>closeBillBoard.material).diffuseTexture = closeTexture
                this.billboardAnim(closeBillBoard, false)

            }))
            closeBillBoard.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickDownTrigger, () => {
                if (!this._tvAnimating) {
                    this.hideTV()
                    useFloorUiState.collegeManager?.playButtonHitSound()
                }
            }))
        }
    }

    public updateTvVideoURL(url: string) { //更换videotexture的视频地址
        if (this._tvVideoTexture) {
            this._tvVideoTexture.video.src = url
            this._tvVideoTexture.video.pause() //更改URL会自动播放 需要暂停....
        }
    }

    private showTV() {
        this.showTVMeshes()
        this._tvAnimating = true
        useFloorUiState.setVisitStudioUiShowing(false)
        this._scene.beginDirectAnimation(this._tvRoot, this.createShowTVAnim(), 0, CollegeFloor.frameRate, false, 1, () => {
            this._tvShow = true
            this._tvAnimating = false
            this.playVideo()
        })
    }

    private hideTV() {
        this._tvAnimating = true
        this.pauseVideo()
        this._scene.beginDirectAnimation(this._tvRoot, this.createHideTVAnim(), 0, CollegeFloor.frameRate, false, 1, () => {
            this.hideTVMeshes()
            this._tvShow = false
            this._tvAnimating = false
            useFloorUiState.setVisitStudioUiShowing(true)
        })
    }

    private hideTVMeshes() { //隐藏TV
        if (this._tvRoot) {
            this._tvRoot.getChildMeshes().forEach(mesh => {
                mesh.isVisible = false
            })
        }
    }

    private showTVMeshes() { //显示TV
        if (this._tvRoot) {
            this._tvRoot.getChildMeshes().forEach(mesh => {
                console.log(mesh)
                mesh.isVisible = true
            })
        }
    }

    private playVideo() {
        if (this._tvVideoTexture) {
            this._tvVideoTexture.video.play()
        }
    }

    private pauseVideo() {
        if (this._tvVideoTexture) {
            this._tvVideoTexture.video.pause()
        }
    }

    private createShowTVAnim() { //显示TV
        //移动Y
        const tvAnimation = new Animation("tvAnimation", "position.y", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const tvKeyFrames: IAnimationKey [] = []
        tvKeyFrames.push({
            frame: 0,
            value: 5
        })

        tvKeyFrames.push({
            frame: CollegeFloor.frameRate,
            value: 1
        })

        tvAnimation.setKeys(tvKeyFrames)
        return [tvAnimation]
    }

    private createHideTVAnim() { //隐藏TV
        //移动Y
        const tvAnimation = new Animation("tvAnimation", "position.y", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const tvKeyFrames: IAnimationKey [] = []
        tvKeyFrames.push({
            frame: 0,
            value: 1
        })

        tvKeyFrames.push({
            frame: CollegeFloor.frameRate,
            value: 5
        })

        tvAnimation.setKeys(tvKeyFrames)
        return [tvAnimation]
    }


    setUpHint() {
        const node = new TransformNode("billboard", this._scene);
        node.parent = this._collisionBox
        const playingBillBoard = MeshBuilder.CreatePlane("playingBillBoard", {size: 0.5}, this._scene)
        const infoBillBoard = MeshBuilder.CreatePlane("infoBillBoard", {size: 0.5}, this._scene)

        playingBillBoard.billboardMode = AbstractMesh.BILLBOARDMODE_ALL
        infoBillBoard.billboardMode = AbstractMesh.BILLBOARDMODE_ALL

        playingBillBoard.parent = node
        infoBillBoard.parent = node

        playingBillBoard.position.set(1, 0.5, 2)
        infoBillBoard.position.set(-1, 0.5, 2)

        //播放键
        const playTexture = new Texture("img/sprite/play.png", this._scene);
        playTexture.hasAlpha = true
        //播放键悬浮贴图
        const playHoverTexture = new Texture("img/sprite/playHover.png", this._scene);
        playHoverTexture.hasAlpha = true


        const playingMat = new StandardMaterial("playingBillBoardMat", this._scene);
        playingMat.diffuseTexture = playTexture
        playingMat.backFaceCulling = false
        playingMat.diffuseTexture.hasAlpha = true
        playingBillBoard.material = playingMat

        const infoMat = new StandardMaterial("infoBillBoardMat", this._scene);
        infoMat.diffuseTexture = new Texture("img/sprite/info.png", this._scene)
        infoMat.backFaceCulling = false
        infoMat.diffuseTexture.hasAlpha = true
        infoBillBoard.material = infoMat

        playingBillBoard.isVisible = false
        infoBillBoard.isVisible = false

        this._billBoard = {
            playingBillBoard: playingBillBoard,
            infoBillBoard: infoBillBoard
        } as BillBoard

        playingBillBoard.actionManager = new ActionManager(this._scene)
        playingBillBoard.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
            (<StandardMaterial>playingBillBoard.material).diffuseTexture = playHoverTexture;
            this.billboardAnim(playingBillBoard, true)
            useFloorUiState.collegeManager?.playFloorSelectSound()
        }))
        playingBillBoard.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
            (<StandardMaterial>playingBillBoard.material).diffuseTexture = playTexture
            this.billboardAnim(playingBillBoard, false)
        }))
        //播放视频
        playingBillBoard.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickDownTrigger, () => {
            if (!this._tvAnimating) {
                useFloorUiState.collegeManager?.playButtonHitSound()
                if (!this._tvShow) {
                    this.showTV()
                } else {
                    this.hideTV()
                }
            }
        }))

        infoBillBoard.actionManager = new ActionManager(this._scene)
        infoBillBoard.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
            this.billboardAnim(infoBillBoard, true)
            useFloorUiState.collegeManager?.playFloorSelectSound()
            useFloorUiState.setStudioInfoShowing(true) //显示UI
        }))
        infoBillBoard.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
            this.billboardAnim(infoBillBoard, false)
            useFloorUiState.setStudioInfoShowing(false) //隐藏UI
        }))


        this.billboardFloatAnim(infoBillBoard)
        this.billboardFloatAnim(playingBillBoard)
    }

    private _time: number = 0

    private billboardFloatAnim(billboard: Mesh) {
        const originY = billboard.position.y

        this._scene.registerBeforeRender(() => {
            billboard.position.y = originY + Math.sin(this._time) * 0.04
        })
    }

    private createBillboardFloatAnim(billboard: Mesh) {
        const floatAnimation = new Animation("floatAnimation", "position.y", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const floatKeyFrames: IAnimationKey [] = []
        floatKeyFrames.push({
            frame: 0,
            value: billboard.position.y
        })

        floatKeyFrames.push({
            frame: CollegeFloor.frameRate,
            value: billboard.position.y - 0.5
        })

        floatKeyFrames.push({
            frame: CollegeFloor.frameRate * 2,
            value: billboard.position.y
        })

        floatAnimation.setKeys(floatKeyFrames)
        return [floatAnimation]
    }

    private billboardAnim(billboard: Mesh, hover: boolean) {
        if (hover) {
            this._scene.beginDirectAnimation(billboard, this.createBillboardLargeAnim(billboard), 0, CollegeFloor.frameRate / 4)
        } else {
            this._scene.beginDirectAnimation(billboard, this.createBillboardSmallAnim(billboard), 0, CollegeFloor.frameRate / 4)
        }
    }

    private createBillboardLargeAnim(billboard: Mesh) {
        const scaleAnimation = new Animation("scaleAnimation", "scaling", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const scaleKeyFrames: IAnimationKey [] = []

        scaleKeyFrames.push({
            frame: 0,
            value: billboard.scaling.clone()
        })

        scaleKeyFrames.push({
            frame: CollegeFloor.frameRate / 4,
            value: new Vector3(1.2, 1.2, 1.2)
        })
        const cubicEase = new CubicEase();
        cubicEase.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
        scaleAnimation.setEasingFunction(cubicEase)
        scaleAnimation.setKeys(scaleKeyFrames)
        return [scaleAnimation]
    }

    private createBillboardSmallAnim(billboard: Mesh) {
        const scaleAnimation = new Animation("scaleAnimation", "scaling", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const scaleKeyFrames: IAnimationKey [] = []

        scaleKeyFrames.push({
            frame: 0,
            value: billboard.scaling.clone()
        })

        scaleKeyFrames.push({
            frame: CollegeFloor.frameRate / 4,
            value: new Vector3(1, 1, 1)
        })

        const cubicEase = new CubicEase();
        cubicEase.setEasingMode(EasingFunction.EASINGMODE_EASEIN)
        scaleAnimation.setEasingFunction(cubicEase)
        scaleAnimation.setKeys(scaleKeyFrames)
        return [scaleAnimation]
    }

    private _upArrow?: Mesh
    private _downArrow?: Mesh
    private _leftArrow?: Mesh
    private _rightArrow?: Mesh
    private _leftReturnArrow?: Mesh
    private _rightReturnArrow?: Mesh
    static readonly UP_ARROW = "upArrow"
    static readonly DOWN_ARROW = "downArrow"
    static readonly LEFT_ARROW = "leftArrow"
    static readonly RIGHT_ARROW = "rightArrow"
    static readonly LEFT_RETURN_ARROW = "leftReturnArrow"
    static readonly RIGHT_RETURN_ARROW = "rightReturnArrow"

    private _currentLoc: number = 0 //当前所在的位置

    public placePlayerAtFloor(floorNum: number) { //放置player在某层楼上
        const y = (floorNum - 1) * CollegeFloor.HEIGHT  // y方向上的位置
        this._currentLoc = 0 //复位
        this._collisionBox.rotation.set(0, 0, 0)
        this._collisionBox.position.set(0, y, 0) //设置位置
        this.player.reset() //重置相机,,,其它参数
    }

    public invisible() { //将玩家隐藏
        const meshes = this._collisionBox.getChildMeshes();
        meshes.forEach(mesh => {
            mesh.isVisible = false //包括billboard也不显示...
        })
    }

    public visible() { //将玩家显示
        const meshes = this._collisionBox.getChildMeshes();
        meshes.forEach(mesh => {
            if (mesh.name.endsWith("BillBoard")) { //billboard不显示
                return
            }
            if (mesh == this._tvRoot)
                return;
            mesh.isVisible = true
        })
        this.hideAllArrow()
        this.showArrow()
        this.hideTVMeshes()
    }

    public turnOnCamera() {
        this._scene.activeCamera = this.player.camera
    }

    private setUpArrowAction() {
        if (this._upArrow) {
            this._upArrow.actionManager = new ActionManager(this._scene)
            this._upArrow.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickDownTrigger, () => {
                    //this._upArrow!.position.y -= 0.05
                    this.goForward()
                }
            ))
            this._upArrow.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickUpTrigger, () => {
                    //this._upArrow!.position.y += 0.05

                }
            ))
        }

        if (this._downArrow) {
            this._downArrow.actionManager = new ActionManager(this._scene)
            this._downArrow.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickDownTrigger, () => {
                    //this._downArrow!.position.y -= 0.05
                    this.goBackward()
                }
            ))
            this._downArrow.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickUpTrigger, () => {
                    //this._downArrow!.position.y += 0.05

                }
            ))
        }

        if (this._leftArrow) {
            this._leftArrow.actionManager = new ActionManager(this._scene)
            this._leftArrow.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickDownTrigger, () => {
                    //this._leftArrow!.position.y -= 0.05
                    this.goLeft()
                }
            ))
            this._leftArrow.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickUpTrigger, () => {
                    //this._leftArrow!.position.y += 0.05

                }
            ))
        }
        if (this._rightArrow) {
            this._rightArrow.actionManager = new ActionManager(this._scene)
            this._rightArrow.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickDownTrigger, () => {
                    //this._rightArrow!.position.y -= 0.05
                    this.goRight()
                }
            ))
            this._rightArrow.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickUpTrigger, () => {
                    //this._rightArrow!.position.y += 0.05
                }
            ))
        }
        if (this._leftReturnArrow) {
            this._leftReturnArrow.actionManager = new ActionManager(this._scene)
            this._leftReturnArrow.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickDownTrigger, () => {
                    this.leftReturn()
                    this.hideBillBoard()
                }
            ))
            this._leftReturnArrow.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickUpTrigger, () => {
                }
            ))
        }
        if (this._rightReturnArrow) {
            this._rightReturnArrow.actionManager = new ActionManager(this._scene)
            this._rightReturnArrow.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickDownTrigger, () => {
                    this.rightReturn()
                    this.hideBillBoard()
                }
            ))
            this._rightReturnArrow.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickUpTrigger, () => {
                }
            ))
        }
    }

    private _locNode: TransformNode[] = [] //地标数据
    public set locTransformNode(node: TransformNode[]) {
        this._locNode = node
    }

    private goForward() { //向前走
        let nextLocName = ""
        console.log(this._currentLoc)
        switch (this._currentLoc) {
            case 0: //起点.
                nextLocName = "Loc_1"
                this._currentLoc = 1
                break
            case 1: // 1.3号房间
                nextLocName = "Loc_2"
                this._currentLoc = 2
                break
            case 2: // 2.4号房间  走到转角处
                nextLocName = "Loc_corner"
                this._currentLoc = 3
                break
            case 3: // 5号房间  不能往前走了
                break
            case 4: // 6号房间  不能往前走了
                break
        }
        if (nextLocName == "")
            return
        //向z轴前进
        //需要走到的下一个结点
        const targetNode = this._locNode.find(node => node.name.endsWith(nextLocName))!
        console.log(Math.abs(this._collisionBox.position.z - targetNode.position.z))
        //跑步 or 走路
        if (Math.abs(this._collisionBox.position.z - targetNode.position.z) > 8)
            this.player.startRunAnim()
        else
            this.player.startWalkAnim()
        this.hideAllArrow() //隐藏所有箭头 在走路的时间
        this._scene.beginDirectAnimation(this._collisionBox, this.createAlongZAnim(targetNode.position.z), 0, CollegeFloor.frameRate, false, 1,
            () => {
                this.player.startIdleAnim()
                this.showArrow() //显示箭头
            })

    }

    private goBackward() {
        let nextLocName = ""
        switch (this._currentLoc) {
            case 0: //起点.
                break
            case 1: // 1.3号房间
                break
            case 2: // 2.4号房间  走到转角处
                nextLocName = "Loc_1"
                this._currentLoc = 1
                break
            case 3:
                nextLocName = "Loc_2"
                this._currentLoc = 2
                break
            case 4:  // 5号房间  到转角处
                nextLocName = "Loc_corner"
                break
            case 5:  // 6号房间  到转角处
                nextLocName = "Loc_corner"
                break

        }
        if (nextLocName == "")
            return
        //向z轴前进
        //需要走到的下一个结点
        const targetNode = this._locNode.find(node => node.name.endsWith(nextLocName))!
        console.log(nextLocName)
        if (nextLocName == "Loc_corner") { //沿着x轴走
            this.player.startRunAnim()

            if (this._currentLoc == 4) {
                this._currentLoc = 3
                this.characterRotate(Math.PI, () => {
                    this._scene.beginDirectAnimation(this._collisionBox, this.createAlongXAnim(-targetNode.position.x), 0, CollegeFloor.frameRate, false, 1,
                        () => {
                            this.characterRotate(-Math.PI / 2, () => {
                                this.player.startIdleAnim()
                                this.cameraRotateXAnim(Math.PI / 4, () => {
                                    this.showArrow() //显示箭头
                                })

                            }, 4)

                        })


                }, 4)

            } else if (this._currentLoc == 5) {
                this._currentLoc = 3
                this.characterRotate(Math.PI, () => {
                    this._scene.beginDirectAnimation(this._collisionBox, this.createAlongXAnim(-targetNode.position.x), 0, CollegeFloor.frameRate, false, 1,
                        () => {
                            this.characterRotate(Math.PI / 2, () => {
                                this.player.startIdleAnim()
                                this.cameraRotateXAnim(Math.PI / 4, () => {
                                    this.showArrow() //显示箭头
                                })
                            }, 4)

                        })


                }, 4)
            }

        } else { //沿着z轴走
            this.player.startRunAnim()

            this.characterRotate(Math.PI, () => {
                this._scene.beginDirectAnimation(this._collisionBox, this.createAlongZAnim(targetNode.position.z), 0, CollegeFloor.frameRate, false, 1,
                    () => {
                        this.characterRotate(-Math.PI, () => {
                            this.player.startIdleAnim()
                            this.showArrow() //显示箭头
                        }, 4)

                    })
            }, 4)

        }

        this.hideAllArrow() //隐藏所有箭头 在走路的时间

    }

    private _viewDetail: boolean = false //仔细查看工作室...

    static readonly CAMERA_MOVE_IN_DISTANCE = -5

    private visitStudioUiShowing(isLeft: boolean) {
        if (this.checkCanVisitThisStudio(isLeft)) {
            useFloorUiState.setVisitStudioUiShowing(true)
            this.updateBillBoard() //更新billboard
        }
    }

    private goLeft() { //左转
        this.hideAllArrow()
        if (this._currentLoc == 1 || this._currentLoc == 2) {
            if (this._currentLoc == 1)
                this._visitStudioIndex = 1
            else
                this._visitStudioIndex = 2
            //查看左边的工作室
            this._update.updateVideoURL()
            this._update.updateStudioInfo()
            this._viewDetail = true
            this.cameraMove(-Math.PI / 2, -Math.PI / 2, VisitPlayerManager.CAMERA_MOVE_IN_DISTANCE, () => {
                this.showReturnArrow()
                this.visitStudioUiShowing(true)
            })
        } else if (this._currentLoc == 3) { //是3的话 左转
            this._currentLoc = 4
            const targetNode = this._locNode.find(node => node.name.endsWith("Loc_3"))!

            this.cameraRotateXAnim(-Math.PI / 4, () => {
                this.player.startWalkAnim()
                this.characterRotate(-Math.PI / 2, () => {
                    this._scene.beginDirectAnimation(this._collisionBox, this.createAlongXAnim(-targetNode.position.x), 0, CollegeFloor.frameRate, false, 1,
                        () => {
                            this.player.startIdleAnim()
                            this.showArrow() //显示箭头
                        })
                }, 4)
            })

        } else if (this._currentLoc == 5) {
            this._visitStudioIndex = 6
            this._update.updateVideoURL()
            this._update.updateStudioInfo()
            this.cameraMove(-Math.PI / 2, 0, -6, () => {
                this.cameraRotateXAnim(Math.PI / 3.5, () => {
                    this.showReturnArrow()
                    this.visitStudioUiShowing(true)

                })
            })
        }
    }

    private goRight() {
        this.hideAllArrow()
        if (this._currentLoc == 1 || this._currentLoc == 2) {
            if (this._currentLoc == 1)
                this._visitStudioIndex = 3
            else
                this._visitStudioIndex = 4
            this._update.updateVideoURL()
            this._update.updateStudioInfo()
            //查看左边的工作室
            this._viewDetail = true
            this.cameraMove(Math.PI / 2, Math.PI / 2, VisitPlayerManager.CAMERA_MOVE_IN_DISTANCE, () => {
                this.showReturnArrow()
                this.visitStudioUiShowing(false)

            })
        } else if (this._currentLoc == 3) { //是3的话 左转
            this._currentLoc = 5
            const targetNode = this._locNode.find(node => node.name.endsWith("Loc_4"))!

            this.cameraRotateXAnim(-Math.PI / 4, () => {
                this.player.startWalkAnim()
                this.characterRotate(Math.PI / 2, () => {
                    this._scene.beginDirectAnimation(this._collisionBox, this.createAlongXAnim(-targetNode.position.x), 0, CollegeFloor.frameRate, false, 1,
                        () => {
                            this.player.startIdleAnim()
                            this.showArrow() //显示箭头
                        })
                }, 4)
            })

        } else if (this._currentLoc == 4) {
            this._visitStudioIndex = 5
            this._update.updateVideoURL()
            this._update.updateStudioInfo()
            this.cameraMove(Math.PI / 2, 0, -6, () => {
                this.cameraRotateXAnim(Math.PI / 3.5, () => {
                    this.showReturnArrow()
                    this.visitStudioUiShowing(false)
                })
            })

        }
    }


    private characterRotate(characterRotateY: number, cb: () => void, speedRatio: number = 1) {
        this._scene.beginDirectAnimation(this._collisionBox, this.createRotateAnim(characterRotateY), 0, CollegeFloor.frameRate, false, speedRatio,
            () => {
                cb()
            })
    }

    private cameraMove(characterRotateY: number, cameraRotateY: number, cameraDistance: number, cb?: () => void) { //镜头移入

        this._scene.beginDirectAnimation(this.player.camera, this.createCameraDistanceAnim(cameraDistance), 0, CollegeFloor.frameRate, false, 1, () => {
            this._scene.beginDirectAnimation(this._collisionBox, this.createRotateAnim(characterRotateY), 0, CollegeFloor.frameRate, false, 1,
                () => {

                })
            this._scene.beginDirectAnimation(this.player.cameraRotate, this.createCameraRotateYAnim(cameraRotateY), 0, CollegeFloor.frameRate, false, 1, cb
            )
        })
    }

    private cameraMoveReverse(characterRotateY: number, cameraRotateY: number, cameraDistance: number, cb?: () => void) { //镜头移入

        this._scene.beginDirectAnimation(this._collisionBox, this.createRotateAnim(characterRotateY), 0, CollegeFloor.frameRate, false, 1,
            () => {
                this._scene.beginDirectAnimation(this.player.camera, this.createCameraDistanceAnim(cameraDistance), 0, CollegeFloor.frameRate, false, 1, cb)
            })
        this._scene.beginDirectAnimation(this.player.cameraRotate, this.createCameraRotateYAnim(cameraRotateY), 0, CollegeFloor.frameRate, false, 1,)


    }

    private cameraRotateXAnim(rotateX: number, cb?: () => void) {
        this._scene.beginDirectAnimation(this.player.cameraRotate, this.createCameraRotateXAnim(rotateX), 0, CollegeFloor.frameRate, false, 1, cb)
    }




    private showReturnArrow() {
        if (this._visitStudioIndex == 1 || this._visitStudioIndex == 2 || this._visitStudioIndex == 6)
            this.arrowVisible(this._leftReturnArrow, true)
        else
            this.arrowVisible(this._rightReturnArrow, true)
    }

    private hideReturnArrow() {
        this.arrowVisible(this._leftReturnArrow, false)
        this.arrowVisible(this._rightReturnArrow, false)
    }


    private showArrow() {  //显示箭头
        this.arrowVisible(this._upArrow, true)
        this.arrowVisible(this._downArrow, true)
        this.arrowVisible(this._leftArrow, true)
        this.arrowVisible(this._rightArrow, true)
        if (this._currentLoc == 0) { //起始位置隐藏左右箭头
            this.arrowVisible(this._leftArrow, false)
            this.arrowVisible(this._rightArrow, false)
        }
        if (this._currentLoc == 0 || this._currentLoc == 1) //隐藏后退的箭头
            this.arrowVisible(this._downArrow, false)
        else if (this._currentLoc == 3)  //隐藏向前的箭头
            this.arrowVisible(this._upArrow, false)
        else if (this._currentLoc == 4) {
            this.arrowVisible(this._leftArrow, false)
            this.arrowVisible(this._upArrow, false)
        } else if (this._currentLoc == 5) {
            this.arrowVisible(this._rightArrow, false)
            this.arrowVisible(this._upArrow, false)
        }


    }

    private arrowVisible(arrow: Mesh | undefined, visible: boolean) {
        if (arrow)
            arrow.isVisible = visible
    }

    private hideAllArrow() {
        this.arrowVisible(this._upArrow, false)
        this.arrowVisible(this._downArrow, false)
        this.arrowVisible(this._leftArrow, false)
        this.arrowVisible(this._rightArrow, false)
        this.arrowVisible(this._leftReturnArrow, false)
        this.arrowVisible(this._rightReturnArrow, false)
    }


    private createRotateAnim(rotate: number) {
        const rotateAnimation = new Animation("rotateAnimation", "rotation.y", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const rotateKeyFrames: IAnimationKey[] = []

        rotateKeyFrames.push({
            frame: 0,
            value: this._collisionBox.rotation.y
        })

        rotateKeyFrames.push({
            frame: CollegeFloor.frameRate,
            value: this._collisionBox.rotation.y + rotate
        })
        rotateAnimation.setKeys(rotateKeyFrames)


        return [rotateAnimation]
    }

    public goIntoStudio(studioIndex: number, cb?: () => void) {
        if (studioIndex == 1 || studioIndex == 2) {
            this.player.startWalkAnim()
            this._scene.beginDirectAnimation(this._collisionBox, this.createAlongXAnim(this._collisionBox.position.x - 3), 0, CollegeFloor.frameRate, false, 1,
                () => {
                    this.player.startIdleAnim()
                    if (cb) {
                        cb()
                    }
                })
        } else if (studioIndex == 3 || studioIndex == 4) {
            this.player.startWalkAnim()
            this._scene.beginDirectAnimation(this._collisionBox, this.createAlongXAnim(this._collisionBox.position.x + 3), 0, CollegeFloor.frameRate, false, 1,
                () => {
                    this.player.startIdleAnim()
                    if (cb) {
                        cb()
                    }
                })
        } else {
            this.player.startWalkAnim()
            this._scene.beginDirectAnimation(this._collisionBox, this.createAlongZAnim(this._collisionBox.position.z + 3), 0, CollegeFloor.frameRate, false, 1,
                () => {
                    this.player.startIdleAnim()
                    if (cb) {
                        cb()
                    }
                })
        }
    }

    private createAlongXAnim(targetX: number) { //前进动画
        const walkAnimation = new Animation("walkAnim", "position.x", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const walkKeyFrames: IAnimationKey[] = []

        walkKeyFrames.push({
            frame: 0,
            value: this._collisionBox.position.x
        })

        walkKeyFrames.push({
            frame: CollegeFloor.frameRate,
            value: targetX
        })
        walkAnimation.setKeys(walkKeyFrames)
        return [walkAnimation]
    }


    private createAlongZAnim(targetZ: number) { //前进动画
        const walkAnimation = new Animation("walkAnim", "position.z", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const walkKeyFrames: IAnimationKey[] = []

        walkKeyFrames.push({
            frame: 0,
            value: this._collisionBox.position.z
        })

        walkKeyFrames.push({
            frame: CollegeFloor.frameRate,
            value: targetZ
        })
        walkAnimation.setKeys(walkKeyFrames)
        return [walkAnimation]
    }

    private createCameraRotateYAnim(rotateZ: number) {

        const cameraAnimation = new Animation("cameraAnimation", "rotation.y", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const cameraKeyFrames: IAnimationKey[] = []

        cameraKeyFrames.push({
            frame: 0,
            value: this.player.cameraRotate.rotation.y
        })

        cameraKeyFrames.push({
            frame: CollegeFloor.frameRate,
            value: this.player.cameraRotate.rotation.y + rotateZ
        })
        cameraAnimation.setKeys(cameraKeyFrames)


        return [cameraAnimation];
    }


    private createCameraRotateXAnim(rotateX: number) {

        const cameraAnimation = new Animation("cameraAnimation", "rotation.x", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const cameraKeyFrames: IAnimationKey[] = []

        cameraKeyFrames.push({
            frame: 0,
            value: this.player.cameraRotate.rotation.x
        })

        cameraKeyFrames.push({
            frame: CollegeFloor.frameRate,
            value: this.player.cameraRotate.rotation.x + rotateX
        })
        cameraAnimation.setKeys(cameraKeyFrames)


        return [cameraAnimation];
    }


    private createCameraDistanceAnim(deltaDistance: number) {
        const cameraDisAnimation = new Animation("cameraDisAnimation", "position.z", CollegeFloor.frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const cameraDisKeyFrames: IAnimationKey[] = []

        cameraDisKeyFrames.push({
            frame: 0,
            value: this.player.camera.position.z
        })

        cameraDisKeyFrames.push({
            frame: CollegeFloor.frameRate,
            value: this.player.camera.position.z + deltaDistance
        })
        cameraDisAnimation.setKeys(cameraDisKeyFrames)

        return [cameraDisAnimation];
    }

    private leftReturn() {
        this.hideReturnArrow()
        useFloorUiState.setVisitStudioUiShowing(false)
        // 1 , 2 ,6
        if (this._visitStudioIndex == 1 || this._visitStudioIndex == 2) {
            this._viewDetail = false
            this.cameraMoveReverse(Math.PI / 2, Math.PI / 2, VisitPlayerManager.CAMERA_MOVE_IN_DISTANCE * -1, () => {
                this.showArrow()

            })
        } else if (this._visitStudioIndex == 6) {

            this.cameraRotateXAnim(-Math.PI / 3.5, () => {
                this.cameraMove(Math.PI / 2, 0, 6, () => {
                    this.showArrow()
                })
            })
        }
    }

    private rightReturn() {
        this.hideReturnArrow()
        useFloorUiState.setVisitStudioUiShowing(false)
        // 3 , 4 , 5
        if (this._visitStudioIndex == 3 || this._visitStudioIndex == 4) {
            this._viewDetail = false
            this.cameraMoveReverse(-Math.PI / 2, -Math.PI / 2, VisitPlayerManager.CAMERA_MOVE_IN_DISTANCE * -1, () => {
                this.showArrow()
            })
        } else if (this._visitStudioIndex == 5) {

            this.cameraRotateXAnim(-Math.PI / 3.5, () => {
                this.cameraMove(-Math.PI / 2, 0, 6, () => {
                    this.showArrow()
                })
            })
        }
    }

    private checkCanVisitThisStudio(isLeft: boolean): boolean { //检查是否可以访问这个工作室
        if (this._currentLoc == 1) { //1 ，3 工作室是否存在
            if (isLeft)
                return this.floorTotalStudioNum >= 1;
            else
                return this.floorTotalStudioNum >= 3;
        } else if (this._currentLoc == 2) {
            if (isLeft)
                return this.floorTotalStudioNum >= 2;
            else
                return this.floorTotalStudioNum >= 4;
        } else if (this._currentLoc == 4) {
            return this.floorTotalStudioNum >= 5;
        } else if (this._currentLoc == 5) {
            return this.floorTotalStudioNum >= 6;
        }
        return false
    }

    setUpShadow(_shadowGenerator: ShadowGenerator) {
        this._collisionBox.getChildMeshes().forEach(mesh => {
            _shadowGenerator.addShadowCaster(mesh)
        })
    }

    private updateBillBoard() {
        if (this._billBoard) {
            console.log(this._currentLoc)
            this._billBoard.infoBillBoard.isVisible = true
            this._billBoard.playingBillBoard.isVisible = true
            if (this._visitStudioIndex == 1 || this._visitStudioIndex == 2) {
                this._billBoard.infoBillBoard.position.set(-2, 1, -1)
                this._billBoard.playingBillBoard.position.set(-2, 1, 1)
            } else if (this._visitStudioIndex == 3 || this._visitStudioIndex == 4) {
                this._billBoard.infoBillBoard.position.set(2, 1, 1)
                this._billBoard.playingBillBoard.position.set(2, 1, -1)
            } else if (this._visitStudioIndex == 5) {
                this._billBoard.infoBillBoard.position.set(-1, 1, 2)
                this._billBoard.playingBillBoard.position.set(1, 1, 2)
            } else {
                this._billBoard.infoBillBoard.position.set(-1, 1, 2)
                this._billBoard.playingBillBoard.position.set(1, 1, 2)
            }
        }
    }

    private hideBillBoard() {
        if (this._billBoard) {
            this._billBoard.playingBillBoard.isVisible = false
            this._billBoard.infoBillBoard.isVisible = false
        }
    }
}

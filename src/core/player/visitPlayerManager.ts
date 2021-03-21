import {
    AbstractMesh,
    ActionManager, Animation, ExecuteCodeAction, IAnimationKey,
    Matrix,
    Mesh,
    MeshBuilder,
    Quaternion,
    Scene,
    SceneLoader, TransformNode,
    Vector3
} from "@babylonjs/core";
import {Player, PlayerAssets} from "./player";
import {InputController} from "./inputController";
import {PlayerManager} from "./playerManager";
import {VisitPlayer} from "./visitPlayer";
import {CollegeManager} from "../college/collegeManager";
import {CollegeFloor} from "../college/collegeFloor";

export class VisitPlayerManager {
    private _scene: Scene;
    private _playerModelURL: string;
    public player!: VisitPlayer;

    private _collisionBox!: AbstractMesh
    private _arrowModelURL: string;
    private _visitStudioIndex: number = 0 //访问的工作室索引值
    constructor(scene: Scene, playerModelURL: string, arrowModelURL: string) {
        this._scene = scene;
        this._playerModelURL = playerModelURL;
        this._arrowModelURL = arrowModelURL;

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

        //设置箭头的点击事件
        this.setUpArrowAction()
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
            mesh.isVisible = false
        })
    }

    public visible() { //将玩家显示
        const meshes = this._collisionBox.getChildMeshes();
        meshes.forEach(mesh => {
            mesh.isVisible = true
        })
        this.hideAllArrow()
        this.showArrow()
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

    private goLeft() { //左转
        this.hideAllArrow()
        if (this._currentLoc == 1 || this._currentLoc == 2) {
            if (this._currentLoc == 1)
                this._visitStudioIndex = 1
            else
                this._visitStudioIndex = 2
            //查看左边的工作室
            this._viewDetail = true
            this.cameraMove(-Math.PI / 2, -Math.PI / 2, VisitPlayerManager.CAMERA_MOVE_IN_DISTANCE, () => {
                this.showReturnArrow()
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
            this.cameraMove(-Math.PI / 2, 0, -6, () => {
                this.cameraRotateXAnim(Math.PI / 3.5, () => {
                    this.showReturnArrow()
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
            //查看左边的工作室
            this._viewDetail = true
            this.cameraMove(Math.PI / 2, Math.PI / 2, VisitPlayerManager.CAMERA_MOVE_IN_DISTANCE, () => {
                this.showReturnArrow()

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
            this.cameraMove(Math.PI / 2, 0, -6, () => {
                this.cameraRotateXAnim(Math.PI / 3.5, () => {
                    this.showReturnArrow()

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


    private backToPath(isLeft: boolean) { //回到道路上来
        if (isLeft) { //如果在左边的工作室
            this.cameraMove(Math.PI / 2, Math.PI / 2, 5)
        } else { //右边的工作室
            this.cameraMove(-Math.PI / 2, -Math.PI / 2, 5)
        }
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
}

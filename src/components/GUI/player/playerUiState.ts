import {makeAutoObservable} from "mobx";
import {Staircase} from "../../../core/staircase/staircase";
import {ReceptionistManager} from "../../../core/receptionist/receptionistManager";
import {StudioManager} from "../../../core/studio/StudioManager";
import {notification} from "antd";
import usePracticeTableUiState from "../practiceTable/practiceTableUiState";
import {StudyType, SubTask, SubTaskState, Task, TaskState} from "../task/taskUiState";

export interface Player {

}


export interface PlayerDialog {
    avatarURL: string //玩家的头像
    title: string //对话框标题
    info: string //显示的信息
}

export class PlayerState {
    receptionistManager: ReceptionistManager | null = null
    studioManager: StudioManager | null = null
    staircase: Staircase | null = null
    isShowing: boolean = false
    keyBoardHintShowing:boolean = false
    currentTask: Task = {
        name: "空任务",
        uuid: -1,
        status: TaskState.NotAccept,
        description: "",
        goal: "",
        subTask: []
    }  //当前正在完成的任务
    currentSubTaskIndex: number = -1
    isShowingDialog: boolean = false //显示对话框？
    isHideSideBar : boolean =false //隐藏右边的楼梯 & 任务栏

    setHideSideBar(hide:boolean){
        this.isHideSideBar = hide
    }

    dialog: PlayerDialog = {
        avatarURL: "", //玩家的头像
        title: "", //对话框标题
        info: "" //显示的信息
    }
    isMiniMapShowing: boolean = false;

    public setMiniMapShowing(showing:boolean){
        this.isMiniMapShowing = showing
    }

    public setDialogShowing(showing: boolean) {
        this.isShowingDialog = showing
    }

    public setDialogInfo(dialog: PlayerDialog) {
        this.dialog = dialog
    }

    constructor() {
        makeAutoObservable(this,
            {
                staircase: false,
                setStairCase: false,
                currentSubTaskIndex: false,
                receptionistManager: false,
                setReceptionistManager: false,
                studioManager: false,
                setStudioManager: false,
                currentSubTaskVideoUUID: false,
                playSoundAndHighLight: false,
            })
    }

    public playSoundAndHighLight(subTaskIndex: number) {
        //关闭所有的高亮
        this.studioManager?.setHighLightBookShelf(false)
        this.studioManager?.setHighlightPracticeTable(false)
        this.studioManager?.setHighlightPracticeTable(false)

        //播放不同类型的接受任务声音
        switch (this.currentTask.subTask[subTaskIndex].type) {
            case StudyType.video:
                this.receptionistManager?.playVideoHintSound()
                this.studioManager?.setHighLightBookShelf(true)
                break
            case StudyType.read:
                this.receptionistManager?.playReadingHintSound()
                this.studioManager?.setHighlightPracticeTable(true)
                break
            case StudyType.practice:
                this.receptionistManager?.playExerciseHintSound()
                this.studioManager?.setHighlightPracticeTable(true)
                break
            default:
                break
        }
    }


    public setCurrentTask(task: Task) { //设置当前任务
        this.isShowing = true
        task.subTask.forEach((subTask, index) => {
            if (subTask.status == SubTaskState.OnProgress) {
                this.currentSubTaskIndex = index
            }
        })
        this.currentTask = task
        this.updatePracticeTableButton() //刷新练习台上的练习按钮
    }

    private updatePracticeTableButton() {
        const practiceTableUiState = usePracticeTableUiState;
        if (practiceTableUiState.practiceTable) { //获取到任务后就更新按钮
            practiceTableUiState.practiceTable.updatePracticeButton()
        }
    }

    public setShowing(showing: boolean) {
        this.isShowing = showing
    }

    public setStairCase(staircase: Staircase) { //获取当前阶梯的实例
        this.staircase = staircase
    }

    public setReceptionistManager(receptionistManager: ReceptionistManager) {
        this.receptionistManager = receptionistManager
    }

    public setStudioManager(studioManager: StudioManager) {
        this.studioManager = studioManager
    }

    //完成任务
    public finishSubTask(subTaskIndex: number, newState: SubTaskState = SubTaskState.Finished) {
        if (subTaskIndex >= this.currentTask.subTask.length)
            return
        this.currentTask.subTask[subTaskIndex].status = newState

        this.currentTask.subTask[subTaskIndex].rate = 5
        //后台获取评价分数...
        if (this.staircase) {
            console.log('调用楼梯的moveNext')
            this.staircase.moveToNext()
        }


        //更新下一个子任务的状态为 OnProgress
        subTaskIndex++
        //左上角提示
        notification.success(
            {
                message: `子任务完成`,
                description: `${this.currentTask.subTask[subTaskIndex - 1].name} 完成,评分${this.currentTask.subTask[subTaskIndex - 1].rate}`
                ,
                placement: "topLeft",
                onClose: () => {
                    //播放提示声音
                    if (subTaskIndex < this.currentTask.subTask.length) {
                        this.playSoundAndHighLight(this.currentSubTaskIndex)
                    }
                },
                duration: 3   //3秒结束后  播放下一个任务的提示音
            }
        )
        this.updatePracticeTableButton() //刷新练习台上的练习按钮

        if (subTaskIndex >= this.currentTask.subTask.length) {
            //计算总分
            const totalScore = this.currentTask.subTask.reduce((previousValue: number, currentTask) => previousValue + currentTask.rate!, 0)
            //计算均分
            const taskScore = totalScore / this.currentTask.subTask.length
            this.currentTask.rate = taskScore
            this.receptionistManager?.playTaskFinishedHintSound() //完成任务的提示音乐
            notification.success(
                {
                    message: `任务完成`,
                    description: `${this.currentTask.name} 完成,评分${this.currentTask.rate}`
                    ,
                    placement: "topLeft",
                }
            )
            this.currentSubTaskIndex = -1 //任务完成...
            this.turnOffAllHighLight() //关闭所有高亮
            return;
        }
        //调整任务状态
        this.currentTask.subTask[subTaskIndex].status = SubTaskState.OnProgress
        //调整当前子任务索引
        this.currentSubTaskIndex = subTaskIndex

    }

    private turnOffAllHighLight() { //关闭所有高亮
        //关闭所有的高亮
        this.studioManager?.setHighLightBookShelf(false)
        this.studioManager?.setHighlightPracticeTable(false)
        this.studioManager?.setHighlightPracticeTable(false)
    }


    public updateCurrentSubTaskProgress(studyType: StudyType, studyUuid: number, progress: number) {
        if (this.currentTask.uuid >= 0) {
            const subTask = this.currentTask.subTask[this.currentSubTaskIndex];
            //只有uuid和type一样才更新progress
            if (subTask.studyUuid == studyUuid && subTask.type == studyType) {
                this.currentTask.subTask[this.currentSubTaskIndex].progress = progress
                if (progress == 100) {  //如果完成了 进入下一个子任务
                    this.finishSubTask(this.currentSubTaskIndex)
                }
            }
        }
    }

    //获取当前子任务的视频uuid 如果当前子任务不是看视频的子任务 返回null
    get currentSubTaskVideoUUID(): number | null {

        if (this.currentTask.uuid >= 0) {
            console.log('子任务编号', this.currentSubTaskIndex)
            if (this.currentSubTaskIndex >= 0 && this.currentSubTaskIndex < this.currentTask.subTask.length) {
                console.log(this.currentSubTaskIndex)
                if (this.currentTask.subTask[this.currentSubTaskIndex].type == StudyType.video)
                    return this.currentTask.subTask[this.currentSubTaskIndex].studyUuid  //返回视频的ID
            }
        }
        return null
    }

    //获取当前子任务的电子书uuid 如果当前子任务不是看电子书的子任务 返回null
    get currentSubTaskEBookUUID(): number | null {

        if (this.currentTask.uuid >= 0) {
            if (this.currentSubTaskIndex >= 0 && this.currentSubTaskIndex < this.currentTask.subTask.length) {
                if (this.currentTask.subTask[this.currentSubTaskIndex].type == StudyType.read)
                    return this.currentTask.subTask[this.currentSubTaskIndex].studyUuid  //返回电子书的ID
            }
        }
        return null
    }


    //获取当前的练习子任务
    get currentPracticeSubTask(): SubTask[] {
        let practiceSubTask: SubTask[] = []
        this.currentTask.subTask.forEach(subTask => {
            if ((subTask.status == SubTaskState.OnProgress || subTask.status == SubTaskState.UnFinished) && subTask.type == StudyType.practice) {
                practiceSubTask.push(subTask)
            }
        })


        console.log('返回练习任务', practiceSubTask)
        return practiceSubTask
        //return fakeTask
    }

    setKeyBoardHintShow(showing: boolean) {
        this.keyBoardHintShowing = showing
    }
}

const usePlayerUiState = new PlayerState()


// setTimeout(() => {
//     console.log('更新子任务')
//     usePlayerUiState.setCurrentTask(fakeTask[1])
// }, 3000+4000)
//
// setTimeout(() => {
//     console.log('更新子任务')
//     usePlayerUiState.finishSubTask(3)
// }, 5000+4000)
//
// setTimeout(() => {
//     console.log('更新子任务')
//     usePlayerUiState.finishSubTask(4)
// }, 6000+4000)
// setTimeout(() => {
//     console.log('更新子任务')
//     usePlayerUiState.finishSubTask(5)
// }, 7000+4000)
// setTimeout(() => {
//     console.log('更新任务')
//     // usePlayerUiState.setCurrentTask(fakeTask[1])
// }, 8000+4000)
export default usePlayerUiState

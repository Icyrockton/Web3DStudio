import {Task, TaskState} from "./taskUi";


const fakeTask: Task[] = [
    {
        uuid: 1,
        name:'任务1',
        description:'描述1',
        status:TaskState.OnProgress,
        subTask: [
            {
                status: TaskState.Finished,
                name:'子任务1',
                conditions :[] ,
                description:''
            },
            {
                status: TaskState.OnProgress,
                name:'子任务2',
                conditions :[] ,
                description:''
            }
        ]
    },
    {
        uuid: 2,
        name:'任务2',
        description:'描述2',
        status:TaskState.OnProgress,
        subTask: []
    },
]


export class TaskUiState {
    isShowing: boolean = true
    taskList: Task[] = fakeTask

}


const useTaskUiState = new TaskUiState();

export default useTaskUiState

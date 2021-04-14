import axios from "axios";
import {CollegeMap} from "../core/collegeMap/collegeMapManager";
import {CollegeFloors} from "../core/college/collegeManager";
import {Studio} from "../core/studio/Studio";
import {BookDetail, StudioBook} from "../core/bookShelf/bookShelf";
import {EBookDetail, StudioEBook} from "../core/practiceTable/practiceTable";
import {PracticeTask} from "../components/GUI/practiceTable/practiceTableUiState";
import {Task} from "../components/GUI/task/taskUiState";
import {CollegeDescription} from "../core/collegeMap/college";
import {AchievementList} from "../components/GUI/achievement/achievementUiState";

interface LoginResponse {
    code: number,
    message: string,
    data: string | null,
    loginID: number //登录的账号ID
}

export class Web3dApi {
    private _axios = axios.create({
        baseURL: "http://121.4.151.26:3020",
        responseType: "json",
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true
    })

    //登录
    login(userName: string, password: string) {
        return this._axios.post<LoginResponse>("user/login",
            {
                username: userName,
                password: password
            }
        )
    }

    //获取collegeMap
    getCollegeMap() {
        return this._axios.get<CollegeMap>("/college/map",{
            withCredentials:false
        })
    }

    getCollegeFloor(uuid: number) {
        return this._axios.get<CollegeFloors>(`/college/floor/${uuid}`)
    }

    getStudio(cuuid:number,uuid: number) { //学院ID 工作室ID
        return this._axios.get<Studio>(`/studio/${uuid}`)
    }

    getStudioBook(uuid:number){ //工作室的UUID
        return this._axios.get<BookDetail[]>(`/studio/book/${uuid}`)
    }


    getStudioEBook(uuid:number){ //工作室的UUID
        return this._axios.get<EBookDetail[]>(`/studio/ebook/${uuid}`)
    }

    getStudioTask(studioUuid:number){ //练习题的UUID
        return this._axios.get<Task[]>(`/studio/task/${studioUuid}`)
    }

    getStudioPractice(practiceUuid:number){
        return this._axios.get<PracticeTask>(`practice/${practiceUuid}`)
    }

    getCollegeDescription(uuid: number) {
        return this._axios.get<CollegeDescription>(`college/description/${uuid}`)
    }

    getUserAchievement(){
        return this._axios.get<AchievementList>(`user/achievement`)
    }

    getTaskScore(uuid:number){ //任务ID
        return this._axios.get<Task>(`/studio/task/score/${uuid}`)
    }

}

const useWeb3DApi = new Web3dApi()
export default useWeb3DApi

import axios from "axios";
import {CollegeMap} from "../core/collegeMap/collegeMapManager";
import {CollegeFloors} from "../core/college/collegeManager";
import {Studio} from "../core/studio/Studio";
import {BookDetail, StudioBook} from "../core/bookShelf/bookShelf";
import {EBookDetail, StudioEBook} from "../core/practiceTable/practiceTable";
import {PracticeTask} from "../components/GUI/practiceTable/practiceTableUiState";

interface LoginResponse {
    code: number,
    message: string,
    data: string | null,
    loginID: number //登录的账号ID
}

export class Web3dApi {
    private _axios = axios.create({
        baseURL: "http://localhost:3010/",
        responseType: "json",
        headers: {
            'Content-Type': 'application/json'
        }
    })

    //登录
    login(userName: string, password: string) {
        return this._axios.get<LoginResponse>("/user/userLogin", {
            method: "get",
            params: {
                login_name: userName,
                login_pwd: password
            }
        })
    }

    //获取collegeMap
    getCollegeMap() {
        return this._axios.get<CollegeMap>("/collegeMap")
    }

    getCollegeFloor(uuid: number) {
        return this._axios.get<CollegeFloors>("/collegeFloor", {
            params: {
                "uuid": uuid
            }
        })
    }

    getStudio(uuid: number) {
        return this._axios.get<Studio>("/studio", {
            params: {
                "uuid": uuid
            }
        })
    }

    getStudioBook(uuid:number){ //工作室的UUID
        return this._axios.get<BookDetail[]>("/studioBook",{
            params:{
                "uuid": uuid
            }
        })
    }


    getStudioEBook(uuid:number){ //工作室的UUID
        return this._axios.get<EBookDetail[]>("/studioEBook",{
            params:{
                "uuid": uuid

            }
        })
    }

    getStudioTask(taskUuid:number){ //练习题的UUID
        return this._axios.get<PracticeTask>("studioTask",{
            params:{
                "uuid" : taskUuid
            }
        })
    }
}

const useWeb3DApi = new Web3dApi()
export default useWeb3DApi

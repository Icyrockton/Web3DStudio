import axios from "axios";

interface LoginResponse {
    code:number,
    message:string,
    data:string | null,
    loginID:number //登录的账号ID
}

export class Web3dApi {
    private _axios = axios.create({
        baseURL:"http://localhost:3010/",
        responseType:"json",
        headers:{
            'Content-Type': 'application/json'
        }
    })

    //登录
     login(userName:string,password:string){
        return this._axios.get<LoginResponse>("/user/userLogin",{
            method:"get",
            params:{
                login_name : userName,
                login_pwd : password
            }
        })
    }
}

const useWeb3DApi=new Web3dApi()
export default useWeb3DApi

import {makeAutoObservable, runInAction} from "mobx";
import useWeb3DApi from "../../network/web3dApi";
import {notification} from "antd";


export class LoginUiState {
    isLogIn: boolean = false
    loginUserID: number | null = null

    constructor() {
        makeAutoObservable(this)
    }

    async login(userName: string, password: string): Promise<boolean> {
        //登录
        const response = await useWeb3DApi.login(userName, password);
        const data = response.data;
        if (data != null ) {
            if (data.code == 100) {
                runInAction(() => {
                    this.loginUserID = data.loginID
                    this.isLogIn = true
                })
                notification.success({
                    message: `登录成功,${data.message}`,
                    placement : "topRight",
                    top: 24
                })
                return  true
            }
            else{
                notification.error({
                    message: `登录失败,${data.message}`,
                    placement : "topRight",
                    top:24
                })
            }
        } else {
            notification.error({
                message: `登录失败,请检查网络连接`,
                placement : "topRight",
                top:24
            })
        }
        return false

    }
}

const useLoginUiState = new LoginUiState()

export default useLoginUiState

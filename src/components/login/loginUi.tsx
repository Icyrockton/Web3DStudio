import {observer} from "mobx-react-lite";
import React, {useState} from "react";
import {LoginUiState} from "./loginUiState";
import classes from './loginUi.module.css'
import useLocalStorageState from "use-local-storage-state";

type LoginUiProps = {
    uiState: LoginUiState
}
interface RememberUser{
    isRemembered:boolean //是否记住
    userName:string //账号
    password:string //密码
}
const blankAccount={
    isRemembered:false,
    userName:"",
    password:""
} as RememberUser

export const LoginUi = observer<LoginUiProps>(props => {

    const uiState = props.uiState;
    const [account,setAccount] = useLocalStorageState<RememberUser>("web3dUser",blankAccount);
    const [userName,setUserName] = useState(account.userName);
    const [password,setPassword] = useState(account.password);
    const [remember,setRemember] = useState(account.isRemembered);
    const login=async ()=>{
        const isLogin = await uiState.login(userName,password);
        if (isLogin && remember){
            setAccount({
                isRemembered:true,
                userName:userName,
                password:password
            }) //记住账号
        }
        if (!remember){
            setAccount(blankAccount)
        }

    }
    return (
        <div className={`${classes.loginUiBackGround} ${uiState.isLogIn? classes.none :"" } `}>
            <div className={classes.boxForm}>
                <div className={classes.left}>
                    <div className={classes.overlay}>
                        <h1 className={classes.title}>立方</h1>
                        <h1 className={classes.title}>教育</h1>
                        <div className={classes.description}>
                            <p className={classes.descriptionLeft}>服务外包 顶点着色器  </p>
                            <p className={classes.descriptionRight}>BabylonJS驱动</p>
                        </div>
                    </div>
                </div>


                <div className={classes.right}>
                    <h5 className={classes.loginTitle}>登录</h5>
                    <div className={classes.inputs}>
                        <input value={userName} onChange={(event)=>setUserName(event.target.value)}  type="text" className={classes.input} placeholder="账号"/>
                        <br/>
                        <input value={password} onChange={(event)=>setPassword(event.target.value)} type="password" className={classes.input} placeholder="密码"/>
                    </div>

                    <br/>

                    <div className={classes.rememberMeForgetPassword}>
                        <input className={classes.inpCbx} id="cbx" type="checkbox" style={{display:"none"}} checked={remember} onChange={(event)=>setRemember(event.target.checked)}   />
                        <label className={classes.cbx} htmlFor="cbx"><span>
                            <svg width="12px" height="9px" viewBox="0 0 12 9">
                            <polyline points="1 5 4 8 11 1"/>
                          </svg></span><span>记住账号</span></label>
                        <p className={classes.forgetPassword}>忘记密码?</p>
                    </div>

                    <br/>
                    <button className={classes.button} onClick={login}>登录</button>
                </div>

            </div>
        </div>
    )
})

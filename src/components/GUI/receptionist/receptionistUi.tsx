import {ReceptionistUiState} from "./receptionistUiState";
import {observer} from "mobx-react-lite";
import React from "react";
import 'antd/dist/antd.css';


type ReceptionUiProps = {
    receptionistUiState: ReceptionistUiState
}

const ReceptionistUi = observer<ReceptionUiProps>(props => {
        const uiState = props.receptionistUiState;
    return (
        <>
            <div className={`bg ${uiState.isShowingDescription ? "" : "none"}`}>
                <div className={`content unSkew`}>
                    <img src={uiState.description.avatarURL} alt="" className={"image"}/>
                    <h2 className={"right"}>职务：{uiState.description.position} 岗位：{uiState.description.title}</h2>
                    <h1 style={{textAlign:"center"}}>{uiState.description.info}</h1>
                </div>
            </div>
            <style jsx>{
                `
                  .right {
                    text-align: right;
                    margin-right: 5%;
                  }

                  .content {
                    position: relative;
                  }

                  .image {
                    position: absolute;
                    bottom: 80%;
                    left: -10%;
                    width: 400px;
                  }

                  .bg {
                    width: 45%;
                    height: 10%;
                    transform: skew(30deg) translate(-50%, -50%);
                    background: white;
                    position: absolute;
                    left: 50%;
                    bottom: 0;
                    color: white;
                    animation-name: slideFromBottom;
                    animation-duration: 200ms;
                    animation-timing-function: ease-out;
                    box-shadow: 20px 20px rgba(0,0,0,.15);
                  }

                  .unSkew {
                    transform: skew(-30deg);
                  }

                  .none {
                    display: none;
                  }

                  @keyframes slideFromBottom {

                    0% {
                      bottom: -20%;
                    }
                    100% {
                      bottom: 0%;
                    }
                  }
                `
            }
            </style>
        </>


    )
})

export default ReceptionistUi
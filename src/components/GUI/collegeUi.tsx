import React from "react";
import {observer} from "mobx-react-lite";
import {CollegeUiState} from "./collegeUiState";
import './ui.css'
import {Card, Divider, Typography,List} from "antd/es";
import 'antd/dist/antd.css';
import {Studio} from "../../core/collegeMap/college";

type CollegeUiProps = {
    uiState: CollegeUiState
}


const CollegeUi = observer<CollegeUiProps>(props => {
    const college = props.uiState.college;

    let content
    if (college) {
        content = (<>
                <img src={college.imgUrl} className={"cardImg"}/>
                <Typography>
                    <Typography.Title level={3}>
                        {college.name}

                    </Typography.Title>

                    <Typography.Text>
                        <Typography.Text strong={true}>
                            {"学院介绍:  "}
                        </Typography.Text>
                        {college.description}
                    </Typography.Text>
                    <Divider type={"horizontal"}/>
                    <Typography.Title level={3}>
                        工作室
                    </Typography.Title>

                    <List dataSource={college.studios}
                          renderItem={
                              (item: Studio) => (
                                  <List.Item>
                                      <img src={item.logoUrl} className={"logo"}/>
                                      {item.name}
                                  </List.Item>
                              )
                          }/>
                </Typography>
                <style jsx>{
                    `
                      .logo {
                        width: 40px;
                        height: 40px;
                        margin-right: 10px;
                      }
                    `
                }
                </style>
            </>
        )
    } else {
        content = (<>
                <h1>无内容</h1>

            </>
        )
    }


    return (
        <>
            <Card className={`collegeUI ${props.uiState.isShowing ? "" : "none"}`}>
                {content}
            </Card>
            <style jsx>
                {
                    `
                      .none {
                        display: none;
                      }

                      .collegeUI {
                        position: absolute;
                        right: 0;
                        top: 0;
                        animation-name: slideFromRight;
                        animation-duration: 0.5s;
                        animation-timing-function: ease-out;
                        width: 300px;
                        height: 100%;
                      }

                      @keyframes slideFromRight {
                        0% {
                          right: -300px;
                        }
                        100% {
                          right: 0px;
                        }
                      }


                      .cardImg {
                        width: 100%;
                      }
                    `
                }
            </style>
        </>
    )
})

export default CollegeUi
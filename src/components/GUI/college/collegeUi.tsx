import React from "react";
import {observer} from "mobx-react-lite";
import {CollegeUiState} from "./collegeUiState";
import {Card, Divider, Typography, List} from "antd/es";
import 'antd/dist/antd.css';
import {SimpleStudio} from "../../../core/collegeMap/college";
import classes from  './collegeUi.module.css'
type CollegeUiProps = {
    uiState: CollegeUiState
}

const CollegeUiComponent = (props: CollegeUiProps) => {
    const college = props.uiState.college;

    let content
    if (college) {
        content = (<>
                <img src={college.imgUrl} className={classes.cardImg}/>
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
                              (item: SimpleStudio) => (
                                  <List.Item>
                                      <img src={item.logoUrl} className={classes.logo}/>
                                      {item.name}
                                  </List.Item>
                              )
                          }/>
                </Typography>
            </>
        )
    } else {
        content = (<>
                <h1>无内容</h1>

            </>
        )
    }


    return (
        <Card className={`${classes.collegeUI} ${props.uiState.isShowing ? classes.collegeUIShow : ""}`}>
            {content}
        </Card>

    )
}
const CollegeUi = observer<CollegeUiProps>(CollegeUiComponent)

export default CollegeUi

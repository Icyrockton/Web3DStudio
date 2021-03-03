import {observer} from "mobx-react-lite";
import React from "react";
import {TaskUiState} from "./taskUiState";
import 'antd/dist/antd.css';
import Layout, {Content} from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import {Card, Col, Menu, Progress, Row} from "antd";
import {HddOutlined} from "@ant-design/icons";

type TaskUiProps = {
    taskUiState: TaskUiState
}

export enum TaskState { //任务的状态
    NotAccept, //还未接收任务
    OnProgress,//正在进行中
    Finished //已完成的任务
}

export interface Task {
    uuid: number //任务的唯一id
    name: string //任务名称
    status: TaskState //任务的状态
    description: string //任务总览介绍
    subTask: SubTask[] //子任务
}

export interface SubTask {
    name: string //子任务的名称
    status: TaskState //子任务的状态
    description: string // 子任务的描述
    conditions: Condition[]  //完成条件
}

export enum StudyType {
    video, //视频
    exercise, //课后练习
    read //读书
}

export interface Condition { //需要完成的子任务的完成条件
    type: StudyType //类型
    name: string //条件名称
    finished: boolean //是否完成?
}

type TaskProps = {
    task: Task
}

function Task(props: TaskProps) {
    const task = props.task;
    let finished=task.subTask.filter(subTask=>subTask.status ==TaskState.Finished ).length
    let progress=(finished / task.subTask.length) * 100 //求得进度
    return (

        <>
            <Card className={"card"} title={<h3 style={{textAlign:"left"}}>{task.name}</h3> }>
                <Row >
                    <Col span={4}>
                        <HddOutlined style={{width:"100px"}} />
                    </Col>
                    <Col span={20}>
                        <Row>
                            <h1>{task.description}</h1>
                        </Row>
                        <Row>
                            <Progress percent={progress} />
                        </Row>
                    </Col>
                </Row>
            </Card>
            <style jsx>{
                `
                  .card {
                    margin-bottom: 2%;
                  }
                `
            }

            </style>
        </>
    )
}


const TaskUi = observer<TaskUiProps>(props => {

    const list = props.taskUiState.taskList;
    //创建task列表
    const taskList = list.map(task =>
        <Task task={task}/>
    )

    return (
        <>

            <div className={"main"}>
                <div className={"taskTab"}>
                    <Layout className={"tab"}>
                        {/*侧边栏*/}
                        <Sider theme={"light"} collapsed={false}>
                            <div className={"logo"}>LOGO</div>
                            <Menu mode={"vertical"}>
                                <Menu.Item key={"1"}>正在进行</Menu.Item>
                                <Menu.Item key={"2"}>已完成</Menu.Item>
                            </Menu>
                        </Sider>

                        <Layout>
                            <Content style={{
                                margin: '24px 16px',
                                padding: 24,
                                background: "red",
                                overflow: "auto"
                            }}>
                                {
                                    taskList
                                }
                            </Content>
                        </Layout>
                    </Layout>
                </div>
            </div>
            <style jsx>
                {
                    `

                      .tab {
                        height: 100%;
                      }

                      .taskTab {
                        width: 50%;
                        height: 50%;
                        background: white;
                        left: 50%;
                        top: 50%;
                        position: absolute;
                        border: 5px solid red;
                        transform: translate(-50%, -50%);
                      }

                      .main {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, .5);
                      }
                    `
                }
            </style>
        </>
    )
})

export default TaskUi
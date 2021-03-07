import {observer} from "mobx-react-lite";
import React, {useState} from "react";
import useTaskUiState, {TaskUiState} from "./taskUiState";
import 'antd/dist/antd.css';
import Layout, {Content, Header} from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import {Button, Card, Col, Divider, Menu, Progress, Rate, Row, Timeline, Tooltip, Typography} from "antd";
import {CloseOutlined, CodepenCircleOutlined, DatabaseFilled, HddOutlined} from "@ant-design/icons";
import Modal from "antd/es/modal/Modal";
import Title from "antd/es/typography/Title";
import Paragraph from "antd/es/typography/Paragraph";
import  classes from './taskUi.module.css'
type TaskUiProps = {
    taskUiState: TaskUiState
}


export enum TaskState { //任务的状态
    NotAccept, //还未接收任务
    OnProgress,//正在进行中
    Finished //已完成的任务
}

export enum SubTaskState {
    UnFinished, //未完成
    Finished, //完成
    OnProgress // 正在进行
}

export interface Task {
    uuid: number //任务的唯一id
    name: string //任务名称
    status: TaskState //任务的状态
    description: string //任务总览介绍
    goal: string //任务的目标
    subTask: SubTask[] //子任务
    rate?: number //总评分 1~5
}


export interface SubTask {
    name: string //子任务的名称
    status: SubTaskState //子任务的状态
    description: string // 子任务的描述
    type: StudyType //子任务类型
    rate?: number //子任务评分 1-5
}

export enum StudyType {
    video, //视频
    exercise, //课后练习
    read //读书

}

type TaskProps = {
    task: Task
    finished: boolean
}

function Task(props: TaskProps) {
    const task = props.task;
    let finished = task.subTask.filter(subTask => subTask.status == SubTaskState.Finished).length
    let progress = (finished / task.subTask.length) * 100 //求得进度

    const [isModalVisible, setIsModalVisible] = useState(false);

    //查看详情
    const showModal = () => {
        setIsModalVisible(true)
    }
    const handleOk = () => {
        setIsModalVisible(false)
    }
    const handleCancel = () => {
        setIsModalVisible(false)
    }
    //对话框显示任务详细信息
    const modal = () => {
        if (props.finished) {
            //含有评分的time line
            const subTaskTimeLineWithRate = task.subTask.map(subTask => (
                <Timeline.Item color={"green"}
                               label={subTask.name}>
                    <Tooltip title={`${subTask.name} 评价等级为 ${subTask.rate}`}>
                        {subTask.description} <Rate allowHalf disabled value={subTask.rate}/>
                    </Tooltip>
                </Timeline.Item>
            ))
            //已完成的任务的详细信息
            return (
                <>
                    <Modal centered visible={isModalVisible} title={task.name} onOk={handleOk} onCancel={handleCancel}
                           cancelText={"返回"} okText={"确认"}>
                        <Typography>
                            <Title level={3}>
                                任务介绍
                            </Title>
                            <Paragraph>
                                {task.description}
                            </Paragraph>
                            <Title level={3}>
                                任务最终目的
                            </Title>
                            <Paragraph>
                                {task.goal}
                            </Paragraph>

                            <Divider/>
                            <Title level={3}>
                                包含的子任务
                            </Title>
                        </Typography>
                        <br/>
                        <Timeline mode={"left"}>
                            {
                                subTaskTimeLineWithRate
                            }
                        </Timeline>
                        <Divider/>
                        <Typography>
                            <Title level={3}>
                                总评分等级:
                            </Title>
                        </Typography>
                        <Tooltip title={`${task.name} 最终评分为 ${task.rate}`}>
                            <div style={{margin: "0 auto", textAlign: "center"}}>
                                <Rate value={task.rate} allowHalf disabled/>
                            </div>

                        </Tooltip>
                    </Modal>
                </>
            )
        } else {
            //子任务时间线
            const subTaskTimeLine = task.subTask.map(subTask => <Timeline.Item
                label={subTask.name}>{subTask.description}</Timeline.Item>)

            //未完成的任务的详细信息
            return (
                <>
                    <Modal centered visible={isModalVisible} title={task.name} onOk={handleOk} onCancel={handleCancel}
                           cancelText={"取消"} okText={"接受任务"}>
                        <Typography>
                            <Title level={3}>
                                任务介绍
                            </Title>
                            <Paragraph>
                                {task.description}
                            </Paragraph>
                            <Title level={3}>
                                任务最终目的
                            </Title>
                            <Paragraph>
                                {task.goal}
                            </Paragraph>

                            <Divider/>
                            <Title level={3}>
                                包含的子任务
                            </Title>
                        </Typography>
                        <br/>
                        <Timeline mode={"left"}>
                            {
                                subTaskTimeLine
                            }
                        </Timeline>
                    </Modal>
                </>
            )
        }
    }
    //按键 查看详情 // 查看评分
    const taskButton = () => {
        if (props.finished) {
            return (
                <>
                    <Row style={{paddingBottom: "10px"}}>
                        <Rate value={task.rate} disabled={true}/>
                    </Row>
                    <Row>
                        <Button type={"primary"} danger onClick={() => showModal()}>查看详细评分</Button>
                    </Row>
                </>
            )
        } else {
            return <Button type={"primary"} onClick={() => showModal()}>查看详情</Button>
        }
    }
    return (

        <>
            <Card className={classes.card} title={<h3 style={{textAlign: "left"}}>{task.name}</h3>}>
                <Row align={"middle"}>
                    <Col span={2}>
                        <DatabaseFilled style={{fontSize: "40px"}}/>
                    </Col>
                    <Col span={18}>
                        <Row>
                            <h1>{task.description}</h1>
                        </Row>
                        <Row>
                            <h1 style={{color: "#40A9FF"}}>学习目的:</h1> <h1> {task.goal}</h1>
                        </Row>
                    </Col>
                    <Col span={4}>
                        {taskButton()}
                    </Col>
                </Row>
            </Card>
            {
                modal()
            }

        </>
    )
}


const TaskUiComponent=(props:TaskUiProps) => {

    const uiState = props.taskUiState;
    const list = uiState.taskList;
    const [tabKey, setTabKey] = useState("unfinished");
    //创建task列表
    const taskList = (key: string) => {
        if (key == "unfinished") {  //未完成的任务
            return list.map(task => <Task key={task.uuid} task={task} finished={false}/>)
        } else { //已完成的任务
            return list.map(task => <Task key={task.uuid} task={task} finished={true}/>)
        }
    }

    const closeTask = () => {
        uiState.setShowing(false)
    }

    return (
        <>

            <div className={`${classes.main} ${uiState.isShowing ? "" : classes.none}`}>
                <div className={classes.taskTab}>
                    <Layout className={classes.tab}>
                        {/*侧边栏*/}
                        <Sider theme={"light"} collapsed={false}>
                            <div className={"logo"}>
                                <CodepenCircleOutlined style={{
                                    fontSize: "50px",
                                    margin: "0 0 0  30px",
                                    paddingTop: "7px",
                                    paddingBottom: "7px"
                                }}/>
                            </div>
                            <Menu mode={"inline"} defaultSelectedKeys={["unfinished"]}
                                  onClick={menuInfo => setTabKey(menuInfo.key.toString())}>
                                <Menu.Item key={"unfinished"}>未完成</Menu.Item>
                                <Menu.Item key={"finished"}>已完成</Menu.Item>
                            </Menu>
                        </Sider>

                        <Layout>
                            <Header style={{padding: 0, background: "white"}}>
                                <Typography>
                                    <Title level={2} style={{textAlign: "center", lineHeight: "64px"}}>
                                        任务中心
                                    </Title>
                                </Typography>
                                <Button className={classes.closeButton} icon={<CloseOutlined/>} type={"primary"}
                                        onClick={closeTask}/>
                            </Header>
                            <Content style={{
                                margin: '24px 16px',
                                padding: 24,
                                overflow: "auto"
                            }}>
                                {
                                    taskList(tabKey)
                                }
                            </Content>
                        </Layout>
                    </Layout>
                </div>
            </div>

        </>
    )
}
const TaskUi = observer<TaskUiProps>(TaskUiComponent)

export default TaskUi
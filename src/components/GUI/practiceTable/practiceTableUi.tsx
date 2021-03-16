import usePracticeTableUiState, {
    PracticeSubTask,
    PracticeSubTaskType,
    PracticeTableUiState
} from "./practiceTableUiState";
import {observer} from "mobx-react-lite";
import React, {ChangeEvent, useState} from "react";
import classes from "./practiceTableUi.module.css"
import {Button, Card, Col, Progress, Radio, Row, Tooltip} from "antd";
import {AppstoreOutlined, CheckOutlined, CloseOutlined, CloseSquareOutlined} from "@ant-design/icons";
import Layout, {Content, Header} from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import TextArea from "antd/es/input/TextArea";
import {RadioChangeEvent} from "antd/es";
import Modal from "antd/es/modal/Modal";
import {LoadError, PageChangeEvent, Viewer, Worker} from "@react-pdf-viewer/core";
import '@react-pdf-viewer/core/lib/styles/index.css';
import usePlayerUiState from "../player/playerUiState";
import {StudyType} from "../task/taskUi";

type PracticeProps = {
    task: PracticeSubTask
    index: number
}
const PracticeChoice = (props: PracticeProps) => {   //选择题
    const choiceTask = props.task;
    const choices = choiceTask.choice!;
    const practiceTableUiState = usePracticeTableUiState;

    const onChange = (event: RadioChangeEvent) => {
        practiceTableUiState.practiceAnswer[props.index].answer = event.target.value
    }
    const radioChoice = () => {
        const colSpan = 24 / choices.length //宽度
        return choices.map((choice, index) => (
            <Col span={colSpan}>
                <Radio value={index}>{choice}</Radio>
            </Col>
        ))
    }
    return (
        <Card className={classes.taskCard} title={`${props.index + 1}.${choiceTask.name}`}
              extra={<h1 style={{color: "#40A9FF"}}>{choiceTask.score}分</h1>}>
            <Radio.Group name="radiogroup" style={{width: "100%"}} onChange={onChange}>
                <Row>{radioChoice()}</Row>
            </Radio.Group>
        </Card>
    )
}


const PracticeCode = (props: PracticeProps) => {
    const codeTask = props.task;
    const practiceTableUiState = usePracticeTableUiState;

    const onChange = (event: ChangeEvent) => {
        practiceTableUiState.practiceAnswer[props.index].answer = event.target.innerHTML
    }
    return (
        <Card className={classes.taskCard} title={`${props.index + 1}.${codeTask.name}`}
              extra={<h1 style={{color: "#40A9FF"}}>{codeTask.score}分</h1>}>
            <TextArea rows={4} placeholder={"在这里粘贴代码"} onChange={onChange}/>
        </Card>
    )
}

const PracticeFillInBlank = (props: PracticeProps) => {
    const fillInBlankTask = props.task;
    const practiceTableUiState = usePracticeTableUiState;

    const onChange = (event: ChangeEvent) => {
        practiceTableUiState.practiceAnswer[props.index].answer = event.target.innerHTML
    }

    return (
        <Card className={classes.taskCard} title={`${props.index + 1}.${fillInBlankTask.name}`}
              extra={<h1 style={{color: "#40A9FF"}}>{fillInBlankTask.score}分</h1>}>
            <TextArea rows={4} placeholder={"在这里简要回答"} onChange={onChange}/>
        </Card>
    )
}

const PracticeQuestions = (props: PracticeProps) => {
    const questionTask = props.task;
    const practiceTableUiState = usePracticeTableUiState;

    const onChange = (event: ChangeEvent) => {
        practiceTableUiState.practiceAnswer[props.index].answer = event.target.innerHTML
    }

    return (
        <Card className={classes.taskCard} title={`${props.index + 1}.${questionTask.name}`}
              extra={<h1 style={{color: "#40A9FF"}}>{questionTask.score}分</h1>}>
            <TextArea rows={4} placeholder={"在这里简要回答"} onChange={onChange}/>
        </Card>
    )
}


type PracticeTableUiProps = {
    uiState: PracticeTableUiState
}
const PracticeTableUi = observer<PracticeTableUiProps>((props) => {

        const uiState = props.uiState;
        const practiceDetail = uiState.currentPracticeDetail!;
        const [visible, setVisible] = useState(false);
        const eReaderClose = () => {
            uiState.setEBookReaderShowing(false)
            uiState.currentEBook?.moveToOriginStepOne()

        }
        const practiceClose = () => { //关闭练习
            uiState.setPracticeShowing(false)
        }

        const submit = () => {   //练习提交
            setVisible(true)
        }
        const practiceContent = () => {

            let content = practiceDetail.subTasks.map((subTask, index) => {
                switch (subTask.type) {
                    case PracticeSubTaskType.choice:
                        return (<PracticeChoice task={subTask} index={index}/>)
                    case PracticeSubTaskType.code:
                        return (<PracticeCode task={subTask} index={index}/>)
                    case PracticeSubTaskType.fillInBlank:
                        return (<PracticeFillInBlank task={subTask} index={index}/>)
                    case PracticeSubTaskType.questions:
                        return (<PracticeQuestions task={subTask} index={index}/>)
                }


            })

            return content
        }
        const hideModal = () => {
            setVisible(false)
        }
        const handleOk = () => { //确认提交
            setVisible(false)
            uiState.submit()
        }
        const closeTable = () => {
            uiState.setPracticeTableShowing(false)
            uiState.web3DStudio?.setPracticeTableShow(false)
        }
        const confirmContent = () => {
            const unFinishedPracticeCount = uiState.unFinishedPracticeCount;
            console.log(unFinishedPracticeCount)
            if (unFinishedPracticeCount != 0) {
                return <p>您还有{unFinishedPracticeCount}道题目未答,是否提交?</p>
            } else
                return <p>你已完成所有题目,可以提交</p>
        }


        return (<>

                <div className={`${classes.practiceTableCloseArea} ${uiState.practiceTableShowing ? "" : classes.none}`}>
                    <Tooltip title={"关闭练习台"}>
                        <Button type={"primary"}
                                icon={<CloseSquareOutlined style={{fontSize: "50px"}} onClick={closeTable}/>}
                                className={classes.practiceTableCloseButton}/>
                    </Tooltip>
                </div>

                <div className={`${classes.eBookReaderClose} ${uiState.eBookReaderShowing ? "" : classes.none}`}>
                    <Tooltip title={"关闭电子书"}>
                        <Button type="primary"
                                icon={<CloseSquareOutlined style={{fontSize: "40px"}} onClick={eReaderClose}/>}
                                className={classes.closeButton}/>
                    </Tooltip>
                </div>
                {/*电子书部分*/}

                <EBookReader  eBookReaderShowing={uiState.eBookReaderShowing} eBookUUID={uiState.currentEBookDetail.uuid}
                             eBookFile={uiState.currentEBookDetail ? uiState.currentEBookDetail.bookURL : "src/assets/pdf/Java.pdf"}/>
                <div className={`${classes.practiceArea} ${uiState.practiceShowing ? "" : classes.none}`}>
                    <Layout style={{height: "100%"}}>
                        <Sider className={classes.practiceSider} theme={"light"}>
                            <Row align={"middle"} justify={"center"} style={{height: "64px"}}>
                                <Col span={2}/>
                                <Col span={6}>
                                    <div className={classes.centerButton}>
                                        <AppstoreOutlined style={{
                                            fontSize: "40px",
                                        }}/>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <h1 className={classes.centerText}>
                                        练习中心
                                    </h1>
                                </Col>
                                <Col span={4}/>
                            </Row>

                        </Sider>
                        <Layout className={classes.practiceMainArea}>
                            <Header className={classes.practiceHeader}>
                                <Row justify={"center"} align={"middle"}>
                                    <Col span={20}>
                                        <h1 className={classes.centerText}>{practiceDetail?.name}</h1>
                                    </Col>
                                    <Col span={2}>
                                        <Button type="primary" icon={<CheckOutlined/>} size={"large"}
                                                className={classes.centerButton} onClick={submit}
                                        >
                                            提交
                                        </Button>
                                    </Col>

                                    <Col span={2}>
                                        <Button type="default" danger icon={<CloseOutlined/>} size={"large"}
                                                className={classes.centerButton} onClick={practiceClose}
                                        >
                                        </Button>
                                    </Col>
                                </Row>
                            </Header>

                            <Content style={{padding: "24px"}} className={classes.practiceContentArea}>
                                {practiceContent()}
                            </Content>
                        </Layout>
                    </Layout>
                </div>


                <Modal
                    title="确认提交练习"
                    visible={visible}
                    onOk={handleOk}
                    onCancel={hideModal}
                    okText="确认"
                    cancelText="取消"
                >
                    {confirmContent()}
                </Modal>
            </>
        )
    }
)


type EBookReaderProps =
    {
        eBookReaderShowing: boolean,
        eBookFile: string
        eBookUUID:number
    }
const EBookReader = (props: EBookReaderProps) => {
    const eBookRenderLoader = (percentages: number) => {
        return (
            <div className={classes.eBookReaderLoaderProgressArea}>

                <Progress
                    strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                    }}
                    status={"active"}
                    percent={percentages} className={classes.eBookReaderLoaderProgress}
                    format={percent => `加载中 ${percent?.toFixed(0)}%`}/>
            </div>
        )
    }
    const eBookRenderError = (error: LoadError) => {
        return (
            <>
                <h1>错误</h1>
                <h2>{error.name}</h2>
                <p>{error.message}</p>
            </>
        )
    }
    const eBookOnPageChange = (e: PageChangeEvent) => {  //检查是否读书完毕
        const progress = ((e.currentPage+1) / e.doc.numPages) * 100
        const playerUiState = usePlayerUiState;
        playerUiState.updateCurrentSubTaskProgress(StudyType.read,props.eBookUUID,progress) //更新进度
    }

    return (
        <div className={`${classes.eBookReaderArea} ${props.eBookReaderShowing ? "" : classes.none}`}>
            <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js">
                <Viewer
                    fileUrl={props.eBookFile}
                    renderLoader={eBookRenderLoader} renderError={eBookRenderError}
                    onPageChange={eBookOnPageChange}/>
            </Worker>
        </div>
    )
}

export default PracticeTableUi

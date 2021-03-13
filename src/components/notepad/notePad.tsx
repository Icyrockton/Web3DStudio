import MarkdownIt from 'markdown-it'
import React, {useEffect, useState} from 'react';
import 'react-markdown-editor-lite/lib/index.css';
import classes from "./notePad.module.css"
import Layout, {Content, Header} from "antd/es/layout/layout";
import {Button, Col, Input, Menu, Row, Space} from "antd";
import {createLocalStorageStateHook} from "use-local-storage-state";
import Sider from "antd/es/layout/Sider";
import 'antd/dist/antd.css';
import MdEditor from 'react-markdown-editor-lite'
import {DeleteFilled, HighlightOutlined, PlusCircleFilled, PlusCircleTwoTone} from "@ant-design/icons";
import Paragraph from "antd/es/typography/Paragraph";


const markDownParser = new MarkdownIt(); //markdown解析器


interface NotePad {  //笔记本
    key: string, //键
    title: string,  //标题
    content: string  //内容
}

type NotePadProps = {}

const fakeNotepads: NotePad[] = [
    {
        key: "0",
        title: "笔记1",
        content: "# 内容1"
    },
    {
        key: "1",
        title: "笔记2",
        content: "# 内容2"
    },
    {
        key: "2",
        title: "笔记3",
        content: "# 内容3"
    },
]


const useNotePads = createLocalStorageStateHook<NotePad[]>("notePadData", fakeNotepads);
const NotePad = (props: NotePadProps) => {
    const [notePads, setNotePads] = useNotePads();
    const [isShowing, setShowing] = useState(false);

    let defaultKey = ""
    if (notePads.length >= 1) {
        defaultKey = notePads[0].key
    }

    const [tabKey, setTabKey] = useState<string>(defaultKey);
    const [collapse, setCollapse] = useState(true);
    const notePadItem = () => {
        return notePads.map((notePad, index) =>
            <Menu.Item key={notePad.key}>{notePad.title}</Menu.Item>
        )
    }

    const updateContent = (data: {
        text: string;
        html: string;
    }) => {
        setNotePads((prevNotePad) => {
            let notePad = notePads.find(notePad => notePad.key == tabKey)!;
            notePad.content = data.text
            return prevNotePad
        })
    }
    const updateNotePadTitle = (newTitle: string) => {
        setNotePads((prevNotePad) => {
            let notePad = notePads.find(notePad => notePad.key == tabKey)!;
            notePad.title = newTitle
            return prevNotePad
        })
    }

    const deleteNotePad = () => {
        if (notePads.length == 1) //只剩一个的时候不允许删除
            return
        let copyNotePad = [...notePads]
        let notePad = copyNotePad.find(notePad => notePad.key == tabKey)!;
        let index = copyNotePad.indexOf(notePad, 0);
        if (index >= 0) {
            if (index - 1 >= 0)
                setTabKey(copyNotePad[index - 1].key)
            else
                setTabKey(copyNotePad[copyNotePad.length - 1].key)
            copyNotePad.splice(index, 1);
            setNotePads(copyNotePad)
        } else
            return
    }

    const addNewNotePad = () => {
        const key = Number(notePads[notePads.length - 1].key) + 1;
        let newNotePad = {
            title: `笔记-${key}`,
            content: "# 标题",
            key: key.toString()
        } as NotePad
        notePads.push(newNotePad)
        setTabKey(newNotePad.key)
        setNotePads(notePads)
    }

    const notePadEditor = (tabKey: string) => {
        let notePad = notePads.find(notePad => notePad.key == tabKey)!;
        const editor = (<MdEditor value={notePad.content}
                                  style={{height: "100%"}}
                                  renderHTML={(text) => markDownParser.render(text)}
                                  onChange={updateContent}/>)

        return (
            <>
                <Header className={classes.header}>
                    <Row justify={"center"} align="middle">
                        <Col span={20}>
                            <Input value={notePad.title} className={classes.editTitle}
                                   onChange={event => updateNotePadTitle(event.target.value)}/>
                        </Col>

                        <Col span={4}>
                            <Button type="primary" shape="round" danger={true} icon={<DeleteFilled/>} size={"large"}
                                 disabled={notePads.length == 1}     className={classes.centerButton} onClick={deleteNotePad}>
                                删除
                            </Button>
                        </Col>


                    </Row>
                </Header>
                <Content style={{
                    padding: "24px"
                }}> {editor}
                </Content>
            </>
        )
    }

    const hint = () => {
        if (isShowing)
            return "关闭笔记本"
        else
            return "打开笔记本"
    }
    return (
        <>
            <div className={`${classes.notePad} ${isShowing ? classes.notePadSlide : ""}`}>
                <div className={classes.slideButton} onClick={() => setShowing(!isShowing)}>
                    <h2 className={classes.slideButtonText}>
                        {hint()}
                    </h2>
                </div>
                <div className={classes.notePadEditor}>
                    <Layout style={{height: "100%"}}>
                        {/*侧边栏*/}
                        <Sider className={classes.notePadSider} theme={"light"}>
                            <div className={classes.newNote}>
                                <Button type="primary" shape="round" icon={<PlusCircleFilled/>} size={"large"}
                                        onClick={addNewNotePad}>
                                    新建笔记
                                </Button>
                            </div>
                            <Menu theme={"light"} mode={"inline"} selectedKeys={[tabKey]}
                                  onClick={info => setTabKey(info.key.toString())}>
                                {notePadItem()}
                            </Menu>
                        </Sider>
                        <Layout className={classes.notePadArea}>

                            {
                                notePadEditor(tabKey)
                            }
                        </Layout>
                    </Layout>
                </div>

            </div>
        </>
    )
}

export default NotePad
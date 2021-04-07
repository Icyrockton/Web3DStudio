import MarkdownIt from 'markdown-it'
import React, {useEffect, useState} from 'react';
import 'react-markdown-editor-lite/lib/index.css';
import classes from "./notePad.module.css"
import Layout, {Content, Header} from "antd/es/layout/layout";
import {Button, Col, Input, Menu, Row, Space, Tooltip} from "antd";
import {createLocalStorageStateHook} from "use-local-storage-state";
import Sider from "antd/es/layout/Sider";
import 'antd/dist/antd.css';
import MdEditor from 'react-markdown-editor-lite'
import {
    CloseCircleFilled, CloseOutlined, CloseSquareFilled,
    DeleteFilled,
    FormOutlined,
    HighlightOutlined,
    PlusCircleFilled,
    PlusCircleTwoTone
} from "@ant-design/icons";
import Paragraph from "antd/es/typography/Paragraph";
import {Rnd} from "react-rnd";
import usePlayerUiState, {PlayerState} from "../GUI/player/playerUiState";
import {observer} from "mobx-react-lite";
import useNavUiState from "../GUI/nav/navUiState";


const markDownParser = new MarkdownIt(); //markdown解析器


interface NotePad {  //笔记本
    key: string, //键
    title: string,  //标题
    content: string  //内容
}

type NotePadProps = {
    uiState:PlayerState
}

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
const NotePad = observer<NotePadProps>((props: NotePadProps) => {
    const [notePads, setNotePads] = useNotePads();
    const [isShowing, setShowing] = useState(false);

    const playerUiState = props.uiState;
    let defaultKey = ""
    if (notePads.length >= 1) {
        defaultKey = notePads[0].key
    }

    const [tabKey, setTabKey] = useState<string>(defaultKey);
    const [collapse, setCollapse] = useState(true);
    const [xy, setXy] = useState({x: 80, y: 400});
    const [size, setSize] = useState({width: "200px", height: "300px"});
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

    const closeNotePad=()=>{
        setShowing(false)
        useNavUiState.navController?.focusCanvas() //聚焦canvas
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
                        <Col span={18} className={"no-drag"}>
                            <Input value={notePad.title} className={classes.editTitle}
                                   onChange={event => updateNotePadTitle(event.target.value)}/>
                        </Col>

                        <Col span={4}>
                            <Button type="primary" shape="round" danger={true} icon={<DeleteFilled/>} size={"large"}
                                    disabled={notePads.length == 1} className={classes.centerButton}
                                    onClick={deleteNotePad}>
                                删除
                            </Button>
                        </Col>
                        <Col span={2}>
                            <Button type="default" icon={<CloseOutlined/>} size={"large"}
                                    className={classes.centerButton} onClick={closeNotePad}
                            >
                            </Button>
                        </Col>

                    </Row>
                </Header>
                <Content style={{
                    padding: "24px"
                }} className={"no-drag"}> {editor}
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
            <div className={`${classes.openButtonArea} ${playerUiState.isShowing ? "" : classes.none} `}>
                <Tooltip title={hint()}>
                    <Button icon={<FormOutlined style={{fontSize: "30px"}}/>} shape={"circle"}
                            onClick={() => setShowing(!isShowing)}
                            onMouseEnter={ ()=> usePlayerUiState.studioManager?.playSelectSound()}
                            className={classes.openButton}/>
                </Tooltip>
            </div>


            <Rnd size={{width: size.width, height: size.height}}
                 className={` ${isShowing ? "" : classes.none}`}
                 position={{x: xy.x, y: xy.y}}
                 onDragStop={(e, data) => setXy({x: data.x, y: data.y})}
                 onResizeStop={(e, direction, ref, delta, position) => {
                     setSize({
                         width: ref.style.width,
                         height: ref.style.height,
                     });
                 }}
                 minWidth={"40%"}
                 minHeight={"40%"}
                 maxWidth={"80%"}
                 maxHeight={"80%"}
                 cancel={".no-drag"}
                 enableResizing={
                     {bottom: true, right: true, bottomRight: true}
                 }
            >
                <div className={classes.dragArea}>

                </div>
                <div className={`${classes.notePadEditor} no-drag`}>
                    <Layout style={{height: "100%"}}>
                        {/*侧边栏*/}
                        <Sider className={`${classes.notePadSider} `} theme={"light"}>
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
            </Rnd>
        </>
    )
})

export default NotePad

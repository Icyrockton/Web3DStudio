import React, {useEffect, useState} from "react";
import {observer} from "mobx-react-lite";
import {CollegeUiState} from "./collegeUiState";
import {Card, Divider, Typography, List} from "antd/es";
import 'antd/dist/antd.css';
import {SimpleStudio} from "../../../core/collegeMap/college";
import classes from './collegeUi.module.css'
import {LoadingOutlined} from "@ant-design/icons";

type CollegeUiProps = {
    uiState: CollegeUiState
}

const CollegeUiComponent = (props: CollegeUiProps) => {
    const college = props.uiState.college;

    let content

    const {x, y} = useMousePosition();
    const {width, height} = useWindowDimensions();
    const isLeft = () => (x / width <= 0.5);
    if (college) {
        const studios = college.studios.map(studio => {
            return (
                <div className={classes.singleStudio}>
                    <img src={studio.logoUrl} className={classes.logo}/>
                    <span>{studio.name}</span>
                </div>
            )
        })
        content = (<>
                <div className={classes.cardSideBar}>
                    <img src={college.imgUrl} className={classes.cardImg}/>
                    <h2>{college.name}</h2>
                </div>
                <div className={classes.cardInfo}>
                    <h2>学院介绍</h2>
                    <p>{college.description}</p>
                    <h2>工作室</h2>
                    <div className={classes.studio}>
                        {studios}
                    </div>
                </div>
            </>
        )
    } else {
        content = (<>
                <div className={classes.loading}>
                    <LoadingOutlined style={{fontSize: 35}} spin/>
                    <h2>加载中...</h2>
                </div>

            </>
        )
    }

    return (
        <div
            className={`${isLeft() ? classes.collegeUIRight : classes.collegeUILeft} 
            ${props.uiState.isShowing ? (isLeft() ? classes.collegeUIShowRight : classes.collegeUIShowLeft) : ""}`}>
            {content}
        </div>
    )
}
const CollegeUi = observer<CollegeUiProps>(CollegeUiComponent)

export default CollegeUi

const useMousePosition = () => {
    const [mousePosition, setMousePosition] = useState({x: 0, y: 0});

    const updateMousePosition = (event: MouseEvent) => {
        setMousePosition({x: event.clientX, y: event.clientY});
    };

    useEffect(() => {
        window.addEventListener("mousemove", updateMousePosition);

        return () => window.removeEventListener("mousemove", updateMousePosition);
    }, []);

    return mousePosition;
};

const useWindowDimensions = () => {
    const [windowDimensions, setWindowDimensions] = useState({width: 0, height: 0});
    const updateWindowDimensions = (event: UIEvent) => {
        setWindowDimensions({width: window.innerWidth, height: window.innerHeight});
    };
    useEffect(() => {
        window.addEventListener("resize", updateWindowDimensions);

        return () => window.removeEventListener("mousemove", updateWindowDimensions);
    }, []);

    return windowDimensions
}

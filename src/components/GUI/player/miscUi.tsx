import React from "react";
import {useEffect, useState} from "react";
import classes from './miscUi.module.css'
import {__VERSION__} from "../../../global";

export const MiscUi = () => {
    const [date, setDate] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => {
            setDate(new Date())
        }, 1000)
        return () => clearInterval(interval) //防止内存泄漏
    })
    return (
        <div className={classes.miscTab}>
            <h1 className={classes.version}>
                {__VERSION__}
            </h1>
            <h1 className={classes.clock}>
                系统时间 {date.toLocaleTimeString("chinese", {hour12: false})}
            </h1>

        </div>
    )
}





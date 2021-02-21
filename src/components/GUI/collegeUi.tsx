import React from "react";
import {observer} from "mobx-react-lite";
import {CollegeUiState} from "./collegeUiState";
import './ui.css'
import {Card, CardContent, CardMedia, makeStyles, Typography} from "@material-ui/core";
import {Skeleton} from "@material-ui/lab";

type CollegeUiProps = {
    uiState: CollegeUiState
}

const useStyles = makeStyles({
    media:{

        height:140
    },
})

const CollegeUi = observer<CollegeUiProps>(props => {
    const classes = useStyles()
    const college = props.uiState.college;

    let content
    if (college) {
        content = (<>
                <img src={college.imgUrl} className={"cardImg"}/>
                <CardContent>
                    <Typography gutterBottom  variant="h5" component="h2">
                        {college.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" component="p">
                        {college.description}
                 </Typography>

                </CardContent>
            </>
        )
    } else {
        content = (<>
                <h1>无内容</h1>
            </>
        )
    }


    return (

        <Card variant={"outlined"} className={`collegeUI ${props.uiState.isShowing ? "" : "none"}`}>
            {
                content
            }
        </Card>

    )
})

export default CollegeUi
import { Scene } from "@babylonjs/core";
/*
    学院的集合
*/


class CollegeMap{

    private colleges = []; //所有的学院
    private scene:Scene
    constructor(scene:Scene){
        this.scene=scene

    }

    in(){ //鼠标进入学院边界时... 
        
    }

    out(){ //鼠标退出学院边界时
        
    }

    startAnimation(){ //当鼠标进入边界内部时，开启边界动画
        
    }

    setAnimation(){ //设置动画
        console.log('设置动画');
        
    }
}
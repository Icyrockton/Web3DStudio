import { Scene, SceneLoader, TransformNode, Vector3 } from "@babylonjs/core";
import { __DEBUG__ } from "../../global";
import { College, CollegePosition } from "./college";




export class CollegeManager { //加载学院相关的资源

    static collegeMap: College[] = [
        { name: '北京三维学院', modelUrl: 'src/assets/model/building/building_1.glb', position: CollegePosition.A },
        { name: '成都精通学院', modelUrl: 'src/assets/model/building/building_2.glb', position: CollegePosition.B }
    ]
    static map = {
        name: 'map',
        modelUrl: 'src/assets/model/map.glb'
    }

    private _scene: Scene

    constructor(scene: Scene) { //学院场景
        this._scene = scene
    }


    async loadMap() {

        //加载地图
        await SceneLoader.AppendAsync(CollegeManager.map.modelUrl, undefined, this._scene)

        //找到建筑物的坐标位置
        let positionMap = new Map<College, Vector3>()
        this._scene.transformNodes.forEach((node) => {
            for (let i = 0; i < CollegeManager.collegeMap.length; i++) {
                const college = CollegeManager.collegeMap[i];
                
                if (college.position == node.name) {
                    positionMap.set(college, node.position)
                }
            }
        })
        
        //检查地图数据是否出错
        if(positionMap.size != CollegeManager.collegeMap.length){
            if(__DEBUG__){
                console.log('地图数据错误');
                console.log(positionMap);
                
            }
            return
        }

        
        //加载学院建筑
        for (let i = 0; i < CollegeManager.collegeMap.length; i++) {
            const college = CollegeManager.collegeMap[i];
            let node = new TransformNode(college.name,this._scene)
            let loadMesh=await SceneLoader.ImportMeshAsync("", college.modelUrl,undefined,this._scene)
            //设置父级
            loadMesh.meshes[0].parent=node
            //设置建筑物位置
            let positon=positionMap.get(college)!
            //x坐标好像是相反数? 
            node.position.set(-positon.x,positon.y,positon.z)
        }



    }





}
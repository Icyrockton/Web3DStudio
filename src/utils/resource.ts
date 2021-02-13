import { ResourceManager } from "./resourceManager";


export class Resource { //资源的集合
    private manager: ResourceManager


    constructor(manager: ResourceManager) {
        this.manager = manager
        this.loadMesh() 
    }


    loadMesh():void {
        this.manager.addMeshTask()
    }
}
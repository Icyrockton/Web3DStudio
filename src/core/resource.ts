import React from "react";

interface MeshResource {
    meshName: string
    rootUrl: string
    fileName: string
}


const meshResource: MeshResource[] = [
    {meshName: 'LoadingCube', rootUrl: '../assets/model', fileName: 'cubeLoading.glb'} // 加载界面的立方体
]
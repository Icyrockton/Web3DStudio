import {College, CollegeDescription, CollegePosition, SimpleStudio} from "./college";
import {Vector3} from "@babylonjs/core";
import {CollegeMap} from "./collegeMapManager";

//API 数据
export const colleges: College[] = [
    {
        uuid: 1,
        name: '北京三维学院',
        modelUrl: 'model/building/building_1.glb',
        position: CollegePosition.A,
        scale: [1, 1, 1],
        rotation: [0, Math.PI, 0]
    },
    {
        uuid: 2,
        name: '成都精通学院',
        modelUrl: 'model/building/building_2.glb',
        position: CollegePosition.B,
        scale: [1, 1, 1],
        rotation: [0, Math.PI, 0]
    }
]

export const fakeCollegeMap: CollegeMap = {
    colleges: colleges,
    mapModelURL: "model/map.glb"
}

export const studio: SimpleStudio[] = [
    {
        uuid: 1,
        description: "Java介于编译型语言和解释型语言之间。编译型语言如C、C++，代码是直接编译成机器码执行，但是不同的平台（x86、ARM等）CPU的指令集不同，因此，需要编译出每一种平台的对应机器码。解释型语言如Python、Ruby没有这个问题",
        logoUrl: "img/studioLogo/JAVALogo.png",
        name: "JAVA高并发工作室"
    },
    {
        uuid: 2,
        description: "Android是基于Linux系统的开源操作系统，是由Andy Rubin于2003年在美国加州创建",
        logoUrl: "img/studioLogo/AndroidLogo.png",
        name: "Android旋律工作室"
    }
]

export const collegeDescription: CollegeDescription[] = [
    {
        uuid: 1,
        name: '北京三维学院',
        position: '北京市朝阳区',
        description: `北京三维学院是顶点着色器小组着力打造的在线网校，以适应高等教育和信息科学技术学科的发展，满足未来社会信息化和智能化的需求。本学院致力于为职场人士、在读学生、计算机爱好者提供虚拟真实的在线教育。目前学院下设UI设计工作室、软件测试工作室、游戏工作室、JAVA工作室、Python工作室、大数据工作室等十余间独立工作室，充分尊重用户的多元需求。希望北京三维学院的个性化教育服务能帮助您掌握专业知识，提高职业技能，轻松稳赢职场。`,
        studios: studio,
        imgUrl: 'img/buildingSnapshot/BeiJing.png'
    },
    {
        uuid: 2,
        name: '成都精通学院',
        position: '四川省成都市',
        description: `成都精通学院是随着时代和职场学习需求发展起来的学院，背靠文思海辉技术有限公司，
        致力于为职场人士以及即将参加工作的学生提供可视化的在线教育服务。
        目前学院下设JAVA工作室、Android工作室、Python工作室、大数据工作室、机器人工作室等十余间独立工作室，
        基本能够满足不同用户的个性化需要。漫步学院之中，您将获得身临其境般的体验，希望您增长知识的同时，
        能够感受学习本身的无限乐趣。`,
        studios: studio,
        imgUrl: 'img/buildingSnapshot/ChengDu.png'
    }
]


export async function fetchCollgeDescription(collegeName: string) {
    await setTimeout(() => {
    }, 5000)
    const collgeDescription = collegeDescription.find((value =>
            value.name === collegeName
    ));
    return collgeDescription
}

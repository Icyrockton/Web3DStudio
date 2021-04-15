import {ReceptionistConfig, Studio} from "./Studio";
import {Vector3} from "@babylonjs/core";
import {
    AI_ReceptionistDescription,
    JAVA_ReceptionistDescription
} from "../../components/GUI/receptionist/receptionistUiState";


export const  fakeStudio_Java:Studio = {
    uuid:1,
    name: "java工作室",
    modelURL: "model/studio/java_studio.glb",
    playerModelURL: "model/player.glb",
    description: "java工作室 一个学习高并发的工作室",
    playerSpawn: "playerSpawn",
    playerRotateYAxis:0,
    collisionBox: ["collision", "ground"],
    groundName: "ground",
    receiveShadowName:["ground"],
    groundLightMapUrl:"model/studio/java_studio_lightMap.png",
    playerAvatarURL: "img/avatar/playerAvatar.png",
    directionalLightPosition: [-10,10,-10],
    directionalLightDirection:[1,-2,1],
    bookShelfStartName: "BookShelf",
    practiceTableStartName: "PracticeTable",
    miniMap :"miniMap",
    receptionistConfig: {
        receptionistModelURL: "model/receptionist.glb",
        receptionistSpawn: "receptionistSpawn",
        receptionistRotateYAxis: Math.PI / 2,
        distanceTrigger: 2,
        greetingSoundURL: "sound/java/javaGreeting.mp3",
        introductionSoundURL: "sound/java/javaIntroduction.mp3"
    } ,
    rotateCamera: [
        {mesh: "cameraRotate_1", rotate: 0},
        {mesh: "cameraRotate_2", rotate: -Math.PI / 2},
        {mesh: "cameraRotate_3", rotate: Math.PI / 2},
        {mesh: "cameraRotate_4", rotate: 0},
        {mesh: "cameraRotate_5", rotate: Math.PI},
    ],
    studioAIs: [
        {
            name: "黄奥",
            info: ["同学，你今天Java学习的怎么样了", "JDK是JAVA的开发工具包"],
            infoSoundURL:["sound/java/ai/How's_java_learning_going.mp3","sound/java/ai/JDK.mp3"],
            title: "Java高级工程师",
            position: "Java高级工程师",
            modelURL: "model/ai/ai_1.glb",
            idleAnimationGroupName: "Idle",
            walkAnimationGroupName: "Walk",
            leftTurnAnimationGroupName: "LeftTurn",
            rightTurnAnimationGroupName: "RightTurn",
            avatarURL: "img/avatar/ai_1.png",
            miniMapAvatarURL:"img/miniMap/ai_1.png",
            path: [
                {
                    nodeName: "aiPath-1.001",
                    residenceTime: 4000,
                }, {
                    nodeName: "aiPath-1.002",
                    residenceTime: 4000,
                },
                {
                    nodeName: "aiPath-1.003",
                    residenceTime: 6000,
                },
                {
                    nodeName: "aiPath-1.004",
                    residenceTime: 4000,
                }
            ]
        },
        {
            name: "余少",
            info: ["你还记得jvm有多少种垃圾收集器吗", "你还记得字节码是什么吗"],
            infoSoundURL:["sound/java/ai/how_many_GC_in_JVM.mp3","sound/java/ai/What's_the_bytecode.mp3"],
            title: "Java高级工程师",
            position: "Java高级工程师",
            modelURL: "model/ai/ai_2.glb",
            idleAnimationGroupName: "Idle",
            walkAnimationGroupName: "Walk",
            leftTurnAnimationGroupName: "LeftTurn",
            rightTurnAnimationGroupName: "RightTurn",
            avatarURL: "img/avatar/ai_2.png",
            miniMapAvatarURL:"img/miniMap/ai_2.png",
            path: [
                {
                    nodeName: "aiPath-2.001",
                    residenceTime: 5000,
                }, {
                    nodeName: "aiPath-2.002",
                    residenceTime: 4000,
                }, {
                    nodeName: "aiPath-2.003",
                    residenceTime: 3000,
                }, {
                    nodeName: "aiPath-2.004",
                    residenceTime: 6000,
                }
            ]
        },
        {
            name: "黄笨蛋",
            info: ["for循环的lambda形式是什么呢", "生产者消费者问题"],
            infoSoundURL:["sound/java/ai/What's_the_lambda_form_of_the_for_loop.mp3","sound/java/ai/Producer_consumer.mp3"],
            title: "Java高级工程师",
            position: "Java高级工程师",
            modelURL: "model/ai/ai_3.glb",
            idleAnimationGroupName: "Idle",
            walkAnimationGroupName: "Walk",
            leftTurnAnimationGroupName: "LeftTurn",
            rightTurnAnimationGroupName: "RightTurn",
            avatarURL: "img/avatar/ai_3.png",
            miniMapAvatarURL:"img/miniMap/ai_3.png",
            path: [
                {
                    nodeName: "aiPath-3.001",
                    residenceTime: 5000,
                }, {
                    nodeName: "aiPath-3.002",
                    residenceTime: 4000,
                }, {
                    nodeName: "aiPath-3.003",
                    residenceTime: 5000,
                }, {
                    nodeName: "aiPath-3.004",
                    residenceTime: 2000,
                }
            ]
        },
    ],
    receptionistDescription : JAVA_ReceptionistDescription
}

export const fakeStudio_AI : Studio = {
    uuid:2,
    name:"AI",
    modelURL:"model/studio/ai_studio.glb",
    playerModelURL: "model/player.glb",
    description: "AI工作室 专注于人工智能背后的数学理论",
    playerSpawn: "playerSpawn",
    playerRotateYAxis: Math.PI / 2,
    collisionBox: ["collision", "ground"],
    groundName: "ground",
    receiveShadowName:["ground","rug"],
    groundLightMapUrl:"model/studio/ai_studio_lightMap.png",
    playerAvatarURL: "img/avatar/playerAvatar.png",
    directionalLightPosition: [-10,10,-10],
    directionalLightDirection:[-1,-2,1],
    bookShelfStartName: "BookShelf",
    practiceTableStartName: "PracticeTable",
    miniMap :"miniMap",
    receptionistConfig: {
        receptionistModelURL: "model/receptionist.glb",
        receptionistSpawn: "receptionistSpawn",
        receptionistRotateYAxis: Math.PI / 2,
        distanceTrigger: 2.5,
        greetingSoundURL: "sound/ai/aiGreeting.mp3",
        introductionSoundURL: "sound/ai/aiIntroduction.mp3"
    },
    rotateCamera: [
        {mesh: "cameraRotate_1", rotate: -Math.PI / 2},
        {mesh: "cameraRotate_2", rotate: 0},
        {mesh: "cameraRotate_3", rotate: Math.PI / 2},
        {mesh: "cameraRotate_4", rotate: Math.PI  +  Math.PI / 4},
        {mesh: "cameraRotate_5", rotate: Math.PI - Math.PI / 4},
        {mesh: "cameraRotate_6", rotate: Math.PI},
    ],
    studioAIs: [
        {
            name: "黄奥",
            info: ["你还记得哪种机器学习，不需要手动标注数据吗","机器学习的三要素是什么","你还记得机器学习被分为了哪几类吗", ],
            infoSoundURL:["sound/ai/ai/ai-1-1.mp3","sound/ai/ai/ai-1-2.mp3","sound/ai/ai/ai-1-3.mp3"],
            title: "AI高级工程师",
            position: "算法工程师",
            modelURL: "model/ai/ai_1.glb",
            idleAnimationGroupName: "Idle",
            walkAnimationGroupName: "Walk",
            leftTurnAnimationGroupName: "LeftTurn",
            rightTurnAnimationGroupName: "RightTurn",
            avatarURL: "img/avatar/ai_1.png",
            miniMapAvatarURL:"img/miniMap/ai_1.png",
            path: [
                {
                    nodeName: "aiPath-1.001",
                    residenceTime: 4000,
                }, {
                    nodeName: "aiPath-1.002",
                    residenceTime: 4000,
                },
                {
                    nodeName: "aiPath-1.003",
                    residenceTime: 6000,
                },
                {
                    nodeName: "aiPath-1.004",
                    residenceTime: 4000,
                },
                {
                    nodeName: "aiPath-1.005",
                    residenceTime: 4000,
                }
            ]
        },
        {
            name: "余少",
            info: ["模型评估时用的是什么数据集？", "还记得交叉验证法吗","查准率和查全率是什么"],
            infoSoundURL:["sound/ai/ai/ai-2-1.mp3","sound/ai/ai/ai-2-2.mp3","sound/ai/ai/ai-2-3.mp3"],
            title: "AI工程师",
            position: "深度学习高级工程师",
            modelURL: "model/ai/ai_2.glb",
            idleAnimationGroupName: "Idle",
            walkAnimationGroupName: "Walk",
            leftTurnAnimationGroupName: "LeftTurn",
            rightTurnAnimationGroupName: "RightTurn",
            avatarURL: "img/avatar/ai_2.png",
            miniMapAvatarURL:"img/miniMap/ai_2.png",
            path: [
                {
                    nodeName: "aiPath-2.001",
                    residenceTime: 5000,
                }, {
                    nodeName: "aiPath-2.002",
                    residenceTime: 4000,
                }, {
                    nodeName: "aiPath-2.003",
                    residenceTime: 3000,
                }, {
                    nodeName: "aiPath-2.004",
                    residenceTime: 6000,
                },
                {
                    nodeName: "aiPath-2.005",
                    residenceTime: 5000,
                }
            ]
        },
        {
            name: "黄笨蛋",
            info: ["什么是监督学习和非监督学习?", "什么是泛化能力?","你还记得推到线性SVM的判别方程吗?","你知道K近邻法的缺点吗？"],
            infoSoundURL:["sound/ai/ai/ai-3-1.mp3","sound/ai/ai/ai-3-2.mp3","sound/ai/ai/ai-3-3.mp3","sound/ai/ai/ai-3-4.mp3"],
            title: "AI部门专家",
            position: "AI高级算法工程师",
            modelURL: "model/ai/ai_3.glb",
            idleAnimationGroupName: "Idle",
            walkAnimationGroupName: "Walk",
            leftTurnAnimationGroupName: "LeftTurn",
            rightTurnAnimationGroupName: "RightTurn",
            avatarURL: "img/avatar/ai_3.png",
            miniMapAvatarURL:"img/miniMap/ai_3.png",
            path: [
                {
                    nodeName: "aiPath-3.001",
                    residenceTime: 5000,
                }, {
                    nodeName: "aiPath-3.002",
                    residenceTime: 4000,
                }, {
                    nodeName: "aiPath-3.003",
                    residenceTime: 5000,
                }, {
                    nodeName: "aiPath-3.004",
                    residenceTime: 2000,
                }
            ]
        },
    ],
    receptionistDescription : AI_ReceptionistDescription
}

import {ReceptionistConfig, Studio} from "./Studio";
import {Vector3} from "@babylonjs/core";


export const  fakeStudio:Studio = {
    name: "java工作室",
    modelURL: "src/assets/model/studio/java_studio.glb",
    playerModelURL: "src/assets/model/player.glb",
    description: "java工作室 一个学习高并发的工作室",
    playerSpawn: "playerSpawn",
    collisionBox: ["collision", "ground"],
    groundName: "ground",
    playerAvatarURL: "src/assets/img/avatar/playerAvatar.png",
    directionalLightPosition: new Vector3(-10, 10, -10),
    bookShelfStartName: "BookShelf",
    practiceTableStartName: "PracticeTable",
    receptionistConfig: {
        receptionistModelURL: "src/assets/model/receptionist.glb",
        receptionistSpawn: "receptionistSpawn",
        receptionistRotateYAxis: Math.PI / 2,
        distanceTrigger: 2,
        greetingSoundURL: "src/assets/sound/javaGreeting.mp3",
        introductionSoundURL: "src/assets/sound/javaIntroduction.mp3"
    } as ReceptionistConfig,
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
            infoSoundURL:["src/assets/sound/java/ai/Java学习的怎么样了.mp3","src/assets/sound/java/ai/JDK是JAVA的开发工具包.mp3"],
            title: "Java高级工程师",
            position: "Java高级工程师",
            modelURL: "src/assets/model/ai/ai_1.glb",
            idleAnimationGroupName: "Idle",
            walkAnimationGroupName: "Walk",
            leftTurnAnimationGroupName: "LeftTurn",
            rightTurnAnimationGroupName: "RightTurn",
            avatarURL: "src/assets/img/avatar/ai_1.png",
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
            infoSoundURL:["src/assets/sound/java/ai/jvm有多少种垃圾收集器.mp3","src/assets/sound/java/ai/字节码是什么.mp3"],
            title: "Java高级工程师",
            position: "Java高级工程师",
            modelURL: "src/assets/model/ai/ai_2.glb",
            idleAnimationGroupName: "Idle",
            walkAnimationGroupName: "Walk",
            leftTurnAnimationGroupName: "LeftTurn",
            rightTurnAnimationGroupName: "RightTurn",
            avatarURL: "src/assets/img/avatar/ai_2.png",
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
            infoSoundURL:["src/assets/sound/java/ai/for循环的lambda形式是什么呢.mp3","src/assets/sound/java/ai/生产者消费者问题.mp3"],
            title: "Java高级工程师",
            position: "Java高级工程师",
            modelURL: "src/assets/model/ai/ai_3.glb",
            idleAnimationGroupName: "Idle",
            walkAnimationGroupName: "Walk",
            leftTurnAnimationGroupName: "LeftTurn",
            rightTurnAnimationGroupName: "RightTurn",
            avatarURL: "src/assets/img/avatar/ai_3.png",
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

    ]
}

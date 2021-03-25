import {ReceptionistConfig, Studio} from "./Studio";
import {Vector3} from "@babylonjs/core";


export const  fakeStudio:Studio = {
    name: "java工作室",
    modelURL: "model/studio/java_studio.glb",
    playerModelURL: "model/player.glb",
    description: "java工作室 一个学习高并发的工作室",
    playerSpawn: "playerSpawn",
    collisionBox: ["collision", "ground"],
    groundName: "ground",
    playerAvatarURL: "img/avatar/playerAvatar.png",
    directionalLightPosition: new Vector3(-10, 10, -10),
    bookShelfStartName: "BookShelf",
    practiceTableStartName: "PracticeTable",
    receptionistConfig: {
        receptionistModelURL: "model/receptionist.glb",
        receptionistSpawn: "receptionistSpawn",
        receptionistRotateYAxis: Math.PI / 2,
        distanceTrigger: 2,
        greetingSoundURL: "sound/javaGreeting.mp3",
        introductionSoundURL: "sound/javaIntroduction.mp3"
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
            infoSoundURL:["sound/java/ai/How's_java_learning_going.mp3","sound/java/ai/JDK.mp3"],
            title: "Java高级工程师",
            position: "Java高级工程师",
            modelURL: "model/ai/ai_1.glb",
            idleAnimationGroupName: "Idle",
            walkAnimationGroupName: "Walk",
            leftTurnAnimationGroupName: "LeftTurn",
            rightTurnAnimationGroupName: "RightTurn",
            avatarURL: "img/avatar/ai_1.png",
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

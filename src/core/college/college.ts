

export enum CollegePosition {  //学院的位置
    A = "building_1",
    B = "building_2",
    C = "building_3",
    D = "building_4",
    E = "building_5",
}

export interface College {
    name: string
    modelUrl: string
    position: CollegePosition
}
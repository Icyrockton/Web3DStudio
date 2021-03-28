import {CollegeDescription} from "../../../core/collegeMap/college";
import {action, autorun, makeObservable, observable, runInAction} from "mobx";
import {collegeDescription, fetchCollgeDescription} from "../../../core/collegeMap/collegeMapApi";


export class CollegeUiState {
    isShowing: boolean = false
    college: CollegeDescription | null = null

    constructor() {
        makeObservable(this, {
            isShowing: observable,
            college: observable,
            setShowing: action
        })
    }

    setShowing(isShowing: boolean) {
        this.isShowing = isShowing
    }


    fetchCollegeDescriptionByUUId(uuid: number) {
        const find = collegeDescription.find(college => college.uuid == uuid);
        if (find)
            this.college = find

    }
}

const useCollegeUiState = new CollegeUiState()

export default useCollegeUiState

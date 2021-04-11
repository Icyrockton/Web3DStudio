import {CollegeDescription} from "../../../core/collegeMap/college";
import {action, autorun, makeObservable, observable, runInAction} from "mobx";
import {collegeDescription, fetchCollgeDescription} from "../../../core/collegeMap/collegeMapApi";
import useWeb3DApi from "../../../network/web3dApi";


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


    async fetchCollegeDescriptionByUUId(uuid: number) {

        this.college = null
        const response = await useWeb3DApi.getCollegeDescription(uuid);
        runInAction(()=>{
            this.college = response.data
        })

    }
}

const useCollegeUiState = new CollegeUiState()

export default useCollegeUiState

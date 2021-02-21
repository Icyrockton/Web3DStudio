import {CollegeDescription} from "../../core/college/college";
import {action, autorun, makeObservable, observable} from "mobx";
import {fetchCollgeDescription} from "../../core/college/collegeApi";


export class CollegeUiState {
    isShowing: boolean = false
    college: CollegeDescription | null = null

    constructor() {
        makeObservable(this, {
            isShowing: observable,
            college: observable,
            setShowing : action
        })
    }

    setShowing(isShowing:boolean){
        this.isShowing=isShowing
        if(!isShowing){ //如果未显示
            this.college=null //清空college
        }
    }

    fetchCollegeDescriptionByName(name:string){
        if (this.college!=null)
            return
        fetchCollgeDescription(name).then(
            college => {
                if (college)
                    this.college=college
            }
        )
    }
}

const useCollegeUiState=new CollegeUiState()

export default useCollegeUiState
import {makeAutoObservable} from "mobx";
import {AreaType, BookDetail} from "../../../core/bookShelf/bookShelf";
import {EBookDetail} from "../../../core/practiceTable/practiceTable";
import {EBook} from "../../../core/practiceTable/eBook";
import {Book} from "../../../core/bookShelf/book";


const fakeEBooks: EBookDetail [] = [
    {
        uuid: 1,
        bookName: "Java从入门到精通（第5版）",
        bookURL: "",
        textureImgURL: "src/assets/img/bookCover/book_1.png",
        thickness: 1.0
    },
    {
        uuid: 2,
        bookName: "Java核心技术 卷I 基础知识",
        bookURL: "",
        textureImgURL: "src/assets/img/bookCover/book_2.png",
        thickness: 1.0
    },
    {
        uuid: 3,
        bookName: "Java编程思想",
        bookURL: "",
        textureImgURL: "src/assets/img/bookCover/book_3.png",
        thickness: 1.0
    },
    {
        uuid: 4,
        bookName: "Effective Java中文版",
        bookURL: "",
        textureImgURL: "src/assets/img/bookCover/book_4.png",
        thickness: 1.0
    }
]


export class PracticeTableUiState {

    eBooks: EBookDetail[] = fakeEBooks
    currentEBook: EBook | null = null //保存实例为了关闭书籍
    currentEBookDetail: EBookDetail | null = null //书籍的信息
    setEBookWithDetail(eBook: EBook, eBookDetail: EBookDetail) {
        this.currentEBook = eBook
        this.currentEBookDetail = eBookDetail
    }

    eBookReaderShowing: boolean = false

    setEBookReaderShowing(showing: boolean) {
        this.eBookReaderShowing = showing
    }

    constructor() {
        makeAutoObservable(this, {
            currentEBook: false,
            currentEBookDetail: false,
            setEBookWithDetail: false,
        })
    }
}


const usePracticeTableUiState = new PracticeTableUiState()


export default usePracticeTableUiState
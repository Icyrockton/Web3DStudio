import {BookDetail} from "../../../core/bookShelf/bookShelf";
import {makeAutoObservable} from "mobx";
import {Book} from "../../../core/bookShelf/book";


const fakeBooks: BookDetail[] = [
    {
        uuid: "1",
        area: "A_Area",
        videoName: "JDK的下载与安装",
        videoURL: "",
        textureImgURL: "src/assets/img/bookCover/book_1.png"
    },
    {
        uuid: "2",
        area: "A_Area",
        videoName: "JAVA变量定义",
        videoURL: "",
        textureImgURL: "src/assets/img/bookCover/book_2.png"
    },
    {
        uuid: "3",
        area: "A_Area",
        videoName: "JAVA条件语句",
        videoURL: "",
        textureImgURL: "src/assets/img/bookCover/book_3.png"
    },
    {
        uuid: "4",
        area: "A_Area",
        videoName: "JAVA数组",
        videoURL: "",
        textureImgURL: "src/assets/img/bookCover/book_4.png"
    },
    {
        uuid: "5",
        area: "A_Area",
        videoName: "JVM虚拟机",
        videoURL: "",
        textureImgURL: "src/assets/img/bookCover/book_5.png"
    },
    {
        uuid: "6",
        area: "A_Area",
        videoName: "JVM虚拟机",
        videoURL: "",
        textureImgURL: "src/assets/img/bookCover/book_5.png"
    },
    {
        uuid: "7",
        area: "A_Area",
        videoName: "JVM虚拟机",
        videoURL: "",
        textureImgURL: "src/assets/img/bookCover/book_5.png"
    },
    {
        uuid: "8",
        area: "B_Area",
        videoName: "JVM虚拟机",
        videoURL: "",
        textureImgURL: "src/assets/img/bookCover/book_5.png"
    },
    {
        uuid: "9",
        area: "A_Area",
        videoName: "JVM虚拟机",
        videoURL: "",
        textureImgURL: "src/assets/img/bookCover/book_5.png"
    },
    {
        uuid: "10",
        area: "B_Area",
        videoName: "JVM虚拟机",
        videoURL: "",
        textureImgURL: "src/assets/img/bookCover/book_5.png"
    },
    {
        uuid: "11",
        area: "A_Area",
        videoName: "JVM虚拟机",
        videoURL: "",
        textureImgURL: "src/assets/img/bookCover/book_5.png"
    },
    {
        uuid: "12",
        area: "C_Area",
        videoName: "JAVA数组",
        videoURL: "",
        textureImgURL: "src/assets/img/bookCover/book_4.png"
    },
    {
        uuid: "13",
        area: "D_Area",
        videoName: "JVM虚拟机",
        videoURL: "",
        textureImgURL: "src/assets/img/bookCover/book_5.png"
    },
]


export class BookShelfUiState {

    books: BookDetail[ ] = fakeBooks

    currentBook: Book | null = null
    videoShowing:boolean=true
    constructor() {
        makeAutoObservable(this, {currentBook: false, setBook: false})
    }

    setBook(book: Book) {
        this.currentBook = book
    }
    setVideoShowing(showing:boolean){
        this.videoShowing  = showing
    }
}


const useBookShelfUiState = new BookShelfUiState()

export default useBookShelfUiState
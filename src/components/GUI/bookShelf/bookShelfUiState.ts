import {BookDetail} from "../../../core/bookShelf/bookShelf";
import {makeAutoObservable} from "mobx";
import {Book} from "../../../core/bookShelf/book";
import {Web3DStudio} from "../../../web3DStudio";


const fakeBooks: BookDetail[] = [
    {
        uuid: 1,
        area: "A_Area",
        videoName: "JVM内存模型",
        videoURL: "src/assets/video/javaVideo_1.flv",
        textureImgURL: "src/assets/img/bookCover/book_1.png",
        thickness:1
    },
    {
        uuid: 2,
        area: "A_Area",
        videoName: "指令重排序",
        videoURL: "src/assets/video/javaVideo_1.flv",
        textureImgURL: "src/assets/img/bookCover/book_2.png",
        thickness:1
    },
    {
        uuid: 3,
        area: "A_Area",
        videoName: "JVM内存屏障",
        videoURL: "src/assets/video/javaVideo_1.flv",
        textureImgURL: "src/assets/img/bookCover/book_3.png",
        thickness:0.5
    },
    {
        uuid: 4,
        area: "A_Area",
        videoName: "JVM体系结构",
        videoURL: "src/assets/video/javaVideo_1.flv",
        textureImgURL: "src/assets/img/bookCover/book_4.png",
        thickness:1
    },
    {
        uuid: 5,
        area: "A_Area",
        videoName: "类加载器及双亲委派机制",
        videoURL: "src/assets/video/javaVideo_1.flv",
        textureImgURL: "src/assets/img/bookCover/book_3.png",
        thickness:0.5
    },
    {
        uuid: 6,
        area: "A_Area",
        videoName: "Native，方法区",
        videoURL: "src/assets/video/javaVideo_1.flv",
        textureImgURL: "src/assets/img/bookCover/book_5.png",
        thickness:1
    },
    {
        uuid: 7,
        area: "A_Area",
        videoName: "JVM虚拟机",
        videoURL: "src/assets/video/javaVideo_1.flv",
        textureImgURL: "src/assets/img/bookCover/book_5.png",
        thickness:0.8
    },
    {
        uuid: 8,
        area: "B_Area",
        videoName: "JVM虚拟机",
        videoURL: "src/assets/video/javaVideo_1.flv",
        textureImgURL: "src/assets/img/bookCover/book_5.png",
        thickness:0.55
    },
    {
        uuid: 9,
        area: "A_Area",
        videoName: "JVM虚拟机",
        videoURL: "src/assets/video/javaVideo_1.flv",
        textureImgURL: "src/assets/img/bookCover/book_3.png",
        thickness:0.5
    },
    {
        uuid: 10,
        area: "B_Area",
        videoName: "JVM虚拟机",
        videoURL: "src/assets/video/javaVideo_1.flv",
        textureImgURL: "src/assets/img/bookCover/book_5.png",
        thickness:0.8
    },
    {
        uuid: 11,
        area: "A_Area",
        videoName: "JVM虚拟机",
        videoURL: "src/assets/video/javaVideo_1.flv",
        textureImgURL: "src/assets/img/bookCover/book_5.png",
        thickness:0.7
    },
    {
        uuid: 12,
        area: "C_Area",
        videoName: "JAVA数组",
        videoURL: "src/assets/video/javaVideo_1.flv",
        textureImgURL: "src/assets/img/bookCover/book_4.png",
        thickness:0.6
    },
    {
        uuid: 13,
        area: "D_Area",
        videoName: "JVM虚拟机",
        videoURL: "src/assets/video/javaVideo_1.flv",
        textureImgURL: "src/assets/img/bookCover/book_5.png",
        thickness:0.5
    },
]


export class BookShelfUiState {

    books: BookDetail[ ] = fakeBooks

    currentBook: Book | null = null //保存实例为了关闭书籍
    currentBookDetail: BookDetail | null = null //书籍的信息
    videoShowing: boolean = false //视频显示?
    shelfShowing : boolean =false //书架显示?
    web3DStudio:Web3DStudio | null =null

    constructor() {
        makeAutoObservable(this, {web3DStudio:false,
            currentBook: false,
            setBookWithDetail: false,
            currentBookDetail: false})
    }

    setBookWithDetail(book: Book, bookDetail: BookDetail) {
        this.currentBook = book
        this.currentBookDetail = bookDetail
    }

    setVideoShowing(showing: boolean) {
        this.videoShowing = showing
    }
    setShelfShowing(showing:boolean){
        this.shelfShowing =showing
    }
}


const useBookShelfUiState = new BookShelfUiState()

export default useBookShelfUiState
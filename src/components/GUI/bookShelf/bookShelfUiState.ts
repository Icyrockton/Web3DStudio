import {BookDetail, BookShelf} from "../../../core/bookShelf/bookShelf";
import {makeAutoObservable, runInAction} from "mobx";
import {Book} from "../../../core/bookShelf/book";
import {Web3DStudio} from "../../../web3DStudio";
import {PlayerManager} from "../../../core/player/playerManager";
import useNavUiState from "../nav/navUiState";
import usePlayerUiState from "../player/playerUiState";
import useWeb3DApi from "../../../network/web3dApi";


const fakeBooks: BookDetail[] = [
    {
        uuid: 1,
        area: "A_Area",
            videoName: "JVM内存模型",
        videoURL: "video/javaVideo_1.flv",
        textureImgURL: "img/bookCover/videoBook/MemoryModel.png",
        thickness:1
    },
    {
        uuid: 2,
        area: "A_Area",
        videoName: "JVM体系结构",
        videoURL: "video/javaVideo_1.flv",
        textureImgURL: "img/bookCover/book_2.png",
        thickness:1
    },
    {
        uuid: 3,
        area: "A_Area",
        videoName: "",
        videoURL: "video/javaVideo_1.flv",
        textureImgURL: "img/bookCover/book_3.png",
        thickness:0.5
    },
    {
        uuid: 4,
        area: "A_Area",
        videoName: "指令重排序",
        videoURL: "video/javaVideo_1.flv",
        textureImgURL: "img/bookCover/videoBook/InstructionReorder.png",
        thickness:1
    },
    {
        uuid: 5,
        area: "A_Area",
        videoName: "类加载器及双亲委派机制",
        videoURL: "video/javaVideo_1.flv",
        textureImgURL: "img/bookCover/book_3.png",
        thickness:0.5
    },
    {
        uuid: 6,
        area: "A_Area",
        videoName: "Native，方法区",
        videoURL: "video/javaVideo_1.flv",
        textureImgURL: "img/bookCover/book_5.png",
        thickness:1
    },
    {
        uuid: 7,
        area: "A_Area",
        videoName: "JVM虚拟机",
        videoURL: "video/javaVideo_1.flv",
        textureImgURL: "img/bookCover/book_5.png",
        thickness:0.8
    },
    {
        uuid: 8,
        area: "B_Area",
        videoName: "JVM内存屏障",
        videoURL: "video/javaVideo_1.flv",
        textureImgURL: "img/bookCover/videoBook/MemoryBarrier.png",
        thickness:0.55
    },
    {
        uuid: 9,
        area: "A_Area",
        videoName: "JVM虚拟机",
        videoURL: "video/javaVideo_1.flv",
        textureImgURL: "img/bookCover/book_3.png",
        thickness:0.5
    },
    {
        uuid: 10,
        area: "B_Area",
        videoName: "JVM虚拟机",
        videoURL: "video/javaVideo_1.flv",
        textureImgURL: "img/bookCover/book_5.png",
        thickness:0.8
    },
    {
        uuid: 11,
        area: "A_Area",
        videoName: "JVM虚拟机",
        videoURL: "video/javaVideo_1.flv",
        textureImgURL: "img/bookCover/book_5.png",
        thickness:0.7
    },
    {
        uuid: 12,
        area: "C_Area",
        videoName: "JAVA数组",
        videoURL: "video/javaVideo_1.flv",
        textureImgURL: "img/bookCover/book_4.png",
        thickness:0.6
    },
    {
        uuid: 13,
        area: "D_Area",
        videoName: "JVM虚拟机",
        videoURL: "video/javaVideo_1.flv",
        textureImgURL: "img/bookCover/book_5.png",
        thickness:0.5
    },
]


export class BookShelfUiState {

    books: BookDetail[] = []

    currentBook: Book | null = null //保存实例为了关闭书籍
    currentBookDetail: BookDetail | null = null //书籍的信息
    videoShowing: boolean = false //视频显示?
    shelfShowing : boolean =false //书架显示?
    web3DStudio:Web3DStudio | null =null
    playerManager: PlayerManager | null = null;
    bookShelfInstance: BookShelf | null = null;

    constructor() {
        makeAutoObservable(this, {web3DStudio:false,
            currentBook: false,
            setBookWithDetail: false,
            currentBookDetail: false,
            bookShelfInstance:false,
            playerManager:false})
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
        if (showing && this.playerManager){
            usePlayerUiState.studioManager?.clearPlayerState()
            this.playerManager.player.blockInput()
        }
        if (!showing && this.playerManager){
            this.playerManager.busy =false //设置为非忙碌状态
            useNavUiState.navController?.focusCanvas() //聚焦canvas
        }
    }

    async updateBookShelf(studioUUID:number){ //传进来工作室的ID
        const studioBook = await useWeb3DApi.getStudioBook(studioUUID);
        console.log(studioBook.data)
        runInAction(()=>{
            this.books = studioBook.data
            if (this.bookShelfInstance){
                this.bookShelfInstance.updateBookShelf()
            }
        })

    }
}


const useBookShelfUiState = new BookShelfUiState()

export default useBookShelfUiState

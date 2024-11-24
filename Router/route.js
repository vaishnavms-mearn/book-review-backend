const express =require('express')
const userController=require('../Controllers/userController')
const bookController=require('../Controllers/bookController')
const jwtMiddleware=require('../Middlewares/jwtMiddleware')
const multerConfig=require('../Middlewares/multerMiddlware')
// const multerConfig=require('../Middlewares/multerMiddlware')
const router =new express.Router()
router.post('/register',userController.register)
router.post('/login',userController.login)
router.post('/add-book',jwtMiddleware,multerConfig.single('coverImage'),bookController.addBook)
router.put('/edit-book/:id',jwtMiddleware,multerConfig.single('coverImage'),bookController.editBook)
router.delete('/delete-book/:id',jwtMiddleware,bookController.deleteBook)
router.post("/add-review/:id", jwtMiddleware, bookController.addReview);
router.put("/edit-review/:id", jwtMiddleware, bookController.editReview);
router.delete("/delete-review/:id", jwtMiddleware, bookController.deleteReview);
router.get("/get-books/", bookController.getBooks);
router.get('/my-books', jwtMiddleware, bookController.getUserBooks);
router.get('/book-detail/:id', jwtMiddleware, bookController.getBookDetails);
module.exports=router
const { Router } = require('express')
const { verifyAccessToken, genRanHex, getUser } = require('../src/util');
const { createPost, getPost, getFollowingPosts, deletePost } = require('../src/utils/posts');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "forest/assets/posts/")
    },
    filename: (req, file, cb) => {
        cb(null, Math.floor(Date.now()).toString(16) + genRanHex(7) + "." + file.originalname.split(".").pop())
    }
})

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png')
        cb(null, true)
    else
        cb({"message": "File type must be .png or .jpg"}, false)
}

const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter
})

module.exports.Router = class Routes extends Router {
    constructor() {
        super();
        
        // POST /posts/ - Create new post
        this.post('/', upload.single('image'), verifyAccessToken, (req, res) => {
            console.log(req.file)
            let postId = 1 + Math.floor(Date.now()/1000).toString(16) + genRanHex(9)
            if(!req.body.description || !req.file) return res.status(500).send({"message": "Please add a description and an image"})
            console.log(req.body)
            createPost(postId, req.user.userId, req.body.description, req.file.filename, (err, resu) => {
                if(err) return res.status(500).send(err)
                res.send(resu)
            })
        });

        // GET /posts - Get posts from all users the user is following
        this.get('/', verifyAccessToken, (req, res) => {
            getFollowingPosts(req.user.userId, (err, resu) => {
                if(err) return res.status(500).send(err)
                res.send(resu)
            })
        })

        // GET /posts/:postId - Get a specific post
        this.get('/:postId', verifyAccessToken, (req, res) => {
            getPost(req.params.postId, (err, resu) => {
                if(err) return res.status(500).send(err)
                res.send(resu)
            })
        })

        // DELETE /posts/:postId - Delete a specific post
        this.delete('/:postId', verifyAccessToken, (req, res) => {
            getPost(req.params.postId, (err, resu) => {
                if(err) return res.status(500).send(err)
                if(resu.userId !== req.user.userId) return res.status(500).send({"message": "You are not the owner of this post"})
                deletePost(req.params.postId, (err, resu2) => {
                    if(err) return res.status(500).send(err)
                    return res.send(resu2)
                })
            })
        })

        // POST /posts/:postId/comment - Send a comment on a post
        this.post('/:postId/comment', verifyAccessToken, (req, res) => {

        })

    }
};

module.exports.page = '/api/posts';
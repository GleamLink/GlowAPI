const { Router } = require('express')
const jwt = require('jsonwebtoken')
const util = require('../src/util')

module.exports.Router = class Routes extends Router {
    constructor() {
        super();

        // POST /posts/ - Create new Post
        this.post('/', authToken, (req, res) => {
            console.log(req.body.description)
            if(!req.body.description) return res.status(401).send({"message": "Description body required."}) // TODO: Image
            util.createPost(req.user.userId, req.body.description, 'NULL', (err, resu) => {
                if(err) return res.status(500).send(err)
                return res.send(resu)
            })
        });

        // GET /posts/ - Get user posts
        this.get('/', authToken, (req, res) => {
            util.getPosts(req.user.userId, (err, resu) => {
                if(err) return res.status(500).send(err)
                res.send(resu)
            })
        })

        // GET /posts/:postId/ - Get specific user post
        this.get('/:postId', authToken, (req, res) => {
            util.getPost(req.user.userId, req.params.postId, (err, resu) => {
                if(err) return res.status(500).send(err)
                res.send(resu)
            })
        })

        // PUT /posts/:postId/ - Update a specific post (only description)
        this.put('/:postId', authToken, (req, res) => {
            try {
                util.getPost(req.user.userId, req.params.postId, (err, resu) => {
                    if(!resu.length) return res.send({"message": "No existing post found with given id."})
                    if(!req.body.description) return res.send({"message": "Please give a description as body."})
                    util.updatePost(req.user.userId, req.params.postId, req.body.description, (err, resu) => {
                        if(err) return res.status(500).send(err)
                        if(resu.affectedRows === 0) return res.send({"message": "There is no post existing with this id."})
                        if(resu.changedRows === 0) return res.send({"message": "You can't change the description in the same as before."})
                        res.send(resu)
                    })
                })
            } catch (error) {
                res.status(500).json(error)
            }
            
        })
    }
};

function authToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

module.exports.page = '/api/posts';
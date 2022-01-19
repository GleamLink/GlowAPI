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
                if(err) return res.send(err)
                return res.send(resu)
            })
        });

        // GET /posts/ - Get user posts
        this.get('/', authToken, (req, res) => {
            util.getPosts(req.user.userId, (err, resu) => {
                if(err) return res.send(err)
                res.send(resu)
            })
        })

        // GET /posts/:postId/ - Get specific user post
        this.get('/:postId', authToken, (req, res) => {
            util.getPost(req.user.userId, req.params.postId, (err, resu) => {
                if(err) return res.send(err)
                res.send(resu)
            })
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
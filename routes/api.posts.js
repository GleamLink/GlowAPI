const { Router } = require('express')
const jwt = require('jsonwebtoken')
const util = require('../src/util')

module.exports.Router = class Routes extends Router {
    constructor() {
        super();

        // Create new Post
        this.post('/', authToken, (req, res) => {
            util.getUser(req.user.userId, (err, user) => res.send(user.id))
        });
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
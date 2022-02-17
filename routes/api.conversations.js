const { Router } = require('express');
const { postConversation, createConversation, getConversation } = require('../src/utils/conversations');
const { verifyAccessToken, getUser } = require('../src/util');

module.exports.Router = class Routes extends Router {
    constructor() {
        super()

        this.get('/', verifyAccessToken, (req, res) => {
        })

        // POST /conversations/ - Creates a conversation with specific user if no exists
        this.post('/', verifyAccessToken, (req, res) => {
            if(!req.body.senderId) return res.status(500).send({"message": "Sender required."})
        });

        // GET /conversations/:userId/ - Returns the conversation id with specific user
        this.get('/:userId', verifyAccessToken, (req, res) => {
            if(!req.params.userId) return res.status(500).send({"message": "User required."})
            getUser(req.params.userId, (err, resu) => {
                if(err) return res.status(500).send(err)
                getConversation(req.params.userId, req.user.userId, (err, resu) => {
                    console.log("ABCDEF: ",
                        req.params.userId,
                        req.user.userId,
                        err,
                        resu[0]
                    )
                    if(err) return res.status(500).send(err)
                    if(!resu.length) {
                        createConversation(req.user.userId, req.params.userId, (err, resu2) => {
                            if(err) return res.status(500).send(err)
                            return res.send(resu2)
                        })
                        // return res.status(500).send({"message": "We don't know why, but there is no conversation existing with you and the user."})
                    } else if(resu.length > 1) {
                        return res.send(resu)
                    } else {
                        return res.send(resu[0])
                    }
                })
            })
            
        })
    }
};

module.exports.page = '/api/conversations';
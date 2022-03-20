const { Router } = require('express');
const { postConversation, createConversation, getConversations, getConversation, getConversationById } = require('../src/utils/conversations');
const { verifyAccessToken, getUser } = require('../src/util');
const { getMessages } = require('../src/utils/messages');

module.exports.Router = class Routes extends Router {
    constructor() {
        super()

        // GEt /conversations/ - Returns a list of conversations where the user is in
        this.get('/', verifyAccessToken, (req, res) => {
            getConversations(req.user.userId, (err, resu) => {
                if(err) return res.status(500).send(err)
                res.send(resu)
            })
        })

        // POST /conversations/ - Creates a conversation with specific user if no exists
        this.post('/', verifyAccessToken, (req, res) => {
            if(!req.body.userId) return res.status(500).send({"message": "User required."})
        });

        // GET /conversations/:userId/ - Returns the conversation id with specific user
        this.get('/:userId', verifyAccessToken, (req, res) => {
            if(!req.params.userId) return res.status(500).send({"message": "User required."})
            if(req.params.userId === req.user.userId) return res.status(401).send({"message": "You can't get conversations with yourself."})
            getUser(req.params.userId, (err, resu) => {
                if(err) return res.status(500).send(err)
                getConversation(req.params.userId, req.user.userId, (err, resu) => {
                    if(err) return res.status(500).send(err)
                    return res.send(resu)
                })
            })
        })

        // GET /conversations/:conversationId/messages - Returns all messages from specific conversation
        this.get('/:convId/messages', verifyAccessToken, (req, res) => {
            getConversationById(req.params.convId, (err, resu) => {
                console.log("A",resu)
                // if(!resu) return res.json({"message": "No conversation with this id."})
                if(!resu.members) return res.status(500).json({"message": "No conversation with this id."})
                if(!resu.members.includes(req.user.userId)) return res.status(401).send({"message": "Unauthorized to see this conversation."})
                getMessages(req.params.convId, (err, resu) => {
                    if(err) return res.status(500).send(err)
                    if(!resu.length) return res.json([])
                    res.send(resu)
                })
            })
            
        })
    }
};

module.exports.page = '/api/conversations';
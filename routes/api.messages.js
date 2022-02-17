const { Router } = require('express');
const { verifyAccessToken } = require('../src/util');
const { createMessage } = require("../src/utils/messages")

module.exports.Router = class Routes extends Router {
    constructor() {
        super();

        // POST /messages/ - Posts a text in specific conversation
        this.post('/', verifyAccessToken, (req, res) => {
            if(!req.body.conversationId) return res.status(500).json({"message": "No conversation given."})
            if(!req.body.text) return res.status(500).json({"message": "No text given."})
            createMessage(req.body.conversationId, req.user.userId, req.body.text, (err, resu) => {
                if(err) return res.status(500).send("a" + err)
                return res.send(resu)
            })
        });
    }
};

module.exports.page = '/api/messages';
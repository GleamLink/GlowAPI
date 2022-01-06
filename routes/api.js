const { Router } = require('express');

module.exports.Router = class Routes extends Router {
    constructor() {
        super();

        this.get('/', function (req, res) {
           return res.send({"message": "404: Not found"});
        });
    }
};

module.exports.page = '/api';
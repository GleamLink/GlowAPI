const { Router } = require('express')
const mysql = require('../src/mysql_pool.js')
const jwt = require('jsonwebtoken')

module.exports.Router = class Routes extends Router {
    constructor() {
        super();

        this.get('/:token', async (req, res, next) => {
            try {
                const decoded = jwt.verify(req.params.token, process.env.EMAIL_SECRET)
                console.log(decoded)
                await mysql.createQuery('UPDATE users SET isVerified=1 WHERE id=?', [decoded], (err, resu) => {
                    if(err) res.send(err)
                    res.send({"id": decoded.user, "isVerified": true})
                })
                
            } catch (error) {
                res.status(500)
            }
        })
        
    }
};

module.exports.page = '/verify-email';
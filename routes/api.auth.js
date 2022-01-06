const { Router } = require('express')
const jwt = require('jsonwebtoken')
const mysql = require('../src/mysql_pool.js')
const md5 = require('md5')
const crypto = require('crypto')
const validator = require('validator')

let transporter = require('nodemailer').createTransport({
    name: process.env.NODEMAILER_NAME,
    host: process.env.NODEMAILER_HOST,
    port: process.env.NODEMAILER_PORT,
    secure: false,
    auth: {
        user: process.env.NODEMAILER_AUTH_USER,
        pass: process.env.NODEMAILER_AUTH_PASS,
    },
    tls : { rejectUnauthorized: false }
})

module.exports.Router = class Routes extends Router {
    constructor() {
        super();

        this.get('/', (req, res) => {
           return res.send({"message": "404: Not found"});
        });

        this.post('/signup', async (req, res, next) => {
            if(!req.body.username) return res.status(400).send({"message": "Body 'username' is unknown"})
            else if(!req.body.email) return res.status(400).send({"message": "Body 'email' is unknown"})
            else if(!req.body.password) return res.status(400).send({"message": "Body 'password' is unknown"})
            if(!validator.isEmail(req.body.email)) return res.status(400).send({"message": "Invalid email"})
            
            require('../src/util').createUser(req, res, req.body.username, req.body.email, req.body.password)

        })

        this.post('/login', async (req, res) => {
            if(!req.body.email) return res.status(400).send({"message": "Body 'email' is unknown"})
            if(!req.body.password) return res.status(400).send({"message": "Body 'password' is unknown"})
            await mysql.createQuery('SELECT * FROM users WHERE email = ?', [req.body.email], (err, resu) => {
                if(err) return console.error(err)
                if(resu[0]) {
                    if(md5(req.body.password) == resu[0].password) {
                        if(!resu[0].isVerified) return res.status(401).send({ "message": "Account not activated" })
                        const user = JSON.parse(JSON.stringify(resu[0]))
                        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
                        res.json(accessToken)
                    }
                    else
                        return res.status(401).send({ "message": "Invalid credentials" })
                }
                else 
                    return res.status(401).send({ "message": "Invalid credentials" })
            })
            
        });

        this.get('/account', authToken, (req, res) => {
            res.json({ "username": req.user.username, "email": req.user.email })
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

const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

module.exports.page = '/api/auth';
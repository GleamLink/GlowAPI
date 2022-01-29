const { Router } = require('express')
const jwt = require('jsonwebtoken')
const mysql = require('../src/mysql_pool.js')
const md5 = require('md5')
const crypto = require('crypto')
const validator = require('validator')
const { verifyAccessToken, signAccessToken, getUser, signRefreshToken, userExists, sendVerificationMail } = require('../src/util')

module.exports.Router = class Routes extends Router {
    constructor() {
        super();

        this.get('/', (req, res) => {
           return res.send({"message": "404: Not found"});
        });

        this.post('/signup', async (req, res, next) => {
            if(!req.body.username) return res.status(400).send({"message": "Please provide a username"})
            if(!req.body.email) return res.status(400).send({"message": "Please provide an email"})
            if(!req.body.password) return res.status(400).send({"message": "Please provide a password"})
            if(!validator.isEmail(req.body.email)) return res.status(400).send({"message": "Invalid email"})

            // Iterate random ID
            let userId = Math.floor(Date.now()/1000).toString(16) + genRanHex(10)
            
            // Insert data
            await mysql.createQuery("INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)", 
            [
                userId,
                req.body.username,
                req.body.email,
                md5(req.body.password)
            ], (err, resu) => {
                if(err) {
                    // Check if username/email is already taken (username & email = unique entries)
                    if(err.errno == 1062/*1062 = ER_DUP_ENTRY*/) return res.status(500).json({ "message": err.sqlMessage })
                    else return res.status(500).send(err)
                }
                
                // Everything is good
                else {
                    sendVerificationMail(userId, req.body.email)
                    res.status(200).send({ "message": "Check emails for account activation. This can take up to 5 minutes." })
                }
            })


        })

        this.post('/login', async (req, res) => {
            if(!req.body.email) return res.status(400).send({"message": "Body 'email' is unknown"})
            if(!req.body.password) return res.status(400).send({"message": "Body 'password' is unknown"})
            await mysql.createQuery('SELECT * FROM users WHERE email = ?', [req.body.email], (err, resu) => {
                if(err) return console.error(err)
                if(resu[0]) {
                    if(md5(req.body.password) == resu[0].password) {
                        if(!resu[0].isVerified) return res.status(401).send({ "message": "Account not activated" })
                        const userId = JSON.parse(JSON.stringify(resu[0])).id
                        
                        signAccessToken(userId)
                        .then(aToken => {
                            res.json({"token": aToken})
                        })
                    }
                    else
                        return res.status(401).send({ "message": "Invalid credentials" })
                }
                else 
                    return res.status(401).send({ "message": "Invalid credentials" })
            })
            
        });

        this.get('/account', verifyAccessToken, (req, res) => {
            getUser(req.user.userId, (err, resu) => {
                
                if(err) { console.log(err); res.status(500).send(err) }
                res.json({
                    "id": resu.id,
                    "username": resu.username,
                    "email": resu.email,
                })
            })
        })
    }
};


const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

module.exports.page = '/api/auth';
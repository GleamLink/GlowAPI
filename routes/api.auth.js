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
            if(!req.body.email) return res.status(400).send({"message": "Body 'email' is unknown"})
            if(!req.body.password) return res.status(400).send({"message": "Body 'password' is unknown"})
            if(!validator.isEmail(req.body.email)) return res.status(400).send({"message": "Invalid email"})

            // Iterate random ID
            let userId = Math.floor(Date.now()/1000).toString(16) + '.' + genRanHex(10)
            
            // See if username is already taken or not
            await mysql.createQuery("SELECT * FROM users WHERE username = ?", [req.body.username], async (err, resu1) => {
                if (resu1.length)
                    return res.status(500).send({ "message": "Username already taken" });
                else {
                    // See if email is already taken or not
                    await mysql.createQuery("SELECT * FROM users WHERE email = ?", [req.body.email], async (err, resu2) => {
                        if (resu2.length)
                            return res.status(500).send({ "message": "Email already taken" });
                        else {
                            // Insert data in database
                            await mysql.createQuery("INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)", 
                            [
                                userId,
                                req.body.username,
                                req.body.email,
                                md5(req.body.password)
                            ], (err, resu) => {
                                if(err) res.status(500).json(err)
                                // Everything is good
                                else {
                                    jwt.sign(userId, process.env.EMAIL_SECRET,  (err, emailToken) => {
                                            const url = `http://${req.headers.host}/verify-email/${emailToken}`
                                            
                                            transporter.sendMail({
                                                from: '"GlowAPP" <noreply@glowapp.eu>',
                                                to: req.body.email,
                                                subject: 'Glow - verify your email',
                                                html: `
                                                    <h1>Hello,</h1>
                                                    <p>Thank you for registering on our website.</p>
                                                    <p>Please verify your email address by clicking down below.</p>
                                                    <p>This link expires in 10 minutes.</p>
                                                    <a href="${url}">Verify</a>
                                                `
                                            }, (err, info) => {
                                                if(err) return res.send(err)
                                            })
                                        }
                                    )
                                    res.status(200).send("Check emails for account activation")
                                }
                            })
                        }
                    });
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
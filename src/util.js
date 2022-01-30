const mysql = require('mysql')
const file = require('./util')
const jwt = require('jsonwebtoken')
const res = require('express/lib/response')

let transporter = require('nodemailer').createTransport({
    host: process.env.NODEMAILER_NAME,
    port: process.env.NODEMAILER_PORT,
    secure: false,
    tls: {             
        rejectUnauthorized: false
    }
})

const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

module.exports.pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}),
module.exports = {
    // USER ACCOUNT
    getUser: async (userId, callback) => {
        await this.pool.query('SELECT * FROM users WHERE id=?', [userId], (err, res) => {
            if(err) return console.log(err)
            return callback(err, JSON.parse(JSON.stringify(res))[0])
        })
    },
    updateUser: async (userId, username, avatar, banner, banner_color, callBack) => { /* TODO: Check if username is already taken or not */
        try {
            await this.pool.query('SELECT * FROM users WHERE id=?', [userId], async (err, res) => {
                // console.log(res)
                if(err) return callBack(true, err)
                if(!res.length) return callBack(true, new Error("Unexisting user"))
                if(username == null) username = JSON.parse(JSON.stringify(res))[0].username
                if(avatar == null) avatar = JSON.parse(JSON.stringify(res))[0].avatar
                if(banner == null) banner = JSON.parse(JSON.stringify(res))[0].banner
                if(banner_color == null) banner_color = JSON.parse(JSON.stringify(res))[0].banner_color
                await this.pool.query(`UPDATE users SET username=?, avatar=?, banner=?, banner_color=? WHERE id=?`,
                [
                    username,
                    avatar,
                    banner,
                    banner_color,
                    userId
                ],
                (err, res) => {
                    if(err) return callBack(true, console.log(err))
                    else return callBack(false)
                })
            })
        } catch (error) {
            console.error(error)
        }        
    },
    userExists: (email, username, cb) => {
        if(email)
            this.pool.query("SELECT * FROM users WHERE email = ?", [email], (err, res) => {
                if(res.length) cb(err, true, "Email")
                else this.pool.query("SELECT * FROM users WHERE username = ?", [username], (err, res) => {
                    if(res.length) cb(err, true, "Username")
                    else cb(err, false, "")
                })
            })
    },
    sendVerificationMail: (userId, email) => {
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
                console.log(err)
                if(err) return res.status(500).send(err)
            })
        })
    },
    signAccessToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {userId: userId}
            const secret = process.env.ACCESS_TOKEN_SECRET
            jwt.sign(payload, secret, { expiresIn: '1h' }, (err, token) => {
                if(err) {
                    reject(500)
                }
                resolve(token)
            })
        })
    },
    verifyAccessToken: (req, res, next) => {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        try {
            if(token == null) return res.sendStatus(401)

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
                if(err) {
                    return res.status(500).send(err)
                }
                req.user = user
                req.token = token
                next()
            })
        } catch (err) {
            res.status(500).send(err)
        }
        
    },
    // signRefreshToken: (userId) => {
    //     return new Promise((resolve, reject) => {
    //         const payload = { userId: userId }
    //         const secret = process.env.REFRESH_TOKEN_SECRET
    //         jwt.sign(payload, secret, { expiresIn: '6m' }, (err, token) => {
    //             if(err) {
    //                 reject(500)
    //             }
    //             resolve(token)
    //         })
    //     })
    // },
    // !!USER ACCOUNT
    // POSTS
    createPost: (userId, desc, img, callBack) => {
        const randomDateId = Math.floor(Date.now()/1000).toString(16) + genRanHex(10);
        this.pool.query("INSERT INTO posts (id, userId, description, imageId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)", 
        [
            randomDateId,
            userId,
            desc,
            img,
            Math.floor(new Date() / 1000).toString(),
            Math.floor(new Date() / 1000).toString()
        ], (err, resu) => {
            return callBack(err, resu)
        })
    },
    getPosts: (userId, callBack) => {
        this.pool.query('SELECT * FROM posts WHERE userId = ?', [userId], (err, res) => {
            return callBack(err, res)
        })
    },
    getPost: (userId, postId, callBack) => {
        this.pool.query('SELECT * FROM posts WHERE userId = ? AND id = ?', [userId, postId], (err, res) => {
            return callBack(err, res)
        })
    },
    updatePost: (userId, postId, desc, callBack) => {
        this.pool.query('UPDATE posts SET description = ? WHERE userId = ? AND id = ?', [desc, userId, postId], (err, res) => {
            return callBack(err, res)
        })
    }
}
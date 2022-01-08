const mysql = require('mysql')
const file = require('./util')
const jwt = require('jsonwebtoken')

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

module.exports.pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}),
module.exports = {
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
                if(err) return res.send(err)
            })
        })
    },
    signAccessToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {userId: userId}
            const secret = process.env.ACCESS_TOKEN_SECRET
            const options = {
                expiresIn: '1h',
            }
            jwt.sign(payload, secret, options, (err, token) => {
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
        if(token == null) return res.sendStatus(401)

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if(err) return res.status(403).send(err)
            req.user = user
            next()
        })
    },
    signRefreshToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {userId: userId}
            const secret = process.env.REFRESH_TOKEN_SECRET
            const options = {
                expiresIn: '6m',
            }
            jwt.sign(payload, secret, options, (err, token) => {
                if(err) {
                    reject(500)
                }
                resolve(token)
            })
        })
    },
}
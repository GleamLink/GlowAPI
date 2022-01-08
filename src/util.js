const mysql = require('mysql')
const file = require('./util')
const jwt = require('jsonwebtoken')

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
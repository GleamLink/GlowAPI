const mysql = require('mysql')
const file = require('./util')

module.exports.pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}),
module.exports.getUser = async (userId, callback) => {
    await this.pool.query('SELECT * FROM users WHERE id=?', [userId], (err, res) => {
        if(err) return console.log(err)
        return callback(err, JSON.stringify(res))
    })
},
module.exports.updateUser = async (userId, username, avatar, banner, banner_color, callBack) => {
    try {
        this.getUser(userId, async (err, res) => {
            // console.log(res)
            if(err) return callBack(true, err)
            if(!res.length) return callBack(true, new Error("Unexisting user"))
            if(username == null) username = JSON.parse(res)[0].username
            if(avatar == null) avatar = JSON.parse(res)[0].avatar
            if(banner == null) banner = JSON.parse(res)[0].banner
            if(banner_color == null) banner_color = JSON.parse(res)[0].banner_color
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
}

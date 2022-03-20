const mysql = require('mysql')
const { getUser } = require('../util')

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
})

module.exports.findUser = (startUsername, cb) => { // Find a user with the start of his username
    try {
        pool.query(`
            SELECT id, username, avatar, banner, banner_color, bio 
            FROM users WHERE
                username LIKE '${startUsername}%' AND
                isVerified = 1
            ORDER BY username
            LIMIT 5`
        , (err, res) => {
            if(!res.length) return cb(null, []) //cb({"code": 12, "message": "No users found."}, null)
            cb(null, res)
        })
    } catch (err) {
        cb(err, null)
    }
}
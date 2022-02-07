const mysql = require('mysql')

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
})

module.exports.getFollowers = (userId, cb) => {
    try {
        pool.query('SELECT followers FROM users WHERE id = ?', [userId], (err, res) => {
            if(err) return cb(err, null)
            if(res[0].followers === '') return cb(err, []) // empty array => no followers
            return cb(err, res[0].followers.split(',')) 
        })
    } catch (err) {
        return cb(err, null)
    }
}
module.exports.getFollowing = (userId, cb) => {
    try {
        pool.query('SELECT following FROM users WHERE id = ?', [userId], (err, res) => {
            if(err) return cb(err, null)
            if(res[0].following === '') return cb(err, []) // empty array => no following
            return cb(err, res[0].following.split(',')) 
        })
    } catch (err) {
        return cb(err, null)
    }
}
module.exports.isFriend = (userId, friendId, cb) => {
    this.getFollowers(userId, (err, res) => {
        if(err) return cb(err, null)
        if(!res.includes(friendId)) return cb(err, false)
        this.getFollowers(friendId, (err, res) => {
            if(err) return cb(err, null)
            if(!res.includes(userId)) return cb(err, false)
            else return cb(err, true)
        })
    })
}
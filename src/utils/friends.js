const mysql = require('mysql')
const { getUser } = require('../util')

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
})

module.exports.getFriends = (userId, cb) => { // People the User is officially friend with
    try {
        pool.query('SELECT U.userId, U.username, U.distinguisher, F.date FROM friends AS F, users AS U' +
                        'WHERE CASE WHEN F.userId = ? THEN F.friendId = U.userId WHEN F.friendId = ? THEN F.userId = U.userId END AND F.status = 1 ' +
                        'ORDER BY F.date ASC;', [userId, userId], (err, res) => {
            if(err) return cb(err, null)
            if(!res.length) return cb({"message": "Unknown user."}, null)
            if(res[0].followers === '') return cb(err, []) // empty array => no followers
            console.log(res[0].followers.split(','))
            return cb(err, res[0].followers.split(','))
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
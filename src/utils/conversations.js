const mysql = require('mysql')
const { genRanHex } = require('../util')

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
})

module.exports.createConversation = (firstMemberId, secondMemberId, cb) => {
    try {
        let convId = Math.floor(Date.now()/1000).toString(16) + genRanHex(10)
        pool.query('INSERT INTO conversations (conversationId, members) VALUES (?, ?)', [convId, firstMemberId + ',' + secondMemberId], (err, res) => {
            if(err) return cb(err, null)
            if(res.affectedRows > 0) return cb(null, "Group created!")
            cb(err, res)
        })
    } catch (err) {
        console.log(err)
        cb(err, null)
    }
}

module.exports.getConversation = (firstUserId, secondUserId, cb) => {
    try {
        pool.query(
            "SELECT conversationId FROM conversations WHERE members LIKE '%" + firstUserId + "%' AND members LIKE '%" + secondUserId + "%'"
        , (err, res) => {
            // return console.log("abc" + res[0])
            if(!res) return cb(null, [])
            cb(null, res)
        })
    } catch (err) {
        cb(err, null)
    }
}
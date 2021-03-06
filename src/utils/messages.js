const res = require('express/lib/response')
const mysql = require('mysql')
const { genRanHex } = require("../util")

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
})

module.exports.createMessage = (conversationId, authorId, text, cb) => {
    try {
        const nowDate = Math.round(Date.now()/1000)
        const messageId = Math.floor(Date.now()).toString(16) + genRanHex(7) // 13 + 7
        pool.query("INSERT INTO messages (messageId, conversationId, authorId, text, timestamp, edited) VALUES (?, ?, ?, ?, ?, ?)", 
        [
            messageId,
            conversationId,
            authorId,
            text,
            nowDate,
            nowDate
        ], (err, res) => {
            console.log("A: "+err,res)
            if(res.affectedRows > 0) return cb(null, {
                messageId,
                conversationId,
                authorId,
                text,
                timestamp: nowDate,
                edited: nowDate
            })
            return cb(null, res)
        })
    } catch (err) {
        return cb(err, null)
    }
}

module.exports.getMessages = (conversationId, cb) => {
    try {
        pool.query('SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC', [conversationId], (err, res) => {
            return cb(null, res)
        })
    } catch (err) {
        return cb(err, null)
    }
}
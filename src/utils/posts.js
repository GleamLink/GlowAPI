const mysql = require('mysql')
const { getFriends } = require('./friends')

module.exports.pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}),

module.exports = {
    createPost: (postId, userId, desc, file, cb) => {
        try {
            this.pool.query('INSERT INTO posts (postId, userId, description, image, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)', [
                postId,
                userId,
                desc,
                file,
                Math.round(new Date() / 1000),
                Math.round(new Date() / 1000)
            ], (err, res) => {
                if(res.affectedRows > 0)
                    return cb(null, {
                        "postId": postId,
                        "userId": userId,
                        "description": desc,
                        "image": file,
                        "likes": [],
                        "comments": []
                    })
                    
                return cb(null, res)
            })
        } catch (err) {
            cb(err, null)
        }
    },
    deletePost: (postId, cb) => {
        try {
            this.pool.query('DELETE FROM posts WHERE postId = ?', [postId], (err, res) => {
                if(res.affectedRows > 0) return cb(null, "Deleted")
                else cb(null, "Nothing deleted")
            })
        } catch (err) {
            cb(err, null)
        }
    },
    getFollowingPosts: (userId, cb) => {
        try {
            getFollowing(userId, (err, res) => {
                let followers = res.toString().split(',')
                followers.push(userId)
                this.pool.query('SELECT B.username, B.avatar, A.* FROM posts A inner join users B on A.userId = B.id WHERE A.userId IN (?) ORDER BY createdAt DESC LIMIT 10', [followers], (err, myRes) => { // Last to first and max 10 "SELECT * FROM posts WHERE userId IN (?) ORDER BY createdAt DESC LIMIT 10"
                    if(!myRes) return cb(null, [])
                    cb(null, myRes)
                })
            })
        } catch (err) {
            cb(err, null)
        }
    },
    getPost: (postId, cb) => {
        try {
            this.pool.query('SELECT B.username, B.avatar, A.* FROM posts A inner join users B on A.userId = B.id WHERE postId = ?', [postId], (err, res) => {
                if(!res.length) return cb({"message": "No post existing with this id"}, null)
                return cb(null, res)
            })

        } catch (err) {
            cb(err, null)
        }
    }
}
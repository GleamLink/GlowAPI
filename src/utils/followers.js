const mysql = require('mysql')
const { getUser } = require('../util')

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
})

module.exports.getFollowers = (userId, cb) => { // People following the User
    try {
        pool.query('SELECT followers FROM users WHERE id = ?', [userId], (err, res) => {
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
module.exports.getFollowRequests = (userId, cb) => {
    try {
        pool.query('SELECT * FROM followRequest WHERE requestedId = ? AND status = 1', [userId], (err, res) => {
            if(!res.length) return cb({"message": "No requests."}, null)
            return cb(null, res)
        })
    } catch (err) {
        return cb(err, null)
    }
}
module.exports.getFollowing = (userId, cb) => { // People the User follows
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
module.exports.isFollowing = (userId, followingId) => {
    try {
        this.getFollowers(userId, (err, res) => {
            if(err) return null
            if(res.includes(followingId)) return true
            else false
        })
    } catch (err) {
        console.log(err)
    }
}
module.exports.hasSentRequest = (userId, followingId, cb) => {
    try {
        pool.query("SELECT * FROM followRequest WHERE requesterId = ? AND requestedId = ?", [userId, followingId], (err, res) => {
            if(!res.length) return cb(err, false)
            if(res[0].status === 1) return cb(err, true)
            else return cb(err, false)
        })
    } catch (err) {
        
    }
}
module.exports.sendFollowRequest = (userId, followingId, cb) => {
    try {
        if(this.isFollowing(userId, followingId))
            return cb({"message": "You are already following this user."}, null)
        this.hasSentRequest(userId, followingId, (err, bool) => {
            if(bool) return cb({"message": "You already sent a follow request."}, null)
            pool.query('INSERT INTO followRequest (requesterId, requestedId) VALUES (?, ?)', [userId, followingId], (err, res) => {
                if(err) return cb(err, null)
                return cb(err, "Followed")
            })
        })
    } catch (err) {
        return cb(err, null)
    }
}
module.exports.acceptFollowRequest = (requestedId /*USER BEING FOLLOWED*/, requesterId /*USER WHO FOLLOWED*/, cb) => {
    try {
        if(this.isFollowing(requesterId, requestedId)) return cb({"message": "Already following."}, null)
        getUser(requesterId, (err, res) => {
            if(err) return cb(err, null)
            console.log(res)
            pool.query('SELECT status FROM followRequest WHERE requestedId = ? AND requesterId = ?', [requestedId, requesterId], (err, res) => {
                if(err) return cb(err, null)
                if(!res.length) return cb({"message": "No friend request has been sent to you from this user."})
                if(res[0].status !== 2) {
                    pool.query('UPDATE followRequest SET status = 2 WHERE requesterId = ? AND requestedId = ?', [requesterId, requestedId])
                    this.getFollowers(requestedId, (err, res) => {
                        if(!res.includes(requesterId)) {
                            var tempArr = res
                            tempArr.push(requesterId)
                            console.log(requestedId, tempArr)
                            pool.query('UPDATE users SET followers = ? WHERE id = ?', [tempArr.join(','), requestedId])
                        }
                        
                    })
                    this.getFollowing(requesterId, (err, res) => {
                        if(!res.includes(requestedId)) {
                            var tempArr = res
                            tempArr.push(requestedId)
                            console.log(requesterId, tempArr)
                            pool.query('UPDATE users SET following = ? WHERE id = ?', [tempArr.join(','), requesterId])
                        }
                    })
                    return cb(null, "Done")
                }
                else {
                    return cb({"message": "User already following."})
                }
            })
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
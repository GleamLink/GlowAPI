const { Router } = require('express')
const jwt = require('jsonwebtoken')
const md5 = require('md5')
const multer = require('multer')
const { getUser, verifyAccessToken, pool, usernameToId, genRanHex, updateUser, getUsers } = require('../src/util')
const { changeUserAvatar, isValidBase64, createBase64File } = require('../src/utils/avatar')
const { getFollowers, getFollowing, isFriend, sendFollowRequest, acceptFollowRequest, getFollowRequests } = require('../src/utils/followers')
const { findUser } = require('../src/utils/users')

module.exports.Router = class Routes extends Router {
    constructor() {
        super();

        // Root
        this.get('/', verifyAccessToken, (req, res) => {
            getUser(req.user.userId, (err, resu) => {
                console.log(resu.isAdmin)
                if(!resu.isAdmin) return res.send({"message": "404: Not found"});
                getUsers((err, resu) => {
                    if(err) return res.status(500).send(resu)
                    return res.json(resu)
                })
            })
        })

        // GET /users?searchUser=... - Searches a user with the beginning of his username
        this.get('/search', verifyAccessToken, (req, res) => {
            if(!req.query.searchUser) return res.send({"message": "You need to add a searchUser query."})
            findUser(req.query.searchUser, (err, resu) => {
                if(err) return res.status(500).send(err)
                res.send(resu)
            })
        })

        // GET /user/search - returns an userId if the body username exists
        // this.get('/search/:username', verifyAccessToken, (req, res) => {
        //     usernameToId(req.params.username, (err, resu) => {
        //         if(err) return res.status(500).send(err)
        //         res.send(resu)
        //     })
        // })

        // GET /users/@me - shows information about the user with token in Authorization
        this.get('/@me', verifyAccessToken, async (req, res) => {
            getUser(req.user.userId, (err, resu) => {
                const user = resu
                delete user.password, delete user.isVerified, delete user.isAdmin
                console.log(user)
                return res.json(user)
            })
            
        })

        // GET /users/@me/isAdmin - returns true/false if user is admin
        this.get('/@me/isAdmin', verifyAccessToken, async (req, res) => {
            getUser(req.user.userId, (err, resu) => {
                console.log(resu.isAdmin)
                if(resu.isAdmin === 0) return res.send(false)
                else if(resu.isAdmin === 1) return res.send(true)
                else res.status(500).send({"message": "Unknown"})
                return res.send(resu.isAdmin)
            })
        })

        // GET /users/@me/avatar - returns the avatar of the user (if none, returns null)
        this.get('/@me/avatar', verifyAccessToken, async (req, res) => {
            getUser(req.user.userId, (err, resu) => {
                if(!resu.avatar) return res.status(500).send({"message": "No avatar."})
                res.sendFile(process.cwd() + "/forest/assets/avatars/" + resu.avatar)
            })
        })

        // FOLLOWERS/FOLLOWING/FRIENDS

        // GET /users/@me/followers/requests - return an array of the follow requests from other users to this user
        this.get('/@me/followers/requests', verifyAccessToken, (req, res) => {
            getFollowRequests(req.user.userId, (err, resu) => {
                if(err) return res.status(500).send(err)
                delete resu.id
                delete resu.acceptedDate
                delete resu.requestedId
                res.send(resu)
            })
        })

        // GET /users/@me/followers - return an array of the followers of the user
        this.get('/@me/followers', verifyAccessToken, (req, res) => {
            getFollowers(req.user.userId, (err, resu) => {
                if(err) return res.status(500).send(err)
                res.send(resu)
            })
        })

        // GET /users/@me/following - return an array of the followers of the user
        this.get('/@me/following', verifyAccessToken, (req, res) => {
            getFollowing(req.user.userId, (err, resu) => {
                if(err) return res.status(500).send(err)
                res.send(resu)
            })
        })

        // GET /users/:id - shows information about user with given id
        this.get('/:id', verifyAccessToken, (req, res) => {
            getUser(req.params.id, (err, resu) => {
                console.log(resu)
                if (err) return res.status(500).send(err)
                delete resu.isAdmin
                delete resu.password
                delete resu.email
                delete resu.locale
                delete resu.isVerified
                return res.send(resu)
            })
        })

        // POST /users/:id/follow - follow :id
        this.post('/:id/follow', verifyAccessToken, (req, res) => {
            if(req.user.userId === req.params.id) return res.status(403).send({"message": "You can't follow yourself."})
            sendFollowRequest(req.user.userId, req.params.id, (err, resu) => {
                if(err) return res.status(500).send(err)
                res.send(resu)
            })
        })
        // POST /users/:id/follow/accept - accept a follow request from :id
        this.post('/:id/follow/accept', verifyAccessToken, (req, res) => {
            acceptFollowRequest(req.user.userId, req.params.id, (err, resu) => {
                if(err) return res.status(500).send(err)
                res.send("Accepted")
            })
        })
        // DELETE /users/:id/follow - unfollow :id
        this.delete('/:id/follow', verifyAccessToken, (req, res) => {
            
        })

        // GET /users/@me/friends/:id - return an boolean if user and ':id' follow each other (friends)
        this.get('/@me/friends/:id', verifyAccessToken, (req, res) => {
            isFriend(req.user.userId, req.params.id, (err, resu) => {
                if(err) return res.status(500).send(err)
                res.send(resu)
            })
        })

        // !FOLLOWERS/FOLLOWING/FRIENDS

        // PATCH /users/@me - edit user profile
        this.patch('/@me', verifyAccessToken, (req, res) => {
            if(!req.body.password) return res.status(401).send({"message": "Password required"})
            console.log(req.user.userId)
            getUser(req.user.userId, (err, resu) => {
                if(err) return res.status(500).send(err)
                if(md5(req.body.password) !== resu.password) return res.status(401).send({"message": "Wrong password"})
                
                if(req.body.avatar) {
                    if(!isValidBase64(req.body.avatar)) return res.status(500).send({"message": "Invalid base64."})

                    const fileName = parseInt(new Date().getTime()/1000).toString(16) + genRanHex(24) // 8 + 24
                    createBase64File(req.body.avatar, fileName)

                    changeUserAvatar(req.user.userId, fileName + ".png", (err, resu) => {
                        console.log(err)
                        if(err) return res.status(500).send({"message": err})
                        updateUser(req.user.userId, req.body.username, req.body.banner, req.body.banner_color, (myErr, myRes) => {
                            if(myErr) return res.status(500).send(myErr)
                            else res.sendStatus(200)
                        })
                    })
                } else {
                    updateUser(req.user.userId, req.body.username, req.body.banner, req.body.banner_color, (myErr, myRes) => {
                        if(myErr) return res.status(500).send(myErr)
                        else res.sendStatus(200)
                    })
                }
            })
        })
    }
};

module.exports.page = '/api/users';
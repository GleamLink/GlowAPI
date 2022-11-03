const { Router } = require('express')
const jwt = require('jsonwebtoken')
const md5 = require('md5')
const multer = require('multer')
const { getUser, verifyAccessToken, genRanHex, updateUser } = require('../src/util')
const { changeUserAvatar, isValidBase64, createBase64File } = require('../src/utils/avatar')
const { findUser } = require('../src/utils/users')

module.exports.Router = class Routes extends Router {
    constructor() {
        super();

        // Root
        this.get('/', verifyAccessToken, (req, res) => {
            return res.status(500).send("Not found")
        })

        // GET /users?searchUser=... - Searches a user with the beginning of his username
        this.get('/', verifyAccessToken, (req, res) => {
            if(!req.query.searchUser.length < 2) return res.send({"message": "At leats 2 characters are needed."})
            findUser(req.query.searchUser, (err, resu) => {
                if(err) return res.status(500).send(err)
                res.send(resu)
            })
        })

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
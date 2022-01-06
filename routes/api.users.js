const { Router } = require('express')
const jwt = require('jsonwebtoken')

module.exports.Router = class Routes extends Router {
    constructor() {
        super();

        this.get('/', authToken, (req, res) => {
            if(req.user.isAdmin) {
                req.mysql.query('SELECT * FROM users', (err, resu) => {
                    return res.json(resu)
                })
            } else {
                return res.send({"message": "404: Not found"});
            }
           
        });

        this.get('/@me', authToken, async (req, res) => {
                delete req.user.password
                console.log(JSON.parse(req.user.avatar))
                req.user.avatar = {
                    "id": JSON.parse(req.user.avatar).id,
                    "filename": JSON.parse(req.user.avatar).filename
                }
                req.user.relations = JSON.parse(req.user.relations)
                return res.json(req.user)
        })

        this.get('/:id', authToken, async (req, res) => {
            await req.mysql.query('SELECT * FROM users WHERE id = ?', [req.params.id], (err, resu) => {
                if (err) console.error(err)
                return res.send({
                    "id": resu[0].id, 
                    "username": resu[0].username, 
                    "avatar": resu[0].avatar,
                    "banner": resu[0].banner,
                    "banner_color": resu[0].banner_color
                })
            })
        });
        this.get('/@me/friends', authToken, async (req, res) => {
            await req.mysql.query('SELECT * FROM friends WHERE user = ?', [req.user.id], (err, resu) => {
                res.json(resu)
            })
        });

        
    }
};

function authToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

module.exports.page = '/api/users';
const { Router } = require("express")
const { verifyAccessToken } = require("../src/util")
const mysql = require("../src/mysql_pool")
const crypto = require('crypto-js')

module.exports.Router = class Routes extends Router {
    constructor() {
        super()

        this.get("/", verifyAccessToken, (req, res) => {
            const { user_id } = req.user
            mysql.createQuery("SELECT * FROM wallets WHERE user_id = ?", [user_id], (err, result) => {
                if(err) {
                    console.error(err)
                    res.status(500).send("Internal server error")
                    return
                }
                if(!result.length) return res.status(404).send("No wallet found for user id")
                let { wallet_address, wallet_token } = result[0]
                wallet_token = crypto.AES.decrypt(wallet_token, process.env.WALLET_SECRET).toString()
                
                if(req.query.privateKey == "true")
                    res.send({ user_id: user_id, wallet_address, wallet_token})
                else
                    res.send({ user_id: user_id, wallet_address})
            })
        })
    }
}

module.exports.page = "/api/wallet"
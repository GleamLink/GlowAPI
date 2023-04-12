const { Router } = require("express")
const { verifyAccessToken } = require("../src/util")
const mysql = require("../src/mysql_pool")
const crypto = require('crypto-js')
const { Wallet } = require("../src/class/CryptoWallet")
const axios = require('axios')

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
                const { wallet_address, wallet_token } = result[0]
                const privKey = crypto.AES.decrypt(wallet_token, process.env.WALLET_SECRET).toString(crypto.enc.Utf8)
                
                if(req.query.privateKey == "true")
                    res.send({ user_id: user_id, wallet_address, privKey})
                else
                    res.send({ user_id: user_id, wallet_address})
            })
        })

        this.get("/balance", verifyAccessToken, (req, res) => {
            const { user_id } = req.user
            mysql.createQuery("SELECT * FROM wallets WHERE user_id = ?", [user_id], (err, result) => {
                if(err) {
                    console.error(err)
                    res.status(500).send("Internal server error")
                    return
                }
                if(!result.length) return res.send("No wallet available for that id")
                const wallet = result[0]
                axios.get('https://api.blockcypher.com/v1/btc/main/addrs/' + wallet.wallet_address + '/balance')
                    .then(response => {
                        console.log(response.data)
                        res.set('Content-Type', 'text/html')
                        res.send(response.data.balance.toString())
                    })
                    .catch(err => {
                        console.error(err)
                        res.status(500).send("Internal server error")
                        return
                    })
            })
        })
    }
}

module.exports.page = "/api/wallet"
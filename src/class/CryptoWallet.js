const bitcoin = require("bitcoinjs-lib")
// Generate a new Bitcoin key pair
const keyPair = bitcoin.ECPair.makeRandom()
// Get the Bitcoin address associated with the key pair
const address = keyPair.getAddress()
// Get the private key (in Wallet Import Format) associated with the key pair
const privateKey = keyPair.toWIF()

const axios = require('axios')

const mysql = require("../mysql_pool.js")

module.exports.Wallet = class Wallet {
    constructor(userId) {
        this.userId = userId
    }

    getMoney(cb) {
        mysql.createQuery("SELECT * FROM wallets WHERE user_id = ?", [this.userId], (err, res) => {
            if(err) return cb(err)
            if(!res.length) cb(new Error("No wallet available for that id"))
            const wallet = res[0]
            axios.get('https://api.blockcypher.com/v1/btc/main/addrs/' + wallet.wallet_address + '/balance')
                .then(response => {
                    return response.balance
                })
                .catch(err => console.error(err))
        })
    }
}

module.exports.genWallet = function genWallet() {
    return {
        address, privateKey
    }
}
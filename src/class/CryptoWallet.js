const { PrivateKey } = require("bitcore-lib")
const { mainnet, testnet } = require("bitcore-lib/lib/networks")
const Mnemonic = require("bitcore-mnemonic")

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

module.exports.genWallet = (network = testnet) => {
    let passPhrase = new Mnemonic(Mnemonic.Words.ENGLISH)
    let xpriv = passPhrase.toHDPrivateKey(passPhrase.toString(), network)

    return {
        xpub: xpriv.xpubkey,
        private_key: xpriv.privateKey.toString(),
        address: xpriv.publicKey.toAddress().toString(),
        mnemonic: passPhrase.toString()
    }
}
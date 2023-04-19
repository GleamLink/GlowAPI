const { mainnet, testnet } = require("bitcore-lib/lib/networks")
const { genWallet } = require("../class/CryptoWallet");

console.log(genWallet(testnet))
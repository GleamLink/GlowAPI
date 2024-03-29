const { Router } = require("express")
const jwt = require("jsonwebtoken")
const mysql = require("../src/mysql_pool.js")
const md5 = require("md5")
const validator = require("validator")
const bcrypt = require("bcrypt")
const crypto = require('crypto-js');
const { genWallet } = require('../src/class/CryptoWallet.js')

module.exports.Router = class Routes extends Router {
    constructor() {
        super()

        this.get("/", (req, res) => {
            return res.send({ message: "404: Not found" })
        })

        this.post("/register", async (req, res) => {
            let userId =
                Math.floor(Date.now() / 1000).toString(16) + genRanHex(10)
            const { username, email, password } = req.body

            if (!username || !email || !password) {
                res.status(400).send(
                    "Please provide a username, email, and password."
                )
                return
            }

            function isValidUsername(username) {
                const forbiddenSubstrings = ['@', '#', ':', '```', 'glowapp'];
                const forbiddenUsernames = ['everyone', 'here'];
                
                for (let i = 0; i < forbiddenSubstrings.length; i++) {
                    if (username.includes(forbiddenSubstrings[i])) {
                        return false;
                    }
                }
                
                if (forbiddenUsernames.includes(username)) {
                    return false;
                }
                
                return true;
            }

            if(!isValidUsername(username)) return res.status(401).send("Username is invalid")

            // Check if user with this email already exists in the database
            const query = "SELECT * FROM users WHERE email = ?"
            mysql.createQuery(query, [email], (err, result) => {
                if (err) {
                    console.log(err)
                    res.status(500).send("Internal server error")
                    return
                }

                if (result.length > 0) {
                    res.status(400).send("Email already used")
                    return
                }

                // Hash the password using bcrypt
                bcrypt.hash(password, 10, (err, hashedPassword) => {
                    if (err) {
                        console.log(err)
                        res.status(500).send("Internal server error")
                        return
                    }

                    const { address, privateKey } = genWallet()
                    const encryptedWalletToken = crypto.AES.encrypt(privateKey, process.env.WALLET_SECRET).toString();

                    // Store the user's information (including the hashed password) in the database
                    mysql.createQuery(
                        "INSERT INTO users (user_id, username, email, password) VALUES (?, ?, ?, ?)",
                        [userId, username, email, hashedPassword], (err, result) => {
                        if (err) {
                            console.log(err)
                            res.status(500).send("Internal server error")
                            return
                        }

                        mysql.createQuery("INSERT INTO wallets (user_id, wallet_token, wallet_address) VALUES (?, ?, ?)",
                            [userId, encryptedWalletToken, address], (err, result) => {
                                if(err) {
                                    console.log(err)
                                }
                            })

                        res.status(200).send("User registered successfully")
                    })
                })
            })
        })

        this.post("/login", async (req, res) => {
            const { email, password } = req.body

            // Query the database to check if user exists
            const query = `SELECT * FROM users WHERE email = ?`
            mysql.createQuery(query, [email], (err, results) => {
                if (err) {
                    console.error("Error querying database: ", err)
                    res.status(500).send("Internal server error")
                    return
                }

                // Check if user exists
                if (results.length === 0) {
                    res.status(401).send("Invalid email or password")
                    return
                }

                const user = results[0]
                // Compare the provided password with the stored hash using bcrypt
                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) {
                        console.error("Error comparing passwords: ", err)
                        res.status(500).send("Internal server error")
                        return
                    }

                    // Check if password is correct
                    if (!result) {
                        res.status(401).send("Invalid email or password")
                        return
                    }

                    // User authenticated successfully
                    const payload = {
                        user_id: user.user_id,
                        email: user.email,
                    }
                    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "604800s" })
                    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET)

                    res.status(200).send({
                        access_token: accessToken,
                        expired_in: 604800,
                        refresh_token: refreshToken,
                        token_type: "Bearer",
                    })
                })
            })
        })

        this.get("/account", (req, res) => {
            const token = req.headers.authorization.split(" ")[1]
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedToken) => {
                if (err) {
                    return res
                        .status(401)
                        .json({ message: "Invalid token" })
                }
                const userId = decodedToken.userId
                const query = "SELECT id, username, email FROM users WHERE id = ?"
                mysql.createQuery(query, [userId],
                    (error, results) => {
                        if (error) {
                            console.error(error)
                            return res
                                .status(500)
                                .json({ message: "Error retrieving user information" })
                        }
                        const user = results[0]
                        if (!user) {
                            return res
                                .status(404)
                                .json({ message: "User not found" })
                        }
                        res.json({
                            id: user.id,
                            username: user.username,
                            email: user.email,
                        })
                    }
                )
            })
        })
    }
}

const genRanHex = (size) =>
    [...Array(size)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("")

module.exports.page = "/api/auth"

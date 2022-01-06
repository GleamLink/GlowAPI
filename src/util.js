const mysql = require('./mysql_pool')

module.exports.createUser = (req, res, username, email, password) => {
    // See if username is already taken or not
    await mysql.createQuery("SELECT * FROM users WHERE username = ?", [username], async (err, resu1) => {
        if (resu1.length) return res.status(500).send({ "message": "Username already taken" });
        else {
            // See if email is already taken or not
            await mysql.createQuery("SELECT * FROM users WHERE email = ?", [email], async (err, resu2) => {
                if (resu2.length) return res.status(500).send({ "message": "Email already taken" });
                else {
                    // Iterate random ID
                    let userId = Math.floor(Date.now()/1000).toString(16) + '.' + genRanHex(10)

                    // Insert data in database
                    await mysql.createQuery("INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)", 
                    [
                        userId,
                        username,
                        email,
                        md5(password)
                    ], (err, resu) => {
                        if(err) res.status(500).json(err)
                        
                        // Everything is good
                        else {
                            jwt.sign(userId, process.env.EMAIL_SECRET,  (err, emailToken) => {
                                    const url = `http://${req.headers.host}/verify-email/${emailToken}`
                                    
                                    transporter.sendMail({
                                        from: '"GlowAPP" <noreply@glowapp.eu>',
                                        to: email,
                                        subject: 'Glow - verify your email',
                                        html: `
                                            <h1>Hello,</h1>
                                            <p>Thank you for registering on our website.</p>
                                            <p>Please verify your email address by clicking down below.</p>
                                            <p>This link expires in 10 minutes.</p>
                                            <a href="${url}">Verify</a>
                                        `
                                    }, (err, info) => {
                                        if(err) return res.send(err)
                                    })
                                }
                            )
                            res.status(200).send("Check emails for account activation")
                        }
                    })
                }
            });
        }
    })
}
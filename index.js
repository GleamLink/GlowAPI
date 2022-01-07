const express = require('express')
const app = express()
const session = require('express-session');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const fs = require('fs')
const port = process.env.GLOW_PORT
const bodyParser = require('body-parser')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(bodyParser.json())

const jsonErrorHandler = async (err, req, res, next) => {
    res.status(err.status).send(err);
}
app.use(jsonErrorHandler)

app.use(session({ secret: `${Date.now()}`, resave: false, saveUninitialized: false }));

app.use((req, res, next) => {
    req.user = req.session.user

    next()
});

const files = fs.readdirSync('./routes/').filter(file => file.endsWith('.js'))

for (const file of files) {
    const route = require(`./routes/${file}`)
    app.use(route.page, new route.Router())

    console.log(`Route ${file.toLowerCase()} launched`)
}

app.listen(port, () => console.log("Server on: http://localhost:" + port))

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1800s'})
}
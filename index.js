const express = require('express')
const app = express()
var cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const cors = require("cors")

require('dotenv').config()
const fs = require('fs')
const port = process.env.GLOW_PORT
const bodyParser = require('body-parser')
const { imgToBase64 } = require('./src/utils/avatar')

app.use(cors({
    origin: "*"
}))

app.use('/forest/assets/avatars', express.static('forest/assets/avatars'))
app.use('/forest/assets/logos', express.static('forest/assets/logos'))
app.use('/forest/assets/posts', express.static('forest/assets/posts'))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }))
app.use(bodyParser.json({ limit: '50mb' }))

const jsonErrorHandler = async (err, req, res, next) => {
    res.status(err.status).send(err);
}
app.use(jsonErrorHandler)

app.use(cookieParser())

app.use((req, res, next) => {
    req.user = req.cookies.user

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
var isBase64 = require('is-base64');
const mysql = require('mysql')
var fs = require('fs');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
})

module.exports = {
    isValidBase64: (base64) => {
        return isBase64(base64, { mimeRequired: true }) // {mimeRequired: true}  =  with "data:image/png;base64," in front
    },
    changeUserAvatar: (userId, base64, cb) => {
        try {
            pool.query('UPDATE users SET avatar = ? WHERE id = ?', [base64, userId], (err, res) => {
                console.log("RES: " + res);
                return cb(err, res)
            })
        } catch (err) {
            cb(err, null)
        }
    },
    imgToBase64: (file) => {
        return fs.readFileSync(file, 'base64');
    },
    createBase64File: (base64, fileName) => {
        var data = base64.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFile(process.cwd() + `/forest/assets/avatars/${fileName}.png`, data, {encoding: 'base64'}, (err) => {
            if(err) return console.log(err)
        })
    }
}
const mysql = require('mysql');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

module.exports.pool = pool

module.exports = {
    createQuery: (sql, data, callBack) => {
        pool.query(sql, data, (err, res, fields) => {
            if(err) return callBack(err)
            return callBack(null, res)
        })
    }
}
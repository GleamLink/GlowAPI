const { Router } = require("express")
const { verifyAccessToken } = require("../src/util")
const mysql = require('../src/mysql_pool')

module.exports.Router = class Routes extends Router {
    constructor() {
        super()

        this.get("/", (req, res) => {
            return res.send({ message: "404: Not found" })
        })

        this.post("/add/:id", verifyAccessToken, (req, res) => {
            const { user_id } = req.user
            const receiver_id = req.params.id
            
            // Check if user exists
            mysql.createQuery('SELECT * FROM users WHERE user_id = ?', [receiver_id], (error, results) => {
                if (error) {
                  console.error(error)
                  return res.status(500).send('Internal server error')
                }
            
                if (results.length === 0) {
                  return res.status(404).send('User not found')
                }

                if(results[0].user_id === user_id) return res.status(400).send('Cannot send a request to yourself')

                // Check if request is already sent
                mysql.createQuery('SELECT * FROM friend_requests WHERE sender = ? AND receiver = ?', [user_id, receiver_id], (error, results) => {
                    if (error) {
                      console.error(error)
                      return res.status(500).send('Internal server error')
                    }
              
                    if (results.length > 0) {
                      return res.status(400).send('Friend request already sent')
                    }
              
                    // Add the friend request
                    mysql.createQuery('INSERT INTO friend_requests (sender, receiver) VALUES (?, ?)', [user_id, receiver_id], (error, results) => {
                      if (error) {
                        console.error(error)
                        return res.status(500).send('Internal server error')
                      }
              
                      return res.send('Friend request sent')
                    })
                })
            })
        })

        // POST friends/accept/:id | friends/reject/:id - Accept/reject friends requests
        this.post("/:action/:id", verifyAccessToken, (req, res) => {
            const { user_id } = req.user
            const receiver_id = req.params.id
            const action = req.params.action

            // Check if the user exists
            mysql.createQuery('SELECT * FROM users WHERE user_id = ?', [user_id], (error, results) => {
                if (error) {
                    console.error(error)
                    return res.status(500).send('Internal server error')
                }
                if (results.length === 0) {
                    return res.status(404).send('User not found')
                }

                // Check if the friend request exists
                mysql.createQuery('SELECT * FROM friend_requests WHERE sender = ? AND receiver = ?', [receiver_id, user_id], (error, results) => {
                    if (error) {
                    console.error(error)
                        return res.status(500).send('Internal server error')
                    }
            
                    if (results.length === 0) {
                        return res.status(400).send('No friend request found')
                    }

                    mysql.getConnection((error, connection) => {
                        if (error) {
                          console.error(error)
                          return res.status(500).send('Internal server error' )
                        }
                
                        connection.beginTransaction(error => {
                            if (error) {
                                console.error(error)
                                return res.status(500).send('Internal server error')
                            }
                
                            if (action === 'accept') {
                                // Add the users to each other's friends lists
                                connection.query('INSERT INTO friends (user1, user2) VALUES (?, ?)', [user_id, receiver_id], (error, results) => {
                                    if (error) {
                                        console.error(error)
                                        connection.rollback()
                                        return res.status(500).send('Internal server error')
                                    }

                                    connection.query('INSERT INTO friends (user1, user2) VALUES (?, ?)', [receiver_id, user_id], (error, results) => {
                                        if (error) {
                                            console.error(error)
                                            connection.rollback()
                                            return res.status(500).send('Internal server error')
                                        }

                                        // Delete the friend request
                                        connection.query('DELETE FROM friend_requests WHERE sender = ? AND receiver = ?', [receiver_id, user_id], (error, results) => {
                                            if (error) {
                                                console.error(error)
                                                connection.rollback()
                                                return res.status(500).send('Internal server error')
                                            }

                                            connection.commit(error => {
                                                if (error) {
                                                    console.error(error)
                                                    connection.rollback()
                                                    return res.status(500).send('Internal server error')
                                                }
                                
                                                return res.send('Friend request accepted')
                                            })
                                        })
                                    })
                                })
                            } else if(action === "reject") {
                                // Delete the friend request
                                connection.query('DELETE FROM friend_requests WHERE sender = ? AND receiver = ?', [receiver_id, user_id], (error, results) => {
                                    if (error) {
                                        console.error(error)
                                        connection.rollback()
                                        return res.status(500).send('Internal server error')
                                    }
                        
                                    connection.commit(error => {
                                    if (error) {
                                        console.error(error)
                                        connection.rollback()
                                        return res.status(500).send('Internal server error')
                                    }
                        
                                    return res.send('Friend request rejected')
                                    })
                                })
                            } else {
                                connection.rollback()
                                return res.status(400).send('Invalid action')
                            }
                        })
                    })
                })
            })

        })

        // TODO : DELETE friends/:id - Delete a friend
    }
}

module.exports.page = "/api/friends"
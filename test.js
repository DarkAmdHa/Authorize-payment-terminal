import express from 'express'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
app.use(express.json())
const key = process.env.GHOST_ADMIN_API_KEY

// Split the key into ID and SECRET
const [id, secret] = key.split(':')

const token = jwt.sign({}, Buffer.from(secret, 'hex'), {
  keyid: id,
  algorithm: 'HS256',
  expiresIn: '5m',
  audience: `/admin/`,
})

app.get('/sign-up', async (req, res) => {
  console.log('got')

  const url = `${process.env.GHOST_URL}/ghost/api/admin/members/`
  const headers = { Authorization: `Ghost ${token}` }
  const payload = {
    members: [
      {
        name: 'Hamid' + ' ' + 'Tahir',
        email: 'asdssswsadwssass@ema-sofia.eu',
        subscribed: true,
        labels: [{ name: 'AddedFromTerminal', slug: 'addedfromterminal' }],
      },
    ],
  }

  function requestRetry(retryTimes, retryDelay, callback) {
    var cntr = 0
    console.log(url)
    function run() {
      // try the async operation
      ++cntr
      axios
        .post(url, payload, { headers })
        .then((response) => {
          // success, send the data out
          callback(null, response)
        })
        .catch((error) => {
          console.log(error.body)
          console.log(error.message)
          if (cntr >= retryTimes) {
            // if it fails too many times, just send the error out
            callback(error)
          } else {
            // try again after a delay
            setTimeout(run, retryDelay)
          }
        })
    }
    // start our first request
    run()
  }

  requestRetry(2, 1000, function (error, data) {
    if (error) {
      // still failed after 100 retries
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        res
          .status(error.response.status)
          .json({ error: true, message: error.response.data.message })
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        res.status(401).json({
          error: true,
          message: 'There was an issue with your connection',
        })
      } else {
        // Something happened in setting up the request that triggered an Error
        res.status(404).json({
          error: true,
          message: 'Something happened in setting up the request',
        })
      }
    } else {
      // got successful result here
      res.status(200).json({
        success: true,
        message:
          'Account with email' +
          payload.members[0].email +
          ' succesfully created at Craft Farmer Accademy',
      })
    }
  })
})

app.listen(
  PORT,
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
)

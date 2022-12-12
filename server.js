import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import signUpRoute from './routes/signUpRoute.js'
import { errorHandler } from './middleware/errorMiddleware.js'

dotenv.config()
const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3000

app.use(express.static('frontend'))
app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/frontend/index.html'))
})

app.post('/sign-up', signUpRoute)

app.use(errorHandler)

app.listen(
  PORT,
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
)

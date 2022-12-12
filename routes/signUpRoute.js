import express from 'express'
import { signUpUser } from '../controllers/signUpControllers'
const router = express.Router()

router.post('/', signUpUser)

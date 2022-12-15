import express from 'express'
import { signUpUser } from '../controllers/signUpControllers.js'
const router = express.Router()

router.post('/', signUpUser)

export default router

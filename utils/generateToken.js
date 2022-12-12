import jwt from 'jsonwebtoken'

export default generateToken = () => {
  const key = process.env.GHOST_ADMIN_API_KEY

  // Split the key into ID and SECRET
  const [id, secret] = key.split(':')

  // Create the token (including decoding secret)
  const token = jwt.sign({}, Buffer.from(secret, 'hex'), {
    keyid: id,
    algorithm: 'HS256',
    expiresIn: '5m',
    audience: `/admin/`,
  })

  return token
}

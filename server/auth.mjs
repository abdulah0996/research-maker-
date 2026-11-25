import { createHash, randomBytes, scrypt as derive, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { Admin, Session } from './models.mjs'

const scrypt = promisify(derive)
const digest = value => createHash('sha256').update(value).digest('hex')
const duration = 8 * 60 * 60 * 1000
const options = secure => ({ httpOnly: true, sameSite: 'strict', secure, path: '/api/admin' })
export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return salt + ':' + (await scrypt(password, salt, 64)).toString('hex')
}
export async function setAdmin(email, password, reset = false) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 14 || password.length > 256) {
    throw new Error('Use a valid email and a password of 14–256 characters.')
  }
  const hashed = await hashPassword(password)
  const user = await Admin.findOneAndUpdate({ email }, reset ? { $set: { password: hashed } } : { $setOnInsert: { password: hashed } }, { upsert: true, new: true })
  if (reset) await Session.deleteMany({ admin: user._id })
}
export async function login(req, res, secure) {
  const { email, password } = req.body ?? {}
  if (typeof email !== 'string' || email.length > 254 || typeof password !== 'string' || password.length > 256) {
    return res.status(400).json({ error: 'Enter your email and password.' })
  }
  const admin = await Admin.findOne({ email: email.trim().toLowerCase() })
  const stored = admin?.password ?? '00000000000000000000000000000000:' + '0'.repeat(128)
  const candidate = await hashPassword(password, stored.split(':')[0])
  if (!timingSafeEqual(Buffer.from(candidate), Buffer.from(stored)) || !admin) {
    return res.status(401).json({ error: 'Email or password is incorrect.' })
  }
  const token = randomBytes(32).toString('hex')
  await Session.create({ _id: digest(token), admin: admin._id, expires: new Date(Date.now() + duration) })
  res.cookie('rm_session', token, { ...options(secure), maxAge: duration }).json({ email: admin.email })
}
export async function requireAdmin(req, res, next) {
  const token = req.cookies.rm_session
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return res.status(401).json({ error: 'Sign in to continue.' })
  const session = await Session.findOne({ _id: digest(token), expires: { $gt: new Date() } })
  if (!session) return res.status(401).json({ error: 'Your session has expired. Sign in again.' })
  req.session = session
  next()
}
export async function logout(req, res, secure) {
  await Session.deleteOne({ _id: req.session._id })
  res.clearCookie('rm_session', options(secure)).status(204).end()
}

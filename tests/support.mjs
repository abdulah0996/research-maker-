import { spawn } from 'node:child_process'
import { once } from 'node:events'
export const testNumber = '447700900123'
export async function startServer(options = {}, args = []) {
  const env = { ...process.env, MONGODB_URI: '', NODE_ENV: '', PORT: '0', WHATSAPP_NUMBER: testNumber, ...options }
  const child = spawn(process.execPath, ['server/index.mjs', ...args], { env, stdio: ['ignore','pipe','pipe'] })
  const url = await new Promise((resolve, reject) => {
    let output = ''
    const timer = setTimeout(() => { child.kill(); reject(new Error('Server did not start: ' + output)) }, 25000)
    child.stderr.on('data', chunk => { output += chunk })
    child.stdout.on('data', chunk => {
      const match = /Local (http:\/\/localhost:\d+)/.exec(String(chunk))
      if (match) { clearTimeout(timer); resolve(match[1].replace('localhost', '127.0.0.1')) }
    })
    child.once('exit', code => { clearTimeout(timer); reject(new Error('Server exited ' + code + ': ' + output)) })
  })
  return { url, stop: async () => { const exited = once(child, 'exit'); child.kill(); await exited } }
}


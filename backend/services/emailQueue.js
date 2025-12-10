const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

// Simple in-memory queue with batching and limited concurrency
const queue = []
let running = false

async function processQueue() {
  if (running) return
  running = true
  while (queue.length > 0) {
    const batch = queue.splice(0, 20) // send 20 emails at a time
    const promises = batch.map(mail => transporter.sendMail(mail))
    // Use settle so one failure doesn't stop the batch
    await Promise.allSettled(promises)
    // small delay to avoid SMTP throttle
    await new Promise(r => setTimeout(r, 1000))
  }
  running = false
}

function enqueueEmails(mails) {
  if (!Array.isArray(mails)) return
  queue.push(...mails)
  processQueue().catch(err => console.error('Email queue process error', err))
}

module.exports = { enqueueEmails }

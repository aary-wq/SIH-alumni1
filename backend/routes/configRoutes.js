const express = require('express')
const router = express.Router()

// Return runtime config values that are safe to expose to clients
router.get('/payment', async (req, res) => {
  try {
    const paymentAddress = process.env.PAYMENT_ADDRESS || process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || null
    const inrPerEth = Number(process.env.INR_PER_ETH || process.env.NEXT_PUBLIC_INR_PER_ETH || 0) || null
    res.json({ paymentAddress, inrPerEth })
  } catch (err) {
    console.error('Config route error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router

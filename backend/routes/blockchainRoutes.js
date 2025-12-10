const express = require('express')
const router = express.Router()
const { ethers } = require('ethers')

// Verify transaction by hash using provider URL from env
router.get('/verify/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params
    const providerUrl = process.env.ETH_PROVIDER_URL
    if (!providerUrl) return res.status(500).json({ message: 'ETH_PROVIDER_URL not configured' })
    const provider = new ethers.providers.JsonRpcProvider(providerUrl)
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt) return res.status(404).json({ message: 'Transaction not found yet' })
    res.json({ receipt })
  } catch (err) {
    console.error('Verify tx error', err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router

const express = require('express')
const router = express.Router()
const multer = require('multer')
const Campaign = require('../models/Campaign')
const User = require('../models/User')
const cloudinary = require('../config/cloudinary')
const { ethers } = require('ethers')

const storage = multer.memoryStorage()
const upload = multer({ storage })

function isValidObjectId(id) {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)
}

// Create campaign (admin only)
router.post('/create', upload.single('poster'), async (req, res) => {
  try {
    const { title, description, goal, createdBy, universityName, isCollegeDevelopment } = req.body
    // validate createdBy
    if (!createdBy || !isValidObjectId(String(createdBy))) {
      console.error('Invalid createdBy received for campaign create:', createdBy)
      return res.status(400).json({ message: 'Invalid createdBy (admin id) provided' })
    }
    const creator = await User.findById(createdBy)
    if (!creator || creator.role !== 'admin') return res.status(403).json({ message: 'Only admin can create campaigns' })

    let posterUrl = null
    if (req.file && req.file.buffer) {
      posterUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'campaigns' }, (err, result) => {
          if (err) reject(err); else resolve(result.secure_url)
        })
        stream.end(req.file.buffer)
      })
    }

    const finalUniversity = universityName || creator.universityName || null

    const campaign = new Campaign({
      title,
      description,
      universityName: finalUniversity,
      isCollegeDevelopment: isCollegeDevelopment === 'true' || isCollegeDevelopment === true,
      goal: Number(goal || 0),
      createdBy,
      posterUrl
    })
    await campaign.save()

    // Notify alumni for college development campaigns
    if (campaign.isCollegeDevelopment && campaign.universityName) {
      try {
        const alumni = await User.find({ role: 'alumni', universityName: campaign.universityName }).select('email firstName lastName')
        if (alumni && alumni.length > 0) {
          const { enqueueEmails } = require('../services/emailQueue')
          const mails = alumni.map(a => ({
            from: process.env.EMAIL_USER,
            to: a.email,
            subject: `New College Development Campaign: ${campaign.title}`,
            text: `Hi ${a.firstName || ''},\n\nA new college development campaign has been launched for ${campaign.universityName}: \n\n${campaign.title}\n\n${campaign.description || ''}\n\nVisit the alumni portal to donate and support your college.`
          }))
          enqueueEmails(mails)
        }
      } catch (mailErr) {
        console.error('Campaign notification email error', mailErr)
      }
    }

    res.status(201).json({ message: 'Campaign created', campaign })
  } catch (err) {
    console.error('Campaign create error', err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// List campaigns
router.get('/all', async (req, res) => {
  try {
    const campaigns = await Campaign.find({}).populate('createdBy', 'firstName lastName')
    res.json({ campaigns })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Get donations made by a specific alumni (for alumni dashboard)
router.get('/my-donations/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    if (!userId) return res.status(400).json({ message: 'Missing userId' })
    const campaigns = await Campaign.find({ 'donations.donor': userId }).select('title donations')
    const results = campaigns.map(c => ({
      campaignId: c._id,
      title: c.title,
      donations: c.donations.filter(d => String(d.donor) === String(userId))
    }))
    res.json({ donations: results })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Get donors for a campaign (admin only)
router.get('/:id/donors', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid campaign id' })
    const campaign = await Campaign.findById(id).populate('donations.donor', 'firstName lastName email')
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    res.json({ donors: campaign.donations })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Record donation (after blockchain tx completes on client)
router.post('/donate/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid campaign id' })
    const { userId, amount, txHash } = req.body
    if (!userId || !amount || !txHash) return res.status(400).json({ message: 'Missing donation data' })
    const campaign = await Campaign.findById(id)
    const user = await User.findById(userId)
    if (!campaign || !user) return res.status(404).json({ message: 'Campaign or user not found' })

    // Optional server-side verification of txHash
    if (txHash && process.env.ETH_PROVIDER_URL) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_PROVIDER_URL)
        const tx = await provider.getTransaction(txHash)
        if (!tx) return res.status(400).json({ message: 'Transaction not found on provider' })
        const receipt = await provider.getTransactionReceipt(txHash)
        if (!receipt || receipt.status !== 1) return res.status(400).json({ message: 'Transaction not mined or failed' })

        const paymentAddr = process.env.PAYMENT_ADDRESS || process.env.NEXT_PUBLIC_PAYMENT_ADDRESS
        if (paymentAddr) {
          const toAddr = tx.to ? String(tx.to).toLowerCase() : null
          if (!toAddr || toAddr !== String(paymentAddr).toLowerCase()) {
            return res.status(400).json({ message: 'Transaction recipient does not match configured payment address' })
          }
        }
      } catch (verErr) {
        console.error('Donation transaction verification error', verErr)
        return res.status(500).json({ message: 'Error verifying transaction', error: verErr.message })
      }
    }

    campaign.donations.push({ donor: userId, amount: Number(amount), txHash })
    campaign.collected = (campaign.collected || 0) + Number(amount)
    await campaign.save()

    res.json({ message: 'Donation recorded', campaign })
  } catch (err) {
    console.error('Donation error', err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Get single campaign
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid campaign id' })
    const campaign = await Campaign.findById(id).populate('createdBy', 'firstName lastName').populate('donations.donor', 'firstName lastName email')
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    res.json({ campaign })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('createdBy', 'firstName lastName').populate('donations.donor', 'firstName lastName email')
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    res.json({ campaign })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Record donation (after blockchain tx completes on client)
router.post('/donate/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { userId, amount, txHash } = req.body
    if (!userId || !amount || !txHash) return res.status(400).json({ message: 'Missing donation data' })
    const campaign = await Campaign.findById(id)
    const user = await User.findById(userId)
    if (!campaign || !user) return res.status(404).json({ message: 'Campaign or user not found' })

    // Optional server-side verification of txHash
    if (txHash && process.env.ETH_PROVIDER_URL) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_PROVIDER_URL)
        const tx = await provider.getTransaction(txHash)
        if (!tx) return res.status(400).json({ message: 'Transaction not found on provider' })
        const receipt = await provider.getTransactionReceipt(txHash)
        if (!receipt || receipt.status !== 1) return res.status(400).json({ message: 'Transaction not mined or failed' })

        const paymentAddr = process.env.PAYMENT_ADDRESS || process.env.NEXT_PUBLIC_PAYMENT_ADDRESS
        if (paymentAddr) {
          const toAddr = tx.to ? String(tx.to).toLowerCase() : null
          if (!toAddr || toAddr !== String(paymentAddr).toLowerCase()) {
            return res.status(400).json({ message: 'Transaction recipient does not match configured payment address' })
          }
        }
      } catch (verErr) {
        console.error('Donation transaction verification error', verErr)
        return res.status(500).json({ message: 'Error verifying transaction', error: verErr.message })
      }
    }

    campaign.donations.push({ donor: userId, amount: Number(amount), txHash })
    campaign.collected = (campaign.collected || 0) + Number(amount)
    await campaign.save()

    res.json({ message: 'Donation recorded', campaign })
  } catch (err) {
    console.error('Donation error', err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Get donors for a campaign (admin only)
router.get('/:id/donors', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('donations.donor', 'firstName lastName email')
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
    res.json({ donors: campaign.donations })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Get donations made by a specific alumni (for alumni dashboard)
router.get('/my-donations/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const campaigns = await Campaign.find({ 'donations.donor': userId }).select('title donations')
    const results = campaigns.map(c => ({
      campaignId: c._id,
      title: c.title,
      donations: c.donations.filter(d => String(d.donor) === String(userId))
    }))
    res.json({ donations: results })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router

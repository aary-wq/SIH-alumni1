const express = require("express");
const router = express.Router();
const multer = require("multer");
const Event = require("../models/Event");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary"); 
const { ethers } = require('ethers')
const contractService = require('../services/contractService')

// Multer in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create Event
router.post("/create", upload.single("poster"), async (req, res) => {
  try {
    const { title, date, mode, venue, createdBy, registeredUsers, donationAccepted, description, fee } = req.body;

    if (!title || !date || !mode || !createdBy || !description) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (mode === "offline" && !venue) {
      return res.status(400).json({ message: "Venue is required for offline events" });
    }

    if (req.file) {
      if (!req.file.buffer) {
        return res.status(400).json({ message: "Poster file buffer missing" });
      }
    }

    let posterUrl = null;
    if (req.file && req.file.buffer) {
      posterUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "events" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });
    }

    const event = new Event({
      title,
      date: new Date(date),
      mode,
      venue: mode === "offline" ? venue : null,
      fee: fee ? Number(fee) : 0,
      posterUrl,
      createdBy,
      registeredUsers: registeredUsers ? JSON.parse(registeredUsers) : [],
      donationAccepted: donationAccepted === "true", // ✅ convert string to boolean
      description,
    });

    await event.save();
    res.status(201).json({ message: "Event created successfully", event });
  } catch (err) {
    console.error("Event creation error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

  router.get("/all", async (req, res) => {
    try {
      const events = await Event.find({}).sort({ date: 1 }) 
      res.json({ events })
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: "Failed to fetch events", error: err.message })
    }
  })

  // Get single event by id
  router.get('/:id', async (req, res) => {
    try {
      const event = await Event.findById(req.params.id)
        .populate('createdBy', 'firstName lastName profileUrl')
        .populate('registeredUsers.user', 'firstName lastName email profileUrl');
      if (!event) return res.status(404).json({ message: 'Event not found' });
      res.json({ event });
    } catch (err) {
      console.error('Fetch event error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  })

// Register/RSVP to Event
router.post("/register/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body; 
    const { paid, txHash, amount } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If a transaction hash was provided and provider is configured, do a light verification
    if (txHash && process.env.ETH_PROVIDER_URL) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_PROVIDER_URL)
        const tx = await provider.getTransaction(txHash)
        if (!tx) return res.status(400).json({ message: 'Transaction not found on provider' })
        const receipt = await provider.getTransactionReceipt(txHash)
        if (!receipt || receipt.status !== 1) return res.status(400).json({ message: 'Transaction not mined or failed' })

        // If server-side PAYMENT_ADDRESS is configured, ensure recipient matches
        const paymentAddr = process.env.PAYMENT_ADDRESS || process.env.NEXT_PUBLIC_PAYMENT_ADDRESS
        if (paymentAddr) {
          const toAddr = tx.to ? String(tx.to).toLowerCase() : null
          if (!toAddr || toAddr !== String(paymentAddr).toLowerCase()) {
            return res.status(400).json({ message: 'Transaction recipient does not match configured payment address' })
          }
        }
      } catch (verErr) {
        console.error('Transaction verification error', verErr)
        return res.status(500).json({ message: 'Error verifying transaction', error: verErr.message })
      }
    }

    //Check if already registered (by user id inside object)
    const already = event.registeredUsers.some((r) => String(r.user) === String(userId));
    if (already || user.registeredEvents.includes(eventId)) {
      return res.status(400).json({ message: "Already registered" });
    }

    //Add registration record
    const regRecord = {
      user: userId,
      paid: paid === true || paid === 'true',
      txHash: txHash || null,
      amount: amount ? Number(amount) : (paid ? event.fee || 0 : 0),
      registeredAt: new Date()
    }
    event.registeredUsers.push(regRecord);
    await event.save();

    //Add eventId to user's registeredEvents
    user.registeredEvents.push(eventId);
    await user.save();

    // If paid, try to mint an SBT (badge) to the user's wallet address (best-effort)
    let mintResult = null
    if (regRecord.paid) {
      try {
        const walletAddress = user.walletAddress
        if (walletAddress && contractService && contractService.mintSBT) {
          // tokenUri left blank for now; docHash can be a registration hash or event id
          const docHash = ethers.utils.id(`${eventId}:${userId}:${Date.now()}`)
          mintResult = await contractService.mintSBT(walletAddress, '', docHash)
        } else {
          console.warn('Skipping SBT mint: walletAddress or contractService missing')
        }
      } catch (mintErr) {
        console.error('SBT mint error:', mintErr)
        // Don't fail registration if minting fails
      }
    }

    res.json({
      message: "Successfully registered for event",
      event,
      user,
      registration: regRecord,
      mintResult
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;


module.exports = router;

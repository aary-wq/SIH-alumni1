Alumni Verification Backend

Overview
- Solidity SBT contract located at backend/contracts/AlumniSBT.sol
- Contract ABI placeholder at backend/contracts/AlumniSBT.abi.json
- Contract deployment script: backend/scripts/deploy.js
- Contract service for node interactions: backend/services/contractService.js

Quick start
1. Copy `.env.example` to `.env` and fill values (MongoDB, DEPLOYER_PRIVATE_KEY, SEPOLIA_RPC_URL)
2. Compile the contract (use Hardhat/Foundry) and place ABI at `backend/contracts/AlumniSBT.abi.json` and bytecode at `backend/contracts/AlumniSBT.bin`
3. Run `node backend/scripts/deploy.js` to deploy and note the address.
4. Set `SBT_CONTRACT_ADDRESS` in your .env and restart server.

API
- POST /api/users/admin/upload-dataset (admin only): multipart form with `documents` files. Stores hashes on-chain.
- POST /api/users/verify-document: multipart form with `documentFile` and body { walletAddress }. If match found, mints SBT to provided wallet.

Notes
- This implementation uses a simple owner-only model: the DEPLOYER_PRIVATE_KEY must be the contract owner.
- Token metadata (tokenUri) is left empty; you can integrate IPFS for metadata.

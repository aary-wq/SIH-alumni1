const { ethers } = require('ethers');
let ThirdwebSDK;
try {
  // require dynamically so module load doesn't crash if SDK missing
  ThirdwebSDK = require('@thirdweb-dev/sdk').ThirdwebSDK;
} catch (e) {
  ThirdwebSDK = null;
}
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Load ABI if present
let contractAbi = null;
try {
  contractAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../contracts/AlumniSBT.abi.json')));
} catch (e) {
  console.warn('ABI not found. Deploy the contract or place ABI at backend/contracts/AlumniSBT.abi.json');
}

// Provider/signer only used for on-chain mode
let provider = null;
let signer = null;
let sdk = null;
if (process.env.SEPOLIA_RPC_URL) {
  try {
    provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  } catch (e) {
    provider = null;
  }
}
if (process.env.DEPLOYER_PRIVATE_KEY && provider) {
  try {
    signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  } catch (e) {
    signer = null;
  }
}
if (signer && ThirdwebSDK) {
  try {
    sdk = new ThirdwebSDK(signer);
  } catch (e) {
    sdk = null;
  }
}

// Local fallback store (safe mode) — keeps hashes in a local JSON file when on-chain is unavailable
const dataDir = path.join(__dirname, '../data');
const localStorePath = path.join(dataDir, 'local_hash_store.json');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(localStorePath)) {
  fs.writeFileSync(localStorePath, JSON.stringify({ hashes: [], minted: [], lastTokenId: 0 }, null, 2));
}

function readLocalStore() {
  try {
    return JSON.parse(fs.readFileSync(localStorePath));
  } catch (e) {
    return { hashes: [], minted: [], lastTokenId: 0 };
  }
}

function writeLocalStore(obj) {
  fs.writeFileSync(localStorePath, JSON.stringify(obj, null, 2));
}

const useOnChain = !!(sdk && process.env.SBT_CONTRACT_ADDRESS && contractAbi);
if (!useOnChain) {
  console.warn('Contract service running in LOCAL FALLBACK mode (no on-chain interactions). To enable on-chain, set DEPLOYER_PRIVATE_KEY, SEPOLIA_RPC_URL, SBT_CONTRACT_ADDRESS and provide ABI.');
}

async function getContract() {
  if (!useOnChain) throw new Error('On-chain contract not available');
  // thirdweb getContract with a custom ABI will expose call/read methods
  const contract = await sdk.getContract(process.env.SBT_CONTRACT_ADDRESS, contractAbi);
  return contract;
}

async function storeDocumentHash(hashHex) {
  if (useOnChain) {
    const contract = await getContract();
    const tx = await contract.call('storeDocumentHash', [hashHex]);
    return tx;
  }

  // Local fallback: persist to file
  const store = readLocalStore();
  if (!store.hashes.includes(hashHex)) {
    store.hashes.push(hashHex);
    writeLocalStore(store);
    return { local: true, stored: true, hash: hashHex };
  }
  return { local: true, stored: false, message: 'hash already exists', hash: hashHex };
}

async function isDocumentHashStored(hashHex) {
  if (useOnChain) {
    const contract = await getContract();
    const result = await contract.call('isDocumentHashStored', [hashHex]);
    return Array.isArray(result) ? result[0] : result;
  }
  const store = readLocalStore();
  return store.hashes.includes(hashHex);
}

async function mintSBT(toAddress, tokenUri, docHash) {
  if (useOnChain) {
    const contract = await getContract();
    const tx = await contract.call('mintSBT', [toAddress, tokenUri, docHash]);
    return tx;
  }

  const store = readLocalStore();
  store.lastTokenId = (store.lastTokenId || 0) + 1;
  const tokenId = store.lastTokenId;
  store.minted.push({ to: toAddress, tokenUri, docHash, tokenId, timestamp: new Date().toISOString() });
  writeLocalStore(store);
  return { local: true, tokenId, to: toAddress, docHash };
}

module.exports = {
  storeDocumentHash,
  isDocumentHashStored,
  mintSBT,
  _internal: {
    useOnChain,
    localStorePath,
  },
};

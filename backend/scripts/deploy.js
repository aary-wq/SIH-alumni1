require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

  // Read compiled contract (assumes you compiled and placed abi + bytecode)
  const abiPath = path.join(__dirname, '../contracts/AlumniSBT.abi.json');
  const binPath = path.join(__dirname, '../contracts/AlumniSBT.bin');

  if (!fs.existsSync(abiPath) || !fs.existsSync(binPath)) {
    console.error('ABI or BIN not found. Compile the contract and place ABI + BIN in backend/contracts');
    process.exit(1);
  }

  const abi = JSON.parse(fs.readFileSync(abiPath));
  const bytecode = fs.readFileSync(binPath).toString().trim();

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log('Deploying contract...');
  const contract = await factory.deploy('AlumniSBT', 'ALUM');
  await contract.deployed();
  console.log('Contract deployed at:', contract.address);
  console.log('Save this address in .env as SBT_CONTRACT_ADDRESS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

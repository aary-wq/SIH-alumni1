const fs = require('fs');
const path = require('path');
const { run } = require('hardhat');

async function main() {
  await run('compile');
  // artifacts produced by Hardhat in this hardhat project
  const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts');
  const targetDir = path.join(__dirname, '..', '..', 'contracts');

  // Ensure target dir exists
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const contractPath = path.join(artifactsDir, 'AlumniSBT.sol', 'AlumniSBT.json');
  if (!fs.existsSync(contractPath)) {
    console.error('Compiled artifact not found:', contractPath);
    process.exit(1);
  }

  const json = JSON.parse(fs.readFileSync(contractPath));
  const abi = json.abi;
  const bytecode = json.bytecode;

  fs.writeFileSync(path.join(targetDir, 'AlumniSBT.abi.json'), JSON.stringify(abi, null, 2));
  fs.writeFileSync(path.join(targetDir, 'AlumniSBT.bin'), bytecode);
  console.log('ABI and BIN copied to backend/contracts');
}

main().catch((e) => { console.error(e); process.exit(1); });

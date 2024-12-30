const { ethers } = require('ethers');
const colors = require('colors');
const xlsx = require('xlsx');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cấu hình mạng Open Campus
const NETWORK_CONFIG = {
  name: "Lisk",
  rpcUrl: "https://lisk.drpc.org",
  chainId: 1135,
  symbol: "ETH",
  explorer: "https://blockscout.lisk.com/",
};

const main = async () => {
  console.log(colors.green(`🔗 Starting the transaction process on ${NETWORK_CONFIG.name} network...\n`));

  // Load Excel file
  const workbook = xlsx.readFile('data.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  // Read the number of cycles from B2
  const cycles = parseInt(data[1][1] || 1); // Ô B2

  // Read private keys, contract addresses, and hex data
  const wallets = data.slice(1).map((row) => row[0]).filter(Boolean); // Cột A (privateKey)
  const contractHexPairs = data.slice(1).map((row) => [row[1], row[2]]).filter(([contract, hex]) => contract && hex); // Cột B và C

  if (wallets.length === 0 || contractHexPairs.length === 0) {
    console.log(colors.red('❌ No valid data found in the Excel file.'));
    process.exit(1);
  }

  const provider = new ethers.providers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);

  // Split wallets into batches of 5
  const batchSize = 5;
  const batches = [];
  for (let i = 0; i < wallets.length; i += batchSize) {
    batches.push(wallets.slice(i, i + batchSize));
  }

  // Process each cycle
  for (let cycle = 0; cycle < cycles; cycle++) {
    console.log(colors.magenta(`🔄 Cycle ${cycle + 1} / ${cycles}`));

    for (const batch of batches) {
      console.log(colors.cyan(`💼 Processing batch with ${batch.length} wallets`));

      await Promise.all(
        batch.map(async (privateKey) => {
          const wallet = new ethers.Wallet(privateKey, provider);
          const senderAddress = wallet.address;

          console.log(colors.cyan(`🔄 Processing wallet: ${senderAddress}`));

          let senderBalance;
          try {
            senderBalance = await provider.getBalance(senderAddress);
            console.log(
              colors.blue(`💰 Balance: ${ethers.utils.formatUnits(senderBalance, 'ether')} ${NETWORK_CONFIG.symbol}`)
            );
          } catch (error) {
            console.log(colors.red(`❌ Failed to fetch balance for ${senderAddress}. Skipping.`));
            return;
          }

          if (senderBalance.lt(ethers.utils.parseUnits('0.0001', 'ether'))) {
            console.log(colors.red('❌ Insufficient balance. Skipping this wallet.'));
            return;
          }

          // Select a random contract-hex pair for the transaction
          const [contract, hexData] = contractHexPairs[Math.floor(Math.random() * contractHexPairs.length)];

          const transaction = {
            to: contract,
            value: ethers.utils.parseUnits('0', 'ether'),
            data: hexData,
            gasLimit: 700000,
            gasPrice: await provider.getGasPrice(),
            nonce: await provider.getTransactionCount(senderAddress, 'pending'),
            chainId: NETWORK_CONFIG.chainId,
          };

          try {
            const tx = await wallet.sendTransaction(transaction);
            console.log(colors.green(`✅ Transaction Sent. Hash: ${tx.hash}`));

            const receipt = await provider.waitForTransaction(tx.hash);
            if (receipt && receipt.status === 1) {
              console.log(colors.green(`✅ Transaction Success! Block Number: ${receipt.blockNumber}`));
            } else {
              console.log(colors.red('❌ Transaction FAILED.'));
            }
          } catch (error) {
            console.log(colors.red(`❌ Failed to send transaction for ${senderAddress}: ${error.message}`));
          }
        })
      );

      await sleep(1000); // Optional delay between batches
    }
  }

  console.log(colors.green('✅ All transactions completed.'));
  process.exit(0);
};

main().catch((error) => {
  console.error(colors.red('🚨 An unexpected error occurred:'), error);
  process.exit(1);
});

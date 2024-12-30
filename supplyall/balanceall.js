const { ethers } = require("ethers");
const xlsx = require("xlsx");

// Địa chỉ hợp đồng ERC20
const USDT_CONTRACT_ADDRESS = "0x0D72f18BC4b4A2F0370Af6D799045595d806636F";
const LISK_CONTRACT_ADDRESS = "0x5d4FE9b1Dc67d20ac79E5e8386D46517aA6b657c";

// ABI tối thiểu để kiểm tra số dư ERC20
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];

async function checkBalancesAndSave() {
  // Kết nối tới provider
  const provider = new ethers.providers.JsonRpcProvider("https://lisk.drpc.org");

  // Tạo đối tượng hợp đồng ERC20
  const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, ERC20_ABI, provider);
  const liskContract = new ethers.Contract(LISK_CONTRACT_ADDRESS, ERC20_ABI, provider);

  // Đọc tệp Excel
  const workbook = xlsx.readFile('data.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  // Mảng để lưu kết quả
  const results = [["Private Key", "Address", "USDT Balance", "Lisk Balance", "B"]];

  // Lặp qua các dòng trong tệp Excel (bỏ dòng tiêu đề)
  for (let i = 1; i < data.length; i++) {
    const privkey = data[i][0]; // Cột A: private key

    // Kiểm tra nếu private key hợp lệ
    if (!privkey || privkey === 'undefined' || privkey === '') {
      console.log(`Skipping row ${i + 1} due to missing or invalid private key.`);
      continue; // Bỏ qua dòng nếu private key không hợp lệ
    }

    let wallet;
    try {
      // Tạo wallet từ private key
      wallet = new ethers.Wallet(privkey, provider);
    } catch (error) {
      console.log(`Skipping wallet creation for invalid private key at row ${i + 1}.`);
      continue; // Bỏ qua ví này nếu tạo không thành công
    }

    try {
      // Kiểm tra số dư USDT
      const usdtBalance = await retry(() => usdtContract.balanceOf(wallet.address));
      const usdtBalanceFormatted = parseFloat(ethers.utils.formatUnits(usdtBalance, 6)); // Số dư USDT (6 chữ số thập phân)

      // Kiểm tra số dư Lisk
      const liskBalance = await retry(() => liskContract.balanceOf(wallet.address));
      const liskBalanceFormatted = parseFloat(ethers.utils.formatUnits(liskBalance, 18)); // Số dư Lisk (6 chữ số thập phân)

      // Tính toán giá trị B
      const B = ((usdtBalanceFormatted + liskBalanceFormatted) / 5).toFixed(3);

      // Lưu kết quả vào mảng
      results.push([privkey, wallet.address, usdtBalanceFormatted, liskBalanceFormatted, B]);

      console.log(`Row ${i + 1}: Address: ${wallet.address}, USDT: ${usdtBalanceFormatted}, Lisk: ${liskBalanceFormatted}, B: ${B}`);
    } catch (error) {
      console.log(`Skipping wallet ${wallet.address} due to error: ${error.message}`);
    }
  }

  // Ghi kết quả ra file Excel
  const resultSheet = xlsx.utils.aoa_to_sheet(results);
  const resultWorkbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(resultWorkbook, resultSheet, "Results");
  xlsx.writeFile(resultWorkbook, "ketqua.xlsx");

  console.log("Results saved to ketqua.xlsx");
}

// Hàm kiểm tra số dư với khả năng retry
async function retry(fn, maxRetries = 5, delay = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`⚠️ Error occurred. Retrying... (${i + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

checkBalancesAndSave();

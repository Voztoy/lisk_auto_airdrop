const { ethers } = require("ethers");
const xlsx = require("xlsx");

// Địa chỉ hợp đồng kiểm tra số dư ERC20
const BALANCE_CONTRACT_ADDRESS = "0xF242275d3a6527d877f2c927a82D9b057609cc71";

// Địa chỉ hợp đồng thực hiện giao dịch
const MINT_CONTRACT_ADDRESS = "0x7682C12F6D1af845479649c77A9E7729F0180D78";

// ABI tối thiểu để kiểm tra số dư ERC20
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];

async function sendTransaction() {
    // Kết nối tới provider
    const provider = new ethers.providers.JsonRpcProvider("https://lisk.drpc.org");

    // Tạo đối tượng hợp đồng kiểm tra số dư
    const balanceContract = new ethers.Contract(BALANCE_CONTRACT_ADDRESS, ERC20_ABI, provider);

    // Đọc tệp Excel
    const workbook = xlsx.readFile('data.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

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
            // Kiểm tra số dư token từ hợp đồng kiểm tra số dư
            const balance = await retry(() => balanceContract.balanceOf(wallet.address)); // Kiểm tra số dư
            const balanceInTokens = ethers.utils.formatUnits(balance, 6);
            const B = (parseFloat(balanceInTokens) / 1) * 0.99;
            const roundedB = B.toFixed(6);

            const C = ethers.utils.parseUnits(roundedB.toString(), 6);
            const CHex = ethers.utils.hexlify(C); // Hexlify C

            // Tính D = 0x0e752702 + 00000... + C sao cho tổng chiều dài là 74
            const prefix = '0x0e752702';
            const numZeros = 64 - CHex.length + 2; // 64 là chiều dài cần có để tổng là 74, 2 cho `0x`
            const padding = '0'.repeat(numZeros); // Chuỗi '00000...'
            let D = prefix + padding + CHex.substring(2); // Loại bỏ "0x" của C để nối vào

            // Kiểm tra D để đảm bảo là một chuỗi hex hợp lệ
            if (!/^0x[a-fA-F0-9]+$/.test(D)) {
                throw new Error("Invalid hex format for D.");
            }

            console.log("Calculated D:", D);  // Hiển thị D

            // Dữ liệu giao dịch
            const tx = {
                to: MINT_CONTRACT_ADDRESS, // Địa chỉ smart contract để mint
                value: 0, // Không gửi ETH, chỉ gửi token
                data: D, // Hex data từ D
                gasLimit: 900000, // Giới hạn gas, có thể điều chỉnh nếu cần
                maxPriorityFeePerGas: ethers.utils.parseUnits("0.0001", "gwei"), // Phí ưu tiên
                maxFeePerGas: ethers.utils.parseUnits("0.0005", "gwei"), // Phí tối đa
            };

            // Gửi giao dịch
            const txResponse = await wallet.sendTransaction(tx);
            console.log(`Transaction Hash for wallet ${wallet.address}:`, txResponse.hash);
            const receipt = await txResponse.wait();
            console.log("Transaction Receipt:", receipt);

        } catch (error) {
            console.log(`Skipping transaction for wallet ${wallet.address} due to error: ${error.message}`);
        }
    }
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

sendTransaction();

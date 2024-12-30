# Lisk Auto Airdrop

Cài Node js

- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (Node Package Manager)

# Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/voztoy/edu_auto_transfer.git
   cd edu_auto_transfer
   ```

2. Install the necessary packages:

   ```bash
   npm install
   npm install ethers@5
   npm install xlsx
   ```
3. Các bước thực hiện ionic

* Lưu ý:
+ Luôn dán privatekey vào file data.xlsx, privatekey luôn có 0x phía trước
+ Mỗi node (trong folder) luôn đi kèm cấu hình file data.xlsx riêng
+ Luôn kiểm tra phí trước khi chạy một node, phí có thể cao bất thường, sửa phí ở phần:
            gasLimit: 2000000, // Giới hạn gas, có thể điều chỉnh nếu cần
            maxPriorityFeePerGas: ethers.utils.parseUnits("0.0001", "gwei"), // Phí ưu tiên
            maxFeePerGas: ethers.utils.parseUnits("0.000905872", "gwei"), // Phí tối đa
+ Cần ước lượng số USDT, LISK cần supply và số USDC cần repay trong tuần để approve hạn mức chi tiêu (nếu không thì giao dịch lỗi)

3.1 Approve hạn mức chi tiêu:
Copy các file trong approve ra file chính. File data.xlsx chỉ chưa privatekey ở cột A (1 lần)
Hạn mức chi tiêu 50 USDT LISK USDC đặt sẵn ở sheet2. Muốn approve cái gì thì copy vào sheet1, copy 1 loại, 1 lần vào ô B2 và C2 tương ứng
Chạy node

   ```bash
   approve.js
   ```

3.2 Supply all để có tiền đi vay:
Copy các file trong supllyall ra file chính. File data.xlsx chỉ chưa privatekey ở cột A (1 lần)
Thực hiện 2 lệnh sau để supply hết USDT và LISK
  
   ```bash
   node supplyalllisk.js
   node supplyallusdt.js
   ```

3.3 Thực hiện kiểm tra tổng số dư USDT và LISK bằng lệnh sau:

   ```bash
   node balanceall.js
   ```

3.4 Borrow:
Copy các file trong borrow ra file chính. Căn cứ vào số dư để căn lệnh borow usdc, số usdc tối thiểu là 0.132 USDC, tối đa là bằng 1/2 số dư ổng số dư USDT và LISK. 
Node đã cài sẵn random vay từ 0,13450-0,13850, nhân lên sẽ căn được bao nhiêu tx. 
Ví dụ có 10 ví, ví có số dư tổng số dư USDT và LISK thấp nhất là 3, suy ra thực hiện vay tối đa là 1,5 USDC, chia cho số tối thiểu là 0,13850 tầm 11tx borrow
Sau khi xác định số tx borow cần chạy thì copy nhân số dòng 10 ví lặp lại ở cột A là xong.
Chạy node

   ```bash
   node borrow.js
   ```

3.5 Repay USDC:
Copy các file trong repay ra file chính. File data.xlsx chỉ chưa privatekey ở cột A (1 lần)
Chạy node này để repay hết USDC

   ```bash
   replay.js
   ```
3.6 Supply spam 70 tx/day:

Copy các file trong supply70tx ra file chính. 
Trong file data.xlsx, copy paste key ở cột A 70 lần (mỗi dòng là 1 tx), 10 ví 700 dòng, 20 ví 1400 dòng....
Chạy node

   ```bash
   supply70tx.js
   ```
3.7 Withdraw all USDT và LISK:
Copy các file trong withdraw ra file chính.File data.xlsx chỉ chưa privatekey ở cột A (1 lần)
Cần rút hết USDT và Lisk để làm lại từ đầu

   ```bash
   node withdrawlisk.js
   node withdrawusdt.js
   ```


# Donations

0xADE4FBED97eF37F3BfbaF36B575a1B114DA92155

# License

This project is licensed under the MIT License. See the `LICENSE` file for details.

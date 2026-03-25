const { spawn } = require('child_process');
const fs = require('fs');

// --- 變數宣告 ---
// 版本V2.1 已發pr
var NAS_PATH = "//192.168.71.200/PN/XCIF.js";
var XCIF_RETRY = 5; 
var XCIF_SAVE_LOCK = 0; 
// ----------------------

function StartServer() {
    // Console開啟
    console.log("\x1b[36m%s\x1b[0m", "==================================================");
    console.log("\x1b[33m%s\x1b[0m", " [XCIF 核心] 正在調取 NAS組件: " + NAS_PATH);
    
    // NAS檔案看還再不再
    if (!fs.existsSync(NAS_PATH)) {
        console.log("\x1b[31m%s\x1b[0m", " [ERROR] 找不到 NAS（035）上的 XCIF.js，請檢查網路掛載狀態！");
        return;
    }

    console.log("\x1b[32m%s\x1b[0m", " [系統狀態] 節點連接成功，載入服務中...");
    console.log("\x1b[36m%s\x1b[0m", "=============================================");

    // 啟動指令：用 node 去執行 NAS 裡面的 js
    const bds = spawn('node', [NAS_PATH], {
        stdio: ['pipe', 'inherit', 'inherit'],
        shell: true
    });

    // 監聽鍵盤 Ctrl+C (關機前存檔邏輯)
    process.on('SIGINT', () => {
        if (XCIF_SAVE_LOCK == 0) {
            console.log("\n\x1b[31m%s\x1b[0m", " [警告] 偵測到關機信號執行 ＜XCIF＞自動儲存程序...");
            
            // 傳送存檔指令
            bds.stdin.write("save hold\n");
            bds.stdin.write("save query\n");
            bds.stdin.write("stop\n");
            XCIF_SAVE_LOCK = 1; 

            setTimeout(() => {
                console.log("\x1b[32m%s\x1b[0m", " [Success] 檔案已安全同步儲存！");
                process.exit();
            }, 5000);
        }
    });

    bds.on('close', (code) => {
        console.log("\x1b[31m%s\x1b[0m", "\n [系統安全] 程序已斷開, 代碼: " + code);
        
        if (XCIF_RETRY > 0) {
            XCIF_RETRY--; 
            console.log(` [系統] 5秒後重新連接節點... (剩餘重試: ${XCIF_RETRY})`);
            setTimeout(() => StartServer(), 5000);
        }
    });
}

// 啟動
StartServer();

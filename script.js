// 核心邏輯: script.js (修訂版)

let audioContext = null;
let isPlaying = false;
let leftOscillator = null;
let rightOscillator = null;
let mergerNode = null;

const startButton = document.getElementById('startButton');
const leftFreqInput = document.getElementById('leftFrequency');
const rightFreqInput = document.getElementById('rightFrequency');
const statusElement = document.getElementById('status');

/**
 * 初始化 AudioContext。由於瀏覽器限制，必須在用戶手動互動後才能啟動。
 */
function initAudioContext() {
    if (audioContext === null) {
        // 嘗試建立 AudioContext
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // 建立 ChannelMergerNode，設定為兩個輸入（左和右）
        mergerNode = audioContext.createChannelMerger(2);
        
        // 將合併節點連接到最終輸出
        mergerNode.connect(audioContext.destination);
    }
}

function startTone() {
    // 確保 AudioContext 已啟動
    initAudioContext();
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    // 取得頻率值
    const leftFreq = parseFloat(leftFreqInput.value);
    const rightFreq = parseFloat(rightFreqInput.value);

    // 1. 停止舊的聲音（如果有的話）
    if (leftOscillator) stopTone(); 
    
    // 2. 創建並配置左耳振盪器
    leftOscillator = audioContext.createOscillator();
    leftOscillator.type = 'sine'; // 正弦波
    leftOscillator.frequency.setValueAtTime(leftFreq, audioContext.currentTime);

    // 連接到 ChannelMergerNode 的第一個輸入 (0 號輸入 = 左聲道)
    leftOscillator.connect(mergerNode, 0, 0); 
    leftOscillator.start();

    // 3. 創建並配置右耳振盪器
    rightOscillator = audioContext.createOscillator();
    rightOscillator.type = 'sine';
    rightOscillator.frequency.setValueAtTime(rightFreq, audioContext.currentTime);

    // 連接到 ChannelMergerNode 的第二個輸入 (1 號輸入 = 右聲道)
    rightOscillator.connect(mergerNode, 0, 1);
    rightOscillator.start();

    // 更新狀態
    isPlaying = true;
    startButton.textContent = '停止播放';
    statusElement.textContent = `狀態: 正在播放 (左耳: ${leftFreq}Hz, 右耳: ${rightFreq}Hz)`;
}

function stopTone() {
    if (leftOscillator) {
        // 使用一個小的時間漸變來避免「咔嗒」聲 (click)，並斷開連線
        leftOscillator.stop(audioContext.currentTime + 0.05); 
        leftOscillator.disconnect();
        leftOscillator = null;
    }
    if (rightOscillator) {
        rightOscillator.stop(audioContext.currentTime + 0.05);
        rightOscillator.disconnect();
        rightOscillator = null;
    }

    // 更新狀態
    isPlaying = false;
    startButton.textContent = '開始播放';
    statusElement.textContent = '狀態: 已停止';
}

startButton.addEventListener('click', () => {
    // 在點擊時，先嘗試恢復或啟動 AudioContext (處理瀏覽器限制)
    initAudioContext();
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            if (isPlaying) {
                stopTone();
            } else {
                startTone();
            }
        });
    } else {
        if (isPlaying) {
            stopTone();
        } else {
            startTone();
        }
    }
});

// 允許在播放時更改頻率
leftFreqInput.addEventListener('input', () => {
    // 必須先確保 AudioContext 和 Oscilattor 存在
    if (isPlaying && leftOscillator && audioContext) {
        const newFreq = parseFloat(leftFreqInput.value);
        // 使用 AudioParam 函數平滑地改變頻率，避免雜音
        leftOscillator.frequency.exponentialRampToValueAtTime(newFreq, audioContext.currentTime + 0.1); 
        
        // 更新狀態顯示 (使用當前右耳頻率)
        const rightFreq = rightOscillator ? rightOscillator.frequency.value : 0;
        statusElement.textContent = `狀態: 正在播放 (左耳: ${newFreq.toFixed(1)}Hz, 右耳: ${rightFreq.toFixed(1)}Hz)`;
    }
});

rightFreqInput.addEventListener('input', () => {
    if (isPlaying && rightOscillator && audioContext) {
        const newFreq = parseFloat(rightFreqInput.value);
        rightOscillator.frequency.exponentialRampToValueAtTime(newFreq, audioContext.currentTime + 0.1);
        
        // 更新狀態顯示 (使用當前左耳頻率)
        const leftFreq = leftOscillator ? leftOscillator.frequency.value : 0;
        statusElement.textContent = `狀態: 正在播放 (左耳: ${leftFreq.toFixed(1)}Hz, 右耳: ${newFreq.toFixed(1)}Hz)`;
    }
});

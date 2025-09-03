// 蓝牙心率监测器
console.log('Renderer script loaded successfully');

// 全局变量存储蓝牙连接对象
let bluetoothDevice = null;
let bluetoothServer = null;
let heartRateMeasurement = null;
let heartRateChangeHandler = null; // 心率变化事件处理器

// 清除body中的所有DOM元素
function clearBodyAllDom() {
    const body = document.querySelector('body');
    while (body.firstChild) {
        body.removeChild(body.firstChild);
    }
}

// 显示连接过程UI
function showConnectingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'connecting-overlay';
    overlay.innerHTML = `
        <div class="connecting-content">
            <div class="connecting-spinner"></div>
            <div class="connecting-text">正在连接设备...</div>
            <div class="connecting-subtext">请稍候，这可能需要几秒钟</div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// 隐藏连接过程UI
function hideConnectingOverlay() {
    const overlay = document.querySelector('.connecting-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// 显示透明心率视图
function showTransparentHeartView(heartRate) {
    const heartView = document.createElement('div');
    heartView.className = 'transparent-heart-view';
    heartView.innerHTML = `
        <div class="heart-label">当前心率</div>
        <div class="heart">${heartRate}</div>
        <div class="close-button" onclick="window.closeTransparentView()">×</div>
    `;
    document.body.appendChild(heartView);
}

// 关闭透明视图
window.closeTransparentView = function() {
    const heartView = document.querySelector('.transparent-heart-view');
    if (heartView) {
        heartView.remove();
    }
}

// 断开蓝牙连接
function disconnectBluetooth() {
    console.log('断开蓝牙连接');
    
    if (heartRateMeasurement) {
        try {
            heartRateMeasurement.stopNotifications();
            console.log('停止心率通知监听');
            // 移除事件监听器
            if (heartRateChangeHandler) {
                heartRateMeasurement.removeEventListener('characteristicvaluechanged', heartRateChangeHandler);
                heartRateChangeHandler = null;
            }
        } catch (error) {
            console.error('停止通知错误:', error);
        }
        heartRateMeasurement = null;
    }
    
    if (bluetoothServer && bluetoothServer.connected) {
        try {
            bluetoothServer.disconnect();
            console.log('断开GATT服务器连接');
        } catch (error) {
            console.error('断开连接错误:', error);
        }
        bluetoothServer = null;
    }
    
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {
        try {
            bluetoothDevice.gatt.disconnect();
            console.log('断开设备连接');
        } catch (error) {
            console.error('断开设备错误:', error);
        }
        bluetoothDevice = null;
    }
}

// 处理心率变化
function handleHeartRateChange(heartRate) {
    const heartElement = document.querySelector('.transparent-heart-view .heart');
    if (heartElement) {
        heartElement.textContent = heartRate;
    }
}

// 蓝牙连接回调函数
async function cb(device) {
    console.log('蓝牙设备连接成功:', device);
    
    // 存储设备对象
    bluetoothDevice = device;
    
    // 显示连接过程UI
    showConnectingOverlay();
    
    try {
        // 连接蓝牙设备
        bluetoothServer = await device.gatt.connect();
        console.log('连接到GATT服务器');
        
        // 获取心率服务
        const heartRateService = await bluetoothServer.getPrimaryService('heart_rate');
        console.log('获取心率服务');
        
        // 获取心率测量特征
        heartRateMeasurement = await heartRateService.getCharacteristic('heart_rate_measurement');
        console.log('获取心率测量特征');
        
        // 开始监听心率数据
        await heartRateMeasurement.startNotifications();
        console.log('开始监听心率通知');
        
        // 发送消息创建心率显示窗口
        if (window.electron && window.electron.sendMessage) {
            window.electron.sendMessage('create-heart-rate-window');
        }
        
        // 监听心率数据变化
        // 先移除可能存在的旧监听器
        if (heartRateChangeHandler) {
            heartRateMeasurement.removeEventListener('characteristicvaluechanged', heartRateChangeHandler);
            heartRateChangeHandler = null;
        }
        
        heartRateChangeHandler = (event) => {
            // 检查蓝牙连接状态，如果已断开则不再处理数据
            if (!bluetoothDevice || !bluetoothDevice.gatt.connected) {
                console.log('蓝牙已断开，停止处理心率数据');
                return;
            }
            
            const value = event.target.value;
            // 解析心率数据
            const heartRate = parseHeartRate(value);
            console.log('实时心率:', heartRate);
            
            // 更新心率显示
            handleHeartRateChange(heartRate);
            
            // 发送心率数据到心率窗口
            if (window.electron && window.electron.sendMessage) {
                console.log('发送心率数据到主进程:', heartRate);
                window.electron.sendMessage('update-heart-rate', heartRate);
            }
        };
        
        heartRateMeasurement.addEventListener('characteristicvaluechanged', heartRateChangeHandler);
        
        // 隐藏连接过程UI
        hideConnectingOverlay();
        
    } catch (error) {
        console.error('蓝牙连接错误:', error);
        
        // 隐藏连接过程UI
        hideConnectingOverlay();
        
        // 显示错误信息
        alert('连接设备失败: ' + error.message);
    }
}

// 解析心率数据函数
function parseHeartRate(data) {
    // 心率数据格式解析
    const flags = data.getUint8(0);
    let heartRate;
    
    if (flags & 0x1) {
        // 16位心率值
        heartRate = data.getUint16(1, true);
    } else {
        // 8位心率值
        heartRate = data.getUint8(1);
    }
    
    return heartRate;
}

// 设置设备选择回调函数
if (window.electron && window.electron.setDeviceSelectedCallback) {
    window.electron.setDeviceSelectedCallback(async (deviceInfo) => {
        console.log('用户选择了设备:', deviceInfo);
        
        // 通过Web Bluetooth API重新连接选中的设备
        if (navigator.bluetooth) {
            try {
                const device = await navigator.bluetooth.requestDevice({
                    filters: [{ name: deviceInfo.deviceName }],
                    optionalServices: ['heart_rate']
                });
                console.log('重新连接设备:', device);
                cb(device); // 触发真正的连接流程
            } catch (error) {
                console.error('重新连接设备失败:', error);
                alert('重新连接设备失败: ' + error.message);
            }
        }
    });
}

// 监听蓝牙请求触发事件
if (window.electron && window.electron.onTriggerBluetoothRequest) {
    window.electron.onTriggerBluetoothRequest(() => {
        console.log('触发蓝牙设备搜索');
        // 在页面中调用Web Bluetooth API搜索设备
        if (navigator.bluetooth) {
            navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['heart_rate']
            }).then(device => {
                console.log('找到设备:', device);
            }).catch(error => {
                console.log('蓝牙设备搜索错误:', error);
            });
        } else {
            console.log('浏览器不支持Web Bluetooth API');
        }
    });
}

// 监听断开蓝牙连接消息（保留但不主动使用，由主进程管理）
if (window.electron && window.electron.onDisconnectBluetooth) {
    window.electron.onDisconnectBluetooth(() => {
        console.log('收到断开蓝牙连接消息');
        disconnectBluetooth();
    });
}

// 监听重置主窗口消息
if (window.electron && window.electron.onResetMainWindow) {
    window.electron.onResetMainWindow(() => {
        console.log('收到重置主窗口消息，重新加载页面');
        window.location.reload();
    });
}

// 主函数
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    const button = document.querySelector('.start-button');
    if (button) {
        button.addEventListener('click', function() {
            console.log('开始搜索蓝牙设备');
            
            // 发送消息给主进程开始蓝牙搜索
            if (window.electron && window.electron.sendMessage) {
                window.electron.sendMessage('start-bluetooth-search');
            }
        });
    }
});
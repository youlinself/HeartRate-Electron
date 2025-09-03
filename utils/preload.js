/**
 * The preload script runs before `index.html` is loaded
 * in the renderer. It has access to web APIs as well as
 * Electron's renderer process modules and some polyfilled
 * Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
const { contextBridge, ipcRenderer } = require('electron')

// 监听渲染进程未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  console.error('渲染进程未处理的 Promise 拒绝:', event.reason)
});

let app = null;

ipcRenderer.on('bluetooth-device-list', (event, deviceList) => {
  // 获取设备类型对应的图标
  const getDeviceIcon = (deviceName) => {
    const name = deviceName.toLowerCase();
    
    // 心率监测设备
    if (name.includes('heart') || name.includes('心率') || name.includes('pulse')) {
      return '❤️';
    }
    
    // 智能手表
    if (name.includes('watch') || name.includes('手表') || name.includes('band')) {
      return '⌚';
    }
    
    // 耳机
    if (name.includes('headphone') || name.includes('耳机') || name.includes('earbud')) {
      return '🎧';
    }
    
    // 音箱
    if (name.includes('speaker') || name.includes('音箱') || name.includes('sound')) {
      return '🔊';
    }
    
    // 手机
    if (name.includes('phone') || name.includes('手机') || name.includes('mobile')) {
      return '📱';
    }
    
    // 电脑
    if (name.includes('computer') || name.includes('电脑') || name.includes('pc') || name.includes('mac')) {
      return '💻';
    }
    
    // 默认图标
    return '📱';
  }

  // 添加div
  const addDivHandle = (dadEl, data) => {
    if(data && data.deviceName && data.deviceName.indexOf('未知或') > -1){
      return;
    }
    const deviceIcon = getDeviceIcon(data.deviceName);
    const div = document.createElement('div');
    div.className = 'device-item';
    div.id = data.deviceId;
    div.innerHTML = `
        <div class="device-icon">${deviceIcon}</div>
        <div class="device-info">
            <div class="device-name">${data.deviceName}</div>
            <div class="device-id">${data.deviceId}</div>
        </div>
    `;
    dadEl.appendChild(div);
    // 添加点击事件 - 传递数据给主进程和渲染进程
    div.addEventListener('click', () => {
      ipcRenderer.send('select-bluetooth-device', data.deviceId);
      // 直接调用渲染进程的回调函数，而不是发送消息
      if (window.electronAPI && window.electronAPI.onDeviceSelectedCallback) {
        window.electronAPI.onDeviceSelectedCallback(data);
      }
    });
  }

  if(app){
    const blueToothListId = 'blueToothList';
    const blueEl = app.querySelector(`#${blueToothListId}`);
    if (blueEl) {
      // 获取所有的子元素
      const children = blueEl.children;
      // 遍历deviceList并判断该数据是否存在，不存在则添加进入列表
      for (let i = 0; i < deviceList.length; i++) {
        const device = deviceList[i];
        let isExist = false;
        for (let y = 0; y < children.length; y++) {
          const child = children[y];
          const deviceId = child.id;
          if (deviceId === device.deviceId) {
            isExist = true;
            break;
          }
        }
        if (!isExist) {
          addDivHandle(blueEl, device);
        }
      }
    } else {
      const blueEl = document.createElement('div');
      blueEl.id = blueToothListId;
      blueEl.className = 'device-list';
      deviceList && deviceList.forEach(item => {
        addDivHandle(blueEl, item);
      });
      app.appendChild(blueEl);
    }
  }
})

window.addEventListener('DOMContentLoaded', () => {
  app = document.getElementById('app');
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})

// 暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electron', {
  sendMessage: (message, data) => ipcRenderer.send('send-message', message, data),  // 发送消息到主进程
  onReceiveMessage: (callback) => ipcRenderer.on('reply-message', callback),  // 接收主进程的消息
  onDeviceSelected: (callback) => ipcRenderer.on('device-selected', callback),  // 接收设备选择事件
  onTriggerBluetoothRequest: (callback) => ipcRenderer.on('trigger-bluetooth-request', callback),  // 接收蓝牙请求触发事件
  setDeviceSelectedCallback: (callback) => {
    window.electronAPI = window.electronAPI || {};
    window.electronAPI.onDeviceSelectedCallback = callback;
  },
  onDisconnectBluetooth: (callback) => {
    ipcRenderer.removeAllListeners('disconnect-bluetooth');
    ipcRenderer.on('disconnect-bluetooth', callback);
  },  // 监听断开蓝牙连接事件
  onResetMainWindow: (callback) => {
    ipcRenderer.removeAllListeners('reset-main-window');
    ipcRenderer.on('reset-main-window', callback);
  }  // 监听重置主窗口事件
});
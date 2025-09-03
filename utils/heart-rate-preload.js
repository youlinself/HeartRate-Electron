const { contextBridge, ipcRenderer } = require('electron')

// 暴露 API 给心率窗口
contextBridge.exposeInMainWorld('electronHeartRate', {
  // 监听心率数据更新
  onUpdateHeartRate: (callback) => {
    ipcRenderer.on('update-heart-rate', (event, heartRate) => {
      callback(heartRate);
    });
  },
  
  // 发送窗口移动消息
  sendMoveWindow: (position) => {
    ipcRenderer.send('move-window', position);
  },
  
  // 发送关闭窗口消息
  sendCloseWindow: () => {
    ipcRenderer.send('close-heart-rate-window');
  },
  
  // 获取皮肤配置
  getSkinConfig: () => {
    return ipcRenderer.invoke('get-skin-config');
  },
  
  // 切换皮肤
  changeSkin: (skinId) => {
    return ipcRenderer.invoke('change-skin', skinId);
  },
  
  // 监听皮肤变化
  onSkinChanged: (callback) => {
    ipcRenderer.on('skin-changed', (event, skinConfig) => {
      callback(skinConfig);
    });
  }
});
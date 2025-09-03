const { contextBridge, ipcRenderer } = require('electron')

console.log('皮肤选择窗口预加载脚本已加载');

// 暴露 API 给皮肤选择窗口
contextBridge.exposeInMainWorld('electronSkinSelection', {
  // 获取所有皮肤配置
  getSkinConfigs: () => {
    return ipcRenderer.invoke('get-skin-config');
  },
  
  // 选择皮肤
  selectSkin: (skinId) => {
    ipcRenderer.send('select-skin', skinId);
  }
});
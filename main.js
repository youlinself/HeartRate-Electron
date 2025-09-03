const { log } = require('console')
const { app, BrowserWindow, ipcMain, ipcRenderer, Menu } = require('electron')
const path = require('path')

// 监听全局未处理的 Promise 拒绝
process.on('unhandledRejection', (error, promise) => {
  console.error('未处理的 Promise 拒绝:', error)
  // 可选：记录错误或弹窗提示
})

app.commandLine.appendSwitch('enable-features', 'ElectronSerialChooser')

let bluetoothPinCallback
let selectBluetoothCallback
let heartRateWindow = null
let isBluetoothConnected = false // 蓝牙连接状态标志

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 600,
    transparent: true, // 启用透明窗口
    maximizable: false, // 禁用最大化按钮
    alwaysOnTop: true, // 永远置顶窗口
    webPreferences: {
      preload: path.join(__dirname, 'utils/preload.js')
    }
  })

  // 创建自定义菜单
  const template = [
    {
      label: '菜单',
      submenu: [
        {
          label: '皮肤',
          click: () => {
            console.log('皮肤菜单被点击');
            // 这里可以添加皮肤切换逻辑
          }
        },
        {
          label: '关于',
          click: () => {
            console.log('关于菜单被点击');
            // 创建关于窗口
            createAboutWindow();
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // mainWindow.webContents.openDevTools();

  let userSelect = null;
  mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault()
    selectBluetoothCallback = callback;

    const result = deviceList.find((device) => {
      // console.log("======>" + device.deviceName)
      console.log('======>' + userSelect + '======>');
      return device.deviceId === userSelect;
    })
    
    if (result) {
      callback(result.deviceId)
    } else {
      // The device wasn't found so we need to either wait longer (eg until the
      // device is turned on) or until the user cancels the request
      // 通知渲染deviceList
      mainWindow.webContents.send('bluetooth-device-list', deviceList)
    }
  })

  ipcMain.on('cancel-bluetooth-request', (event) => {
    selectBluetoothCallback('')
  })

  // Listen for a message from the renderer to get the response for the Bluetooth pairing.
  ipcMain.on('bluetooth-pairing-response', (event, response) => {
    console.log("bluetooth-pairing-response")
    bluetoothPinCallback(response)
  })

  // 监听渲染进程的消息
  ipcMain.on('select-bluetooth-device', (event, message) => {
    userSelect = message;
  });

  // 监听渲染进程的消息
  ipcMain.on('send-message', (event, message, data) => {
    console.log(
      "message from renderer: ",
      message
    );
    if(message == 'reload'){
      userSelect = null;
    }
    if(message =='ok'){
      mainWindow.setMenuBarVisibility(false); // 隐藏菜单栏
      mainWindow.setSize(200, 150);
      mainWindow.setBackgroundColor('rgba(0, 0, 0, 0)');
      mainWindow.resizable = false;
      mainWindow.webContents.closeDevTools();
    }
    if(message == 'start-bluetooth-search'){
      // 触发蓝牙设备搜索
      userSelect = null;
      console.log('开始搜索蓝牙设备');
      // 在Electron中，蓝牙设备搜索是通过Web Bluetooth API触发的
      // 需要在渲染进程中调用navigator.bluetooth.requestDevice
      // 这里我们发送消息到渲染进程，让它在页面中触发蓝牙请求
      mainWindow.webContents.send('trigger-bluetooth-request');
    }
    if(message == 'create-heart-rate-window'){
      // 创建心率显示窗口
      createHeartRateWindow();
      // 最小化主窗口到任务栏
      mainWindow.minimize();
      // 设置蓝牙连接状态
      isBluetoothConnected = true;
    }
    if(message == 'update-heart-rate'){
      // 更新心率数据到心率窗口
      console.log('收到心率数据:', data);
      if (heartRateWindow) {
        console.log('转发心率数据到心率窗口:', data);
        heartRateWindow.webContents.send('update-heart-rate', data);
      } else {
        console.log('心率窗口未创建，无法转发数据');
      }
    }
  });

  mainWindow.webContents.session.setBluetoothPairingHandler((details, callback) => {
    console.log("bluetooth-pairing-request")
    bluetoothPinCallback = callback
    // Send a message to the renderer to prompt the user to confirm the pairing.
    mainWindow.webContents.send('bluetooth-pairing-request', details)
  })

  mainWindow.loadFile('pages/index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})


function handleIPC(win) {
  win.webContents.send('do-some-render-work');
}

function handleIPC(win) {
  win.webContents.send('do-some-render-work');
}

// 创建关于窗口
function createAboutWindow() {
  const parentWindow = BrowserWindow.getFocusedWindow();
  let aboutWindow = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    maximizable: false,
    parent: parentWindow, // 设置父窗口
    modal: !!parentWindow, // 设置为模态窗口，层级比父级高（仅在存在父窗口时）
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // 隐藏菜单栏
  aboutWindow.setMenuBarVisibility(false);

  // 加载关于页面
  aboutWindow.loadFile('pages/about.html')

  // 窗口关闭时清理
  aboutWindow.on('closed', () => {
    aboutWindow = null;
  })
}

// 创建心率显示窗口
function createHeartRateWindow() {
  if (heartRateWindow) {
    heartRateWindow.focus();
    return;
  }

  heartRateWindow = new BrowserWindow({
    width: 200,
    height: 200,
    frame: false, // 无边框
    transparent: true, // 透明背景
    alwaysOnTop: true, // 永远置顶
    resizable: false, // 不可调整大小
    skipTaskbar: true, // 不在任务栏显示
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'utils/heart-rate-preload.js')
    }
  })

  // 加载心率显示页面
  heartRateWindow.loadFile('pages/heart-rate.html')

  // 监听窗口移动消息
  ipcMain.on('move-window', (event, position) => {
    if (heartRateWindow) {
      heartRateWindow.setPosition(position.x, position.y);
    }
  });

  // 监听关闭窗口消息
  ipcMain.on('close-heart-rate-window', () => {
    if (heartRateWindow) {
      heartRateWindow.close();
    }
  });

  // 窗口关闭时清理
  heartRateWindow.on('closed', () => {
    // 直接处理蓝牙断开逻辑
    if (isBluetoothConnected) {
      console.log('心率窗口关闭，断开蓝牙连接');
      isBluetoothConnected = false;
      // 这里可以添加主进程级别的蓝牙断开逻辑
    }
    heartRateWindow = null;
  })
}
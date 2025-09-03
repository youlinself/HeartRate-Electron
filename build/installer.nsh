!include "MUI2.nsh"

; 安装程序名称
Name "心率监测器"
OutFile "心率监测器安装程序.exe"
InstallDir "$PROGRAMFILES\心率监测器"

; 请求管理员权限
RequestExecutionLevel admin

; 界面设置
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; 欢迎页面
!insertmacro MUI_PAGE_WELCOME

; 许可协议页面
!insertmacro MUI_PAGE_LICENSE "$(MYTEMP)\LICENSE.txt"

; 组件选择页面
!insertmacro MUI_PAGE_COMPONENTS

; 目录选择页面
!insertmacro MUI_PAGE_DIRECTORY

; 安装页面
!insertmacro MUI_PAGE_INSTFILES

; 完成页面
!insertmacro MUI_PAGE_FINISH

; 卸载页面
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; 语言设置
!insertmacro MUI_LANGUAGE "SimpChinese"

; 安装部分
Section "主程序" SecMain
  SectionIn RO
  
  SetOutPath "$INSTDIR"
  
  ; 复制文件
  File /r "..\dist\win-unpacked\*"
  
  ; 创建开始菜单快捷方式
  CreateDirectory "$SMPROGRAMS\心率监测器"
  CreateShortCut "$SMPROGRAMS\心率监测器\心率监测器.lnk" "$INSTDIR\心率监测器.exe"
  CreateShortCut "$SMPROGRAMS\心率监测器\卸载.lnk" "$INSTDIR\Uninstall.exe"
  
  ; 创建桌面快捷方式
  CreateShortCut "$DESKTOP\心率监测器.lnk" "$INSTDIR\心率监测器.exe"
  
  ; 写入卸载信息
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\心率监测器" \
                 "DisplayName" "心率监测器"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\心率监测器" \
                 "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\心率监测器" \
                 "DisplayIcon" "$INSTDIR\心率监测器.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\心率监测器" \
                 "Publisher" "Example Company"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\心率监测器" \
                 "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\心率监测器" \
                 "NoRepair" 1
SectionEnd

; 卸载部分
Section "Uninstall"
  ; 删除文件
  RMDir /r "$INSTDIR"
  
  ; 删除开始菜单快捷方式
  RMDir /r "$SMPROGRAMS\心率监测器"
  
  ; 删除桌面快捷方式
  Delete "$DESKTOP\心率监测器.lnk"
  
  ; 删除注册表信息
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\心率监测器"
SectionEnd

; 组件描述
LangString DESC_SecMain ${LANG_SIMPCHINESE} "安装心率监测器主程序。"

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} $(DESC_SecMain)
!insertmacro MUI_FUNCTION_DESCRIPTION_END
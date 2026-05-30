// FWH Function Index — shared data for EN/ES/PT
const funcData = {
A: ["aC5Box","aGetWorkAreas","aOData","__ChangeStyleWindow","_Alert","_SetKey"],
B: ["Browse"],
C: ["cCallStack","cGetExpression","cGetFile32"],
D: ["DbgAbout","DbgAlert","DbgMemo","DbgPrint","DbgTable","DbgTrace","DrXlsxLinked"],
E: ["EditCell","ElementActions","EP_LinkedToApp","ER_CheckPath","EReport"],
F: ["FEFileEdit","fmt","FW_AT","FW_Decode","FW_dosClear","FW_MemoEdit","FW_NUMTOWORDS","FW_OnAdoError","FW_RecToJson","FW_SetMulti","FW_ShowXlsx","FW_XmlView","FWGetOleObject","FWNumFormat","FWSavePreviewToPDF","FWString","FWZEBRA_BarCode"],
G: ["GetTasks","GetWebApp"],
H: ["HB_DBG_VMSTKLCOUNT"],
I: ["IsGTF"],
L: ["lIsDir","LoadValue","LogStatics"],
M: ["MakeWind","MatrixMultiply","MDIRecEdit","MemStat","MsgCalc","MsgGet","MsgList","MsgLogo","MsgMeter","MsgToolBar"],
N: ["NOW","nRandom","nToBin"],
O: ["OpenFile","OrderTagInfo"],
P: ["PGLinked","PickColor"],
R: ["RLNew","RtfBox"],
S: ["SelectItem","SetDarkTheme","SetDefaultIconSize","SetErrorPath","SetObject","SetResDebug","Sfn2Lfn"],
U: ["uValBlank"],
W: ["WaitSeconds","WQout"],
X: ["XbrGetDate","XBrowse","xPadR"]
};

document.addEventListener("DOMContentLoaded", function() {
  let letters = document.getElementById("letters");
  let funcList = document.getElementById("funcList");
  if (!letters || !funcList) return;
  Object.keys(funcData).forEach(function(letter) {
    letters.innerHTML += '<a href="#F'+letter+'">'+letter+'</a>';
    funcList.innerHTML += '<li id="F'+letter+'" style="list-style:none;margin-top:8px"><strong style="font-size:16px">'+letter+'</strong></li>';
    funcData[letter].forEach(function(fn) {
      funcList.innerHTML += '<li><code>'+fn+'()</code></li>';
    });
  });
});

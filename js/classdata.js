// FWH Class Index — shared data for EN/ES/PT
const classData = {
A: ["TAccTable","TActiveX","TAnimate","TArrayData","TAutoGet"],
B: ["TBackup","TBar","TBarTabs","TBitmap","TBlock","TBrush","TBrushEx","TBtnBmp","TBtnClr","TBtnFlat","TButton","TButtonBmp"],
C: ["TC5Tooltip","TCalendar","TCalEx","TCalInfo","TCBrowse","TCColumn","TChatAgent","TChatgpt","TCheckBox","TChooseGradient","TClipBoard","TClipGet","TComboBox","TComboMetro","TComm","TComObject","TComponent","TControl","TCoverFlow","TCtrlSocket","TCursor"],
D: ["TDataBase","TDataBaseComp","TDataRow","TDatePick","TDayView","TDBase","TDBCombo","TDbfComp","TDbg","TDbOdbc","TDbOdbcDirect","TDde","TDdeClient","TDDEMLClient","TDDEMLServer","TDdeServer","TDeepSeek","TDialog","TDict","TDlgFind","TDosPrn"],
E: ["TEdit","TEmbeddings","TEnhMetaFile","TEReport","TExplorerBar","TExplorerList","TExStruct"],
F: ["TFGet","TField","TFile","TFileGTF","TFLine","TFolder","TFolderEx","TFont","TForm","TFTP","TFtpClient","TFTPFile","TFtpServer","TFtpSession","TFWLanguageModel","FW_EReport","FWER_BarCode","FWMariaRecord","FWMSWordDoc","FWPdf","FWStack"],
G: ["TGantt","TGemini","TGet","TGif","TGmail","GPT2Model","TGraph","Graphics","TGrok","TGroup","TGroupEx"],
H: ["THeader","THFTask","THorzScroll","THotKey","THtmlPage","HFTokenizer"],
I: ["TIcon","TIconGet","TIconGroup","TImage","TImageBase64","TImageList","TIndex","TIni","TIniER","TInternet","TIPAddress"],
K: ["TKimi","TKnob"],
L: ["TLayout","TLayoutManager","TLex","TLibFile","TLinkList","TListBox","TListView","TLocks"],
M: ["TMail","TMci","TMdiChild","TMdiClient","TMdiFrame","TMenu","TMenuItem","TMetaFile","TMeter","TMeterEx","TMetro","TMetroPanel","TMnuComp","TMonthView","TMru","TMsgBar","TMsgItem","TMultiGet","TMyBox","TMyTitle"],
N: ["TNavigator","TNeuralNetwork","TNewsInstance","TNewsServer","TNg"],
O: ["TOAuth","TObjFile","TOdbc","TOLlama","TOpenAI","TOpenCode","TOrdInfo","ORM_Connection","TOutLook","TOutLook2003","TOutLook2010","TOutlookMail"],
P: ["TPager","TPages","TPanel","TParser","TPdf","TPen","TPop3","TPreview","TPrinter","TProgress","TProgressWheel","TProxy"],
R: ["TRadio","TRadMenu","TRas","TRating","TRBGroup","TRBtn","TRColumn","TRDD","TRDDODBC","TReBar","TRecSet","TRect","TReg32","TReport","TRestore","TRFile","TRGroup","TRibbonBar","TRichEdit","TRichEdit5","TRLine","TRPanel","TRtfFile","RRW"],
S: ["TSay","TSayBarCode","TScintilla","TScrollBar","TScrollImg","TScrollMetro","TScrollMsg","TScrollPanel","TScrollPanelEx","TSelector","TSelex","TSemanticIndex","TSKIN","TSkinButton","TSlider","TSliderMetro","TSmtp","TSocket","TSplitter","TSqlError","TStatusBar","TStruct","TSwitch","TSymbol","TSymTable","TSysLink"],
T: ["TTabControl","TTable","TTabs","TTagCloud","TTime","TTimePick","TTimer","TTitle","TToast","TToolBar","Transformer","TTrackBar","TTrayIcon","TTreeItem","TTreeView","TTVItem","TTxtEdit","TTxtFile"],
U: ["TUpDown","TURLLink"],
V: ["TVbControl","TVbxArray","TVideo","TView","TVistaMenu","VRD","VRDBarcode","VRDItem"],
W: ["TWBrowse","TWebcam","TWebClient","TWebServer","TWebSocketServer","TWebView","TWebView2","TWeekView","TWhatsApp","TWhisperCpp","TWindow"],
X: ["TXBrCode","TXBrowse","TXImage","TXmlWriter"],
Y: ["TYacc"]
};

// Build letter nav + class list
document.addEventListener("DOMContentLoaded", function() {
  let letters = document.getElementById("letters");
  let clsList = document.getElementById("classList");
  if (!letters || !clsList) return;
  Object.keys(classData).forEach(function(letter) {
    letters.innerHTML += '<a href="#L'+letter+'">'+letter+'</a>';
    clsList.innerHTML += '<li id="L'+letter+'" style="list-style:none;margin-top:8px"><strong style="font-size:16px">'+letter+'</strong></li>';
    classData[letter].forEach(function(cls) {
      clsList.innerHTML += '<li><a href="#">'+cls+'</a></li>';
    });
  });
});

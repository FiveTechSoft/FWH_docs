// FWH Documentation - Shared JavaScript

// Search index: { keywords, title, url, section }
var searchIndex = [
  // Getting Started
  { k: "overview framework architecture compilers hello world", t: "Framework Overview", u: "../../en/getting-started/overview.html", s: "Getting Started" },
  { k: "install download requirements directory structure", t: "Installation", u: "../../en/getting-started/installation.html", s: "Getting Started" },
  { k: "build compile hbmk2 bcc32 msvc gcc mingw linker build_new", t: "Build System", u: "../../en/getting-started/build-system.html", s: "Getting Started" },
  // Core
  { k: "twindow window mdi mdiframe mdichild activate define menu toolbar statusbar msgbar", t: "TWindow", u: "../../en/core/twindow.html", s: "Core Classes" },
  { k: "tdialog dialog modal modeless define activate pixel truepixel centered valid init resizable", t: "TDialog", u: "../../en/core/tdialog.html", s: "Core Classes" },
  { k: "tcontrol control refresh setfocus adjclient adjtop adjbottom adjleft adjright docking anchoring", t: "TControl", u: "../../en/core/tcontrol.html", s: "Core Classes" },
  // UI Controls
  { k: "txbrowse xbrowse browse grid dbf array ado columns seek filter edit marquee multiselect freeze", t: "TXBrowse", u: "../../en/ui/txbrowse.html", s: "UI Controls" },
  { k: "tbutton tbtnbmp button bitmap buttonbar toolbar flat action click", t: "TButton / TBtnBmp", u: "../../en/ui/tbutton.html", s: "UI Controls" },
  { k: "tget tmget get input text picture mask valid when spinner password memo multiline cuebanner", t: "TGet / TMGet", u: "../../en/ui/tget.html", s: "UI Controls" },
  { k: "tmenu menu menuitem popup separator pulldown context right click 2007 2010 2013 2015", t: "TMenu", u: "../../en/ui/tmenu.html", s: "UI Controls" },
  { k: "tfolder folder tabs tabcontrol pages dialogs prompts", t: "TFolder", u: "../../en/ui/tfolder.html", s: "UI Controls" },
  { k: "tcombobox combobox dropdown combo items select", t: "TComboBox", u: "../../en/ui/tcombobox.html", s: "UI Controls" },
  { k: "tcheckbox tradio checkbox radio check group boolean", t: "TCheckBox / TRadio", u: "../../en/ui/tcheckbox.html", s: "UI Controls" },
  // Data
  { k: "tdatabase database dbf rdd open close skip seek filter goto append delete fieldget fieldput", t: "TDatabase", u: "../../en/data/tdatabase.html", s: "Data Access" },
  { k: "trecset trecordset ado recordset activex sql server access", t: "TRecordSet (ADO)", u: "../../en/data/trecset.html", s: "Data Access" },
  { k: "todbc odbc connection sql execute query fetch commit rollback", t: "TODBC", u: "../../en/data/todbc.html", s: "Data Access" },
  { k: "mariadb mysql fwmariarecord connection crud query insert update", t: "MariaDB / MySQL", u: "../../en/data/mariadb.html", s: "Data Access" },
  // Printing
  { k: "tprinter printer print page say line box bitmap pdf startpage endpage paper orientation", t: "TPrinter", u: "../../en/printing/tprinter.html", s: "Printing" },
  { k: "treport report column group header footer summary excel export", t: "TReport", u: "../../en/printing/treport.html", s: "Printing" },
  { k: "easyreport vrd visual report designer wysiwyg printarea pagebreak easyrep", t: "EasyReport", u: "../../en/printing/easyreport.html", s: "Printing" },
  // Internet
  { k: "twebview twebview2 webview chromium browser html javascript navigate eval", t: "TWebView2", u: "../../en/internet/twebview.html", s: "Internet & AI" },
  { k: "topenai tchatgpt openai chatgpt gpt ai api send prompt image stream", t: "TOpenAI / TChatGPT", u: "../../en/internet/topenai.html", s: "Internet & AI" },
  { k: "tollama ollama local ai llama mistral codellama", t: "TOLlama (Local AI)", u: "../../en/internet/topenai.html#ollama", s: "Internet & AI" },
  { k: "tdeepseek deepseek reasoning coding", t: "TDeepSeek", u: "../../en/internet/topenai.html#deepseek", s: "Internet & AI" },
  { k: "tgemini gemini google vision upload", t: "TGemini (Google)", u: "../../en/internet/topenai.html#gemini", s: "Internet & AI" },
  { k: "tgrok grok xai elon", t: "TGrok (xAI)", u: "../../en/internet/topenai.html#grok", s: "Internet & AI" },
  { k: "tkimi kimi moonshot chinese", t: "TKimi (Moonshot)", u: "../../en/internet/topenai.html#kimi", s: "Internet & AI" },
  { k: "transformer neural network embeddings local ai", t: "Transformer", u: "../../en/internet/topenai.html#transformer", s: "Internet & AI" },
  { k: "twebserver tsocket webserver http socket server tcp ip", t: "TWebServer", u: "../../en/internet/twebserver.html", s: "Internet & AI" },
  // Reference
  { k: "commands define activate redefine set @ say get button checkbox combobox all syntax", t: "Commands", u: "../../en/reference/commands.html", s: "Reference" },
  { k: "functions msginfo msgalert msgstop msgyesno fwstring getfile putfile cvaltochar version", t: "Functions", u: "../../en/reference/functions.html", s: "Reference" },
  { k: "error errorsys errorblock error.log debug dark mode copy clipboard", t: "Error System", u: "../../en/reference/errorsys.html", s: "Reference" },
  { k: "tfont tbrush tcursor ticon tbitmap timage tini treg32 font brush cursor icon bitmap image gdi resources", t: "Resources (GDI)", u: "../../en/reference/resources.html", s: "Reference" },
  { k: "tpen pen gdi line draw ps_solid ps_dash ps_dot ps_dasddot style width color", t: "TPen", u: "../../en/reference/tpen.html", s: "Reference" },
  { k: "tbrushex brush gradient pattern degrade bitmap createpatternbrush creabitmapex", t: "TBrushEx", u: "../../en/reference/tbrushex.html", s: "Reference" },
  { k: "tcursor cursor hand wait arrow cross ibeam drag stop search predefined cur ico", t: "TCursor", u: "../../en/reference/tcursor.html", s: "Reference" },
  { k: "trect tpoint rectangle point geometry moveby contains fitinside resize assquare distance center", t: "TRect / TPoint", u: "../../en/reference/trect.html", s: "Reference" },
  { k: "gdip gdiplus graphics pen brush gdibmp path region antialias alphablend gradient", t: "GDI+ Classes", u: "../../en/reference/tgdip.html", s: "Reference" },
  { k: "tenhmetafile enhmeta emf metafile vector zoom shadow gdi plus enhanced", t: "TEnhMetaFile", u: "../../en/reference/tenhmeta.html", s: "Reference" },
  { k: "tmetafile metafile wmf emf vector zoom shadow gdi convert", t: "TMetaFile", u: "../../en/reference/tmetafil.html", s: "Reference" },
  { k: "tgselector tchoosegradient tink gradient selector editor color stop ink picker choosegradient", t: "TGSelector", u: "../../en/reference/tgselect.html", s: "Reference" },
  { k: "tprogress progress bar marquee step range position percent msctls_progress32", t: "TProgress", u: "../../en/reference/tprogress.html", s: "Reference" },
  { k: "ticon icon ico resource load display clickable extracticon", t: "TIcon", u: "../../en/reference/ticon.html", s: "Reference" },
  // Additional UI
  { k: "tknob knob rotary dial audio midi synth synthesizer led line ring glow ticks unipolar bipolar wheel drag silvio falconi", t: "TKnob", u: "../../en/ui/tknob.html", s: "UI Controls" },
  { k: "tsay tmeter tprogress tslider tsplitter tpanel tscrollpanel trebar tpager ttimer ttray ttoast trating turllink tanimate tactivex tdatepicker tipaddress thotkey tupdown", t: "More Controls", u: "../../en/ui/more-controls.html", s: "UI Controls" },
  { k: "tlistview listview icon details groups columns", t: "TListView", u: "../../en/ui/tlistview.html", s: "Advanced UI" },
  { k: "trichedit tscintilla richedit rich text editor syntax highlighting code", t: "TRichEdit / TScintilla", u: "../../en/ui/trichedit.html", s: "Advanced UI" },
  { k: "ttreeview treeview tree nodes items expand collapse", t: "TTreeView", u: "../../en/ui/ttreeview.html", s: "Advanced UI" },
  { k: "tribbonbar ribbon office tabs groups", t: "TRibbonBar", u: "../../en/ui/tribbon.html", s: "Advanced UI" },
  // Utilities
  { k: "tfile ttxtfile ttxtedit tclipboard tstruct tdict txmldocument file text clipboard xml", t: "File & Text", u: "../../en/utilities/files.html", s: "Utilities" },
  { k: "toleauto tcomobject tactivex tdotnet tgmail toutlookmail ole com activex dotnet word excel outlook", t: "OLE / COM / .NET", u: "../../en/utilities/ole.html", s: "Utilities" },
  { k: "ttimer ttime trect tpen tblock tparser tlex tyacc tlayout tftp tsmtp tpop3 tmail tproxy email ftp", t: "Miscellaneous", u: "../../en/utilities/misc.html", s: "Utilities" },
  // Advanced
  { k: "dll api calldll32 pragma begindump hb_func windows api", t: "DLL & API Calls", u: "../../en/advanced/dll.html", s: "Advanced" },
  { k: "unicode utf8 i18n fwstring fwsetlanguage multilanguage oem ansi", t: "Unicode & i18n", u: "../../en/advanced/unicode.html", s: "Advanced" },
  // Samples & more
  { k: "samples examples tutorials learning path beginner intermediate advanced start tutor", t: "Samples Guide", u: "../../en/getting-started/samples-guide.html", s: "Getting Started" },
  { k: "txmldocument xml texplorerbar tcoverflow tnavigator twebclient twebcam tworkbook dark mode gdiplus tbarcode blockchain", t: "More Classes", u: "../../en/reference/more-classes.html", s: "Reference" },
  // Functions (individual entries for direct search)
  { k: "msginfo message information dialog", t: "MsgInfo()", u: "../../en/reference/functions.html#msginfo", s: "Functions" },
  { k: "msgalert alert warning message", t: "MsgAlert()", u: "../../en/reference/functions.html#msgalert", s: "Functions" },
  { k: "msgstop stop error critical message", t: "MsgStop()", u: "../../en/reference/functions.html#msgstop", s: "Functions" },
  { k: "msgyesno question confirm yes no", t: "MsgYesNo()", u: "../../en/reference/functions.html#msgyesno", s: "Functions" },
  { k: "fwstring translate language i18n multilanguage", t: "FWString()", u: "../../en/reference/functions.html#fwstring", s: "Functions" },
  { k: "fwsetlanguage language select idioma", t: "FWSetLanguage()", u: "../../en/reference/functions.html#fwsetlanguage", s: "Functions" },
  { k: "getfile open file dialog select", t: "GetFile()", u: "../../en/reference/functions.html#getfile", s: "Functions" },
  { k: "putfile save file dialog", t: "PutFile()", u: "../../en/reference/functions.html#putfile", s: "Functions" },
  { k: "cvaltochar convert value string", t: "cValToChar()", u: "../../en/reference/functions.html#cvaltochar", s: "Functions" },
  { k: "shellexecute execute open url program", t: "ShellExecute()", u: "../../en/reference/functions.html#shellexecute", s: "Functions" },
  { k: "winexec execute program run", t: "WinExec()", u: "../../en/reference/functions.html#winexec", s: "Functions" },
  { k: "alert choose option buttons", t: "Alert()", u: "../../en/reference/functions.html#alert", s: "Functions" },
  { k: "xbrowser quick browse array alias", t: "XBrowser()", u: "../../en/reference/functions.html#xbrowser", s: "Functions" },
  { k: "version harbour fivewin", t: "Version()", u: "../../en/reference/functions.html#version", s: "Functions" },
  // UI Calendar
  { k: "tcalex calendar extended scheduler appointment event month week day view navigate", t: "TCalEx", u: "../../en/ui/tcalex.html", s: "UI Controls" },
  { k: "tdayview day view daily schedule time slot grid calendar event", t: "TDayView", u: "../../en/ui/tcalviews.html#tdayview", s: "UI Controls" },
  { k: "tweekview week view weekly 7 day calendar schedule event", t: "TWeekView", u: "../../en/ui/tcalviews.html#tweekview", s: "UI Controls" },
  { k: "tmonthview month view monthly calendar grid date navigation event", t: "TMonthView", u: "../../en/ui/tcalviews.html#tmonthview", s: "UI Controls" },
  // Data: MariaDB
  { k: "fwmariaconnection mariadb mysql connection query execute transaction", t: "TMariaConnection", u: "../../en/data/tmariaconnect.html", s: "Data Access" },
  { k: "frecset recordset mariadb mysql result set paging navigation browse", t: "FRecSet (MariaDB)", u: "../../en/data/tmariaconnect.html#frecset", s: "Data Access" },
  { k: "fwmariarecord mariadb mysql record crud insert update tdatarow orm", t: "TMariaRecord (FWMariaRecord)", u: "../../en/data/tmariarecord.html", s: "Data Access" },
  { k: "orm orm_connection orm_table object relational mapping multi backend ado fwh dolphin chain query aggregate relate", t: "ORM Classes", u: "../../en/data/torm.html", s: "Data Access" },
  // Utilities
  { k: "fwstack stack lifo push pop peek clear data structure", t: "FWStack", u: "../../en/utilities/tfwstack.html", s: "Utilities" },
];

// ---------------------------------------------------------------------------
// Single source of truth for the sidebar navigation (per language).
// The nav is rendered from JS on every page so it stays identical everywhere;
// to add/rename a link, edit ONLY this table. Labels: {en,es,pt} object, or a
// plain string when identical across languages (e.g. class names). Item `u` is
// the path AFTER the language folder (or a full http URL for external links).
// ---------------------------------------------------------------------------
var NAV = [
  { t: { en: "Getting Started", es: "Primeros Pasos", pt: "Primeiros Passos" }, items: [
    { u: "getting-started/overview.html",      l: { en: "Framework Overview", es: "Visión General", pt: "Visão Geral" } },
    { u: "getting-started/installation.html",  l: { en: "Installation", es: "Instalación", pt: "Instalação" } },
    { u: "getting-started/build-system.html",  l: { en: "Build System", es: "Sistema de Construcción", pt: "Sistema de Build" } },
    { u: "getting-started/samples-guide.html", l: { en: "Samples &amp; Learning Path", es: "Ejemplos y Ruta de Aprendizaje", pt: "Exemplos e Rota de Aprendizado" } },
    { u: "getting-started/tlocalization.html", l: { en: "Localization", es: "Localización", pt: "Localização" } },
    { u: "getting-started/tglossary.html",     l: { en: "Glossary", es: "Glosario", pt: "Glossário" } },
    { u: "getting-started/whatsnew.html",      l: { en: "What's New", es: "Novedades", pt: "Novidades" } },
    { u: "getting-started/examples.html",      l: { en: "Examples", es: "Ejemplos", pt: "Exemplos" } },
  ]},
  { t: { en: "Core Classes", es: "Clases Base", pt: "Classes Base" }, items: [
    { u: "core/twindow.html",  l: "TWindow" },
    { u: "core/tdialog.html",  l: "TDialog" },
    { u: "core/tcontrol.html", l: "TControl" },
    { u: "core/tmdi.html",     l: "TMDIFrame / TMDIChild" },
  ]},
  { t: { en: "UI Controls", es: "Controles UI", pt: "Controles UI" }, items: [
    { u: "ui/txbrowse.html",  l: "TXBrowse" },
    { u: "ui/tbutton.html",   l: "TButton / TBtnBmp" },
    { u: "ui/tget.html",      l: "TGet / TMGet" },
    { u: "ui/tmenu.html",     l: "TMenu" },
    { u: "ui/tfolder.html",   l: "TFolder" },
    { u: "ui/tcombobox.html", l: "TComboBox" },
    { u: "ui/tcheckbox.html", l: "TCheckBox / TRadio" },
  ]},
  { t: { en: "Data Access", es: "Acceso a Datos", pt: "Acesso a Dados" }, items: [
    { u: "data/tdatabase.html", l: "TDatabase" },
    { u: "data/trecset.html",   l: "TRecordSet (ADO)" },
    { u: "data/todbc.html",     l: "TODBC" },
    { u: "data/mariadb.html",   l: "MariaDB / MySQL" },
  ]},
  { t: { en: "Printing &amp; Reports", es: "Impresión e Informes", pt: "Impressão e Relatórios" }, items: [
    { u: "printing/tprinter.html",   l: "TPrinter" },
    { u: "printing/treport.html",    l: "TReport" },
    { u: "printing/easyreport.html", l: "EasyReport" },
    { u: "printing/tlabel.html",     l: { en: "Label Printing", es: "Impresión de Etiquetas", pt: "Impressão de Etiquetas" } },
    { u: "printing/tbarcode.html",   l: "BarCode" },
  ]},
  { t: { en: "Internet &amp; AI", es: "Internet e IA", pt: "Internet e IA" }, items: [
    { u: "internet/twebview.html",   l: "TWebView2" },
    { u: "internet/twebserver.html", l: "TWebServer" },
    { u: "internet/tsocket.html",    l: "TSocket" },
    { u: "internet/topenai.html",    l: "TOpenAI" },
    { u: "internet/tai.html",        l: { en: "AI Classes", es: "Clases de IA", pt: "Classes de IA" } },
  ]},
  { t: { en: "Reference", es: "Referencia", pt: "Referência" }, items: [
    { u: "reference/commands.html",     l: { en: "Commands", es: "Comandos", pt: "Comandos" } },
    { u: "reference/functions.html",    l: { en: "Functions", es: "Funciones", pt: "Funções" } },
    { u: "reference/errorsys.html",     l: { en: "Error System", es: "Sistema de Errores", pt: "Sistema de Erros" } },
    { u: "reference/resources.html",    l: { en: "Resources (GDI)", es: "Recursos (GDI)", pt: "Recursos (GDI)" } },
    { u: "reference/more-classes.html", l: { en: "More Classes", es: "Más Clases", pt: "Mais Classes" } },
  ]},
  { t: { en: "Advanced UI", es: "UI Avanzada", pt: "UI Avançada" }, items: [
    { u: "ui/more-controls.html", l: { en: "More Controls", es: "Más Controles", pt: "Mais Controles" } },
    { u: "ui/tlistview.html",     l: "TListView" },
    { u: "ui/trichedit.html",     l: "TRichEdit / TScintilla" },
    { u: "ui/ttreeview.html",     l: "TTreeView" },
    { u: "ui/tribbon.html",       l: "TRibbonBar" },
  ]},
  { t: { en: "Utilities", es: "Utilidades", pt: "Utilitários" }, items: [
    { u: "utilities/files.html",    l: { en: "File &amp; Text", es: "Archivos y Texto", pt: "Arquivos e Texto" } },
    { u: "utilities/ole.html",      l: "OLE / COM / .NET" },
    { u: "utilities/misc.html",     l: { en: "Miscellaneous", es: "Misceláneo", pt: "Diversos" } },
    { u: "utilities/tfwstack.html", l: "FWStack" },
  ]},
  { t: { en: "Advanced", es: "Avanzado", pt: "Avançado" }, items: [
    { u: "advanced/dll.html",     l: { en: "DLL &amp; API Calls", es: "Llamadas DLL y API", pt: "Chamadas DLL e API" } },
    { u: "advanced/unicode.html", l: { en: "Unicode &amp; i18n", es: "Unicode e i18n", pt: "Unicode e i18n" } },
  ]},
  { t: { en: "Support", es: "Soporte", pt: "Suporte" }, items: [
    { u: "https://forums.fivetechsupport.com/", l: { en: "Tech Support Forums &#8599;", es: "Foros de Soporte Técnico &#8599;", pt: "Fóruns de Suporte Técnico &#8599;" } },
  ]},
];

// Pick a localized label (string or {en,es,pt} object)
function navLabel(v, lang) { return (typeof v === 'string') ? v : (v[lang] || v.en); }

// Render the whole sidebar nav for the given language.
// lp = link prefix to the language root (e.g. "../../es"); path = current pathname.
function buildNav(lang, lp, path) {
  var html = '';
  NAV.forEach(function(sec) {
    html += '<div class="nav-section"><div class="nav-section-title">' + navLabel(sec.t, lang) + '</div>';
    sec.items.forEach(function(it) {
      var ext = it.u.indexOf('http') === 0;
      var href = ext ? it.u : (lp + '/' + it.u);
      var active = (!ext && path.indexOf('/' + it.u) !== -1) ? ' active' : '';
      var tgt = ext ? ' target="_blank"' : '';
      html += '<a class="nav-item' + active + '" href="' + href + '"' + tgt + '>' + navLabel(it.l, lang) + '</a>';
    });
    html += '</div>';
  });
  return html;
}

// Initialize Mermaid
if (typeof mermaid !== 'undefined') {
  mermaid.initialize({
    startOnLoad: true,
    securityLevel: 'loose',
    theme: 'dark',
    themeVariables: {
      primaryColor: '#1f6feb',
      primaryTextColor: '#e6edf3',
      primaryBorderColor: '#30363d',
      lineColor: '#8b949e',
      secondaryColor: '#161b22',
      tertiaryColor: '#1c2129',
      background: '#0d1117',
      mainBkg: '#161b22',
      nodeBorder: '#30363d',
      clusterBkg: '#161b22',
      titleColor: '#e6edf3'
    }
  });
}

// Build TOC from h2/h3 headings
document.addEventListener('DOMContentLoaded', function() {
  var tocLinks = document.getElementById('toc-links');
  if (!tocLinks) return;
  var headings = document.querySelectorAll('#content h2[id], #content h3[id]');
  headings.forEach(function(h) {
    var a = document.createElement('a');
    a.className = 'toc-item' + (h.tagName === 'H3' ? ' toc-h3' : '');
    a.textContent = h.textContent;
    a.href = '#' + h.id;
    tocLinks.appendChild(a);
  });

  // Render the sidebar nav from the single NAV table (language-aware).
  // Replaces whatever static nav each page hard-coded, so every page shows
  // the same complete, consistent navigation. Only runs on /en|es|pt/ pages.
  var path = window.location.pathname;
  var navLangMatch = path.match(/\/(en|es|pt)\//);
  if (navLangMatch) {
    var navLang = navLangMatch[1];
    var navSidebar = document.getElementById('sidebar');
    if (navSidebar) {
      navSidebar.querySelectorAll('.nav-section').forEach(function(s) { s.remove(); });
      var navWrap = document.createElement('div');
      navWrap.id = 'main-nav';
      navWrap.innerHTML = buildNav(navLang, '../../' + navLang, path);
      navSidebar.appendChild(navWrap);
    }
  }

  // Highlight current page in sidebar (covers any non-lang pages with static nav)
  document.querySelectorAll('.nav-item').forEach(function(item) {
    if (item.getAttribute('href') && path.indexOf(item.getAttribute('href')) !== -1) {
      item.classList.add('active');
    }
  });

  // Inject language switcher
  var sidebarHeader = document.getElementById('sidebar-header');
  if (sidebarHeader && !document.getElementById('lang-switcher')) {
    var langDiv = document.createElement('div');
    langDiv.id = 'lang-switcher';
    langDiv.style.cssText = 'padding:8px 16px 4px;display:flex;gap:6px;';
    var path = window.location.pathname;
    var langs = [{code:'en',label:'EN'},{code:'es',label:'ES'},{code:'pt',label:'PT'}];
    langs.forEach(function(lang) {
      var btn = document.createElement('a');
      btn.textContent = lang.label;
      btn.style.cssText = 'padding:4px 12px;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;border:1px solid #30363d;';
      if (path.indexOf('/' + lang.code + '/') !== -1) {
        btn.style.background = '#1f6feb'; btn.style.color = '#fff'; btn.style.borderColor = '#1f6feb';
      } else {
        btn.style.background = '#161b22'; btn.style.color = '#8b949e';
      }
      btn.href = path.replace(/\/(en|es|pt)\//, '/' + lang.code + '/');
      langDiv.appendChild(btn);
    });
    sidebarHeader.appendChild(langDiv);
  }

  // Inject search box and support link into sidebar from JS (avoids editing every page)
  var sidebarHeader = document.getElementById('sidebar-header');
  if (sidebarHeader && !document.getElementById('search-input')) {
    var searchDiv = document.createElement('div');
    searchDiv.id = 'search-box';
    searchDiv.innerHTML = '<input type="text" id="search-input" placeholder="Search docs... (Ctrl+K)"><div id="search-results"></div>';
    sidebarHeader.parentNode.insertBefore(searchDiv, sidebarHeader.nextSibling);
  }
  // (Advanced UI / Utilities / Advanced / Support sections are now part of the
  //  unified NAV table above and rendered by buildNav().)

  // Setup search
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  if (searchInput && searchResults) {
    searchInput.addEventListener('input', function() {
      var q = this.value.toLowerCase().trim();
      if (q.length < 2) { searchResults.classList.remove('active'); searchResults.innerHTML = ''; return; }
      var results = searchIndex.filter(function(item) {
        return item.k.indexOf(q) !== -1 || item.t.toLowerCase().indexOf(q) !== -1;
      });
      searchResults.innerHTML = '';
      if (results.length > 0) {
        searchResults.classList.add('active');
        results.slice(0, 12).forEach(function(r) {
          var a = document.createElement('a');
          a.className = 'search-result';
          a.href = r.u;
          a.innerHTML = '<div class="sr-title">' + r.t + '</div><div class="sr-section">' + r.s + '</div>';
          searchResults.appendChild(a);
        });
      } else {
        searchResults.classList.add('active');
        searchResults.innerHTML = '<div style="padding:8px 12px;color:#8b949e;font-size:13px;">No results found</div>';
      }
    });
    // Ctrl+K shortcut
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchInput.focus(); searchInput.select(); }
      if (e.key === 'Escape') { searchInput.blur(); searchResults.classList.remove('active'); }
    });
  }

  // Syntax highlight all pre>code blocks
  document.querySelectorAll('pre code').forEach(function(block) {
    block.innerHTML = highlightHarbour(block.textContent);
  });
});

// Simple Harbour/xBase syntax highlighter
function highlightHarbour(code) {
  // Escape HTML
  code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Extract comments, preprocessor, and strings FIRST using placeholders
  // so keywords are not highlighted inside them
  var tokens = [];
  function saveToken(m, cls) {
    tokens.push('<span class="' + cls + '">' + m + '</span>');
    return '\x00TOK' + (tokens.length - 1) + '\x00';
  }

  // Comments
  code = code.replace(/(\/\/.*$)/gm, function(m) { return saveToken(m, 'cm'); });
  code = code.replace(/(\/\*[\s\S]*?\*\/)/g, function(m) { return saveToken(m, 'cm'); });

  // Preprocessor directives
  code = code.replace(/^(\s*#\w+.*$)/gm, function(m) { return saveToken(m, 'pp'); });

  // Strings (double and single quotes are both valid in Harbour)
  code = code.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, function(m) { return saveToken(m, 'st'); });

  // Numbers
  code = code.replace(/\b(\d+\.?\d*)\b/g, function(m) { return saveToken(m, 'nb'); });

  // Keywords (case insensitive)
  var kws = 'function|procedure|return|local|static|private|public|if|else|elseif|endif|do|while|enddo|for|next|to|step|exit|loop|class|endclass|method|data|from|inherit|virtual|inline|assign|access|default|nil|self|super|and|or|not|in|begin|end|sequence|recover|with|switch|case|otherwise|endswitch|try|catch|finally';
  var kwRe = new RegExp('\\b(' + kws + ')\\b', 'gi');
  code = code.replace(kwRe, function(m) {
    // Don't replace inside already-highlighted spans
    return '<span class="kw">' + m + '</span>';
  });

  // FWH commands (uppercase style)
  var cmds = 'DEFINE|ACTIVATE|REDEFINE|DEACTIVATE|SET|MENU|MENUITEM|SEPARATOR|ENDMENU|POPUP|WINDOW|DIALOG|BUTTON|SAY|GET|CHECKBOX|RADIO|COMBOBOX|LISTBOX|XBROWSER|BROWSE|FOLDER|ICON|BITMAP|IMAGE|FONT|BRUSH|CURSOR|PEN|MSGBAR|BUTTONBAR|REPORT|COLUMN|GROUP|TITLE|HEADER|FOOTER|PRINTER|PAGE|ENDPAGE|ENDPRINT|PRINT|MDI|MDICHILD|ACTION|PROMPT|OF|SIZE|PIXEL|PIXELS|COLOR|WHEN|VALID|ON|INIT|PAINT|CLICK|CHANGE|CENTERED|CENTER|MAXIMIZED|MINIMIZED|MESSAGE|RESOURCE|STYLE|BORDER|VSCROLL|HSCROLL|FLAT|UPDATE|READONLY|NOWAIT|NOMODAL|TRANSPARENT|TRUE|FALSE|ITEMS|USE|INDEX|CLOSE|APPEND|BLANK|REPLACE|DELETE|RECALL|SKIP|GO|GOTO|LOCATE|CONTINUE|SEEK|FIND|SELECT|FIELD|ALIAS|DATABASE|TRUEPIXEL|MEMO|MULTILINE|TEXT|PASSWORD|DEFAULT|SPINNER|NOBORDER|CANCEL|DESIGN|HELP|SUBSCRIBE';
  var cmdRe = new RegExp('\\b(' + cmds + ')\\b', 'g');
  code = code.replace(cmdRe, '<span class="kw">$1</span>');

  // Boolean literals
  code = code.replace(/(\.(T|F|t|f)\.)/g, function(m) { return saveToken(m, 'nb'); });

  // Restore all tokens (comments, preprocessor, strings)
  code = code.replace(/\x00TOK(\d+)\x00/g, function(m, i) {
    return tokens[parseInt(i)];
  });

  return code;
}

// Fallback: ES/PT sidebar links that don't exist redirect to EN
(function() {
  var path = window.location.pathname;
  var langMatch = path.match(/\/(en|es|pt)\//);
  if (langMatch && langMatch[1] !== 'en') {
    var lang = langMatch[1];
    var sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.addEventListener('click', function(e) {
        var link = e.target.closest('.nav-item');
        if (!link || !link.href) return;
        // Only intercept same-language links
        if (link.href.indexOf('/' + lang + '/') === -1) return;
        // Replace href with EN fallback
        link.setAttribute('data-orig-href', link.href);
        link.href = link.href.replace('/' + lang + '/', '/en/');
      });
    }
  }
})();

// Mobile responsive menu toggle
(function() {
  var btn = document.createElement('button');
  btn.id = 'menu-toggle';
  btn.innerHTML = '☰';
  btn.title = 'Menu';
  btn.onclick = function() {
    var sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open');
    btn.innerHTML = sidebar.classList.contains('open') ? '✕' : '☰';
  };
  document.body.appendChild(btn);

  // Close sidebar when clicking a nav link on mobile
  var sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.addEventListener('click', function(e) {
      if (e.target.classList.contains('nav-item') && window.innerWidth <= 1024) {
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        btn.innerHTML = '☰';
      }
    });
  }
})();

// Mermaid diagram maximize button
(function() {
  function addMaxButtons() {
    var diagrams = document.querySelectorAll(".mermaid");
    diagrams.forEach(function(d) {
      if (d.querySelector(".mermaid-max")) return;
      var btn = document.createElement("button");
      btn.className = "mermaid-max";
      btn.innerHTML = "⛶";
      btn.title = "Click to maximize";
      btn.onclick = function(e) {
        e.stopPropagation();
        var overlay = document.createElement("div");
        overlay.className = "mermaid-overlay";
        overlay.innerHTML = "<button class=\"mermaid-close\">✕</button><div class=\"mermaid-full\">" + d.innerHTML + "</div>";
        overlay.querySelector(".mermaid-close").onclick = function() { overlay.remove(); };
        overlay.onclick = function(ev) { if (ev.target === overlay) overlay.remove(); };
        document.body.appendChild(overlay);
      };
      d.appendChild(btn);
    });
  }
  setTimeout(addMaxButtons, 800);
  setTimeout(addMaxButtons, 2500);
})();
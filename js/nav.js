// FWH Docs — shared sidebar navigation
// Injected by <script src="../../js/nav.js"></script>
// To update all sidebars: edit this file only, not 700+ HTML files.

(function() {
  var path = window.location.pathname;
  var lang = path.match(/\/(en|es|pt)\//);
  lang = lang ? lang[1] : 'en';

  var labels = {
    en: {
      title: "FWH Documentation", version: "Version 26.06",
      gettingStarted: "Getting Started",
      overview: "Framework Overview", install: "Installation", build: "Build System",
      samples: "Samples &amp; Learning Path", local: "Localization", whatsnew: "What's New",
      core: "Core Classes",
      ui: "UI Controls",
      data: "Data Access",
      mariadb: "MariaDB / MySQL", mariaconn: "TMariaConnection", mariarec: "TMariaRecord",
      orm: "ORM Classes",
      print: "Printing &amp; Reports",
      internet: "Internet &amp; AI",
      aiClasses: "AI Classes",
      ref: "Reference",
      classIdx: "Classes Alphabetical", funcIdx: "Functions", commands: "Commands",
      errors: "Error System", resources: "Resources (GDI)", moreClasses: "More Classes"
    },
    es: {
      title: "Documentación FWH", version: "Versión 26.06",
      gettingStarted: "Primeros Pasos",
      overview: "Visión General", install: "Instalación", build: "Sistema de Compilación",
      samples: "Ejemplos y Ruta de Aprendizaje", local: "Localización", whatsnew: "Novedades",
      core: "Clases Principales",
      ui: "Controles UI",
      data: "Acceso a Datos",
      mariadb: "MariaDB / MySQL", mariaconn: "TMariaConnection", mariarec: "TMariaRecord",
      orm: "Clases ORM",
      print: "Impresión e Informes",
      internet: "Internet e IA",
      aiClasses: "Clases IA",
      ref: "Referencia",
      classIdx: "Clases Alfabético", funcIdx: "Funciones", commands: "Comandos",
      errors: "Sistema de Errores", resources: "Recursos (GDI)", moreClasses: "Más Clases"
    },
    pt: {
      title: "Documentação FWH", version: "Versão 26.06",
      gettingStarted: "Primeiros Passos",
      overview: "Visão Geral", install: "Instalação", build: "Sistema de Compilação",
      samples: "Exemplos e Rota de Aprendizagem", local: "Localização", whatsnew: "Novidades",
      core: "Classes Principais",
      ui: "Controles UI",
      data: "Acesso a Dados",
      mariadb: "MariaDB / MySQL", mariaconn: "TMariaConnection", mariarec: "TMariaRecord",
      orm: "Classes ORM",
      print: "Impressão e Relatórios",
      internet: "Internet e IA",
      aiClasses: "Classes IA",
      ref: "Referência",
      classIdx: "Classes Alfabético", funcIdx: "Funções", commands: "Comandos",
      errors: "Sistema de Erros", resources: "Recursos (GDI)", moreClasses: "Mais Classes"
    }
  };

  var L = labels[lang];

  // Build current page relative path for active-link detection
  // path = /FWH_docs/en/ui/tcalex.html → en/ui/tcalex.html
  var cur = path.replace(/^.*\/(en|es|pt)\//, '$1/');

  function link(href, text) {
    var cls = (cur === lang + '/' + href) ? ' class="nav-item active"' : ' class="nav-item"';
    return '<a' + cls + ' href="../../'+lang+'/'+href+'">'+text+'</a>';
  }

  function section(title, items) {
    var h = '<div class="nav-section"><div class="nav-section-title">'+title+'</div>';
    for (var i = 0; i < items.length; i+=2) h += link(items[i], items[i+1]);
    return h + '</div>';
  }


  // Build language-switch URL: replace /en/ /es/ /pt/ prefix with target lang
  function langUrl(targetLang) {
    return '../../' + targetLang + '/' + cur.replace(/^(en|es|pt)\//, '');
  }

  var html = '<div id="sidebar-header"><a href="../../index.html" style="text-decoration:none;color:inherit"><h2>'+L.title+'</h2></a><span class="version">'+L.version+'</span><div class="nav-lang" style="margin-top:6px;font-size:11px"><a href="'+langUrl('en')+'" style="color:'+(lang==='en'?'var(--text)':'var(--text-link)')+';text-decoration:none;font-weight:'+(lang==='en'?'600':'400')+'">EN</a> &middot; <a href="'+langUrl('es')+'" style="color:'+(lang==='es'?'var(--text)':'var(--text-link)')+';text-decoration:none;font-weight:'+(lang==='es'?'600':'400')+'">ES</a> &middot; <a href="'+langUrl('pt')+'" style="color:'+(lang==='pt'?'var(--text)':'var(--text-link)')+';text-decoration:none;font-weight:'+(lang==='pt'?'600':'400')+'">PT</a></div></div>' +
    section(L.gettingStarted, [
      'getting-started/overview.html', L.overview,
      'getting-started/installation.html', L.install,
      'getting-started/build-system.html', L.build,
      'getting-started/samples-guide.html', L.samples,
      'getting-started/tlocalization.html', L.local,
      'getting-started/whatsnew.html', L.whatsnew
    ]) +
    section(L.core, [
      'core/twindow.html', 'TWindow',
      'core/tdialog.html', 'TDialog',
      'core/tcontrol.html', 'TControl'
    ]) +
    section(L.ui, [
      'ui/txbrowse.html', 'TXBrowse',
      'ui/tbutton.html', 'TButton / TBtnBmp',
      'ui/tget.html', 'TGet / TMGet',
      'ui/tmenu.html', 'TMenu',
      'ui/tfolder.html', 'TFolder',
      'ui/tcombobox.html', 'TComboBox',
      'ui/tcheckbox.html', 'TCheckBox / TRadio',
      'ui/tgraph.html', 'TGraph',
      'ui/tgantt.html', 'TGantt',
      'ui/ttoast.html', 'TToast',
      'ui/trating.html', 'TRating',
      'ui/tvideo.html', 'TVideo',
      'ui/tximage.html', 'TXImage',
      'ui/twbrowse.html', 'TWBrowse',
      'ui/tcalex.html', 'TCalEx',
      'ui/tcalviews.html', 'TCalViews'
    ]) +
    section(L.data, [
      'data/tdatabase.html', 'TDatabase',
      'data/trecset.html', 'TRecordSet (ADO)',
      'data/todbc.html', 'TODBC',
      'data/mariadb.html', L.mariadb,
      'data/tmariaconnect.html', L.mariaconn,
      'data/tmariarecord.html', L.mariarec,
      'data/torm.html', L.orm
    ]) +
    section(L.print, [
      'printing/tprinter.html', 'TPrinter',
      'printing/treport.html', 'TReport'
    ]) +
    section(L.internet, [
      'internet/twebview.html', 'TWebView2',
      'internet/twebclient.html', 'TWebClient',
      'internet/twebserver.html', 'TWebServer',
      'internet/tsocket.html', 'TSocket',
      'internet/tsmtp.html', 'TSmtp',
      'internet/tpop3.html', 'TPop3',
      'internet/tftp.html', 'TFtp',
      'internet/twhatsapp.html', 'TWhatsApp',
      'internet/topenai.html', 'TOpenAI',
      'internet/remoteview.html', 'Remote View',
      'internet/tai.html', L.aiClasses,
      'ai/agent.html', 'Class Agent'
    ]) +
    section(L.ref, [
      'reference/classes.html', L.classIdx,
      'reference/functions.html', L.funcIdx,
      'reference/commands.html', L.commands,
      'reference/errorsys.html', L.errors,
      'reference/resources.html', L.resources,
      'reference/more-classes.html', L.moreClasses
    ]);

  document.getElementById('sidebar').innerHTML = html;
})();

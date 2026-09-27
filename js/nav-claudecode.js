// FWH Docs — Claude Code guide sidebar navigation
// Injected by <script src="../../js/nav-claudecode.js"></script> on claudecode pages only.
// Renders the sidebar header (so app.js adds the language switcher and search box)
// and prepends a Claude Code section above the standard nav rendered by app.js.
// Keep the version labels in sync with js/nav.js.

(function() {
  var path = window.location.pathname;
  var lang = path.match(/\/(en|es|pt)\//);
  lang = lang ? lang[1] : 'en';

  var labels = {
    en: {
      title: "FWH Documentation", version: "Version 26.09", section: "Claude Code",
      items: [
        ["overview.html", "Overview"],
        ["installation.html", "Installation"],
        ["claudemd.html", "CLAUDE.md"],
        ["slash-commands.html", "Slash Commands"],
        ["skills.html", "Skills"],
        ["workflows.html", "Workflows"],
        ["samples.html", "Samples"]
      ]
    },
    es: {
      title: "Documentación FWH", version: "Versión 26.09", section: "Claude Code",
      items: [
        ["overview.html", "Visión General"],
        ["installation.html", "Instalación"],
        ["claudemd.html", "CLAUDE.md"],
        ["slash-commands.html", "Slash Commands"],
        ["skills.html", "Skills"],
        ["workflows.html", "Workflows"],
        ["samples.html", "Ejemplos"]
      ]
    },
    pt: {
      title: "Documentação FWH", version: "Versão 26.09", section: "Claude Code",
      items: [
        ["overview.html", "Visão Geral"],
        ["installation.html", "Instalação"],
        ["claudemd.html", "CLAUDE.md"],
        ["slash-commands.html", "Comandos"],
        ["skills.html", "Skills"],
        ["workflows.html", "Workflows"],
        ["samples.html", "Exemplos"]
      ]
    }
  };

  var L = labels[lang];
  var sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Render the header immediately (before DOMContentLoaded) so app.js finds
  // #sidebar-header and injects the language switcher and search box into it.
  if (!document.getElementById('sidebar-header')) {
    sidebar.innerHTML = '<div id="sidebar-header"><a href="../../index.html" style="text-decoration:none;color:inherit"><h2>' + L.title + '</h2></a><span class="version">' + L.version + '</span></div>';
  }

  // After app.js renders the standard nav on DOMContentLoaded, prepend the
  // Claude Code section (app.js wipes .nav-section elements first, so this
  // must run after its handler).
  document.addEventListener('DOMContentLoaded', function() {
    var cur = path.replace(/^.*\/(en|es|pt)\//, '$1/');
    var h = '<div class="nav-section" id="cc-nav"><div class="nav-section-title">' + L.section + '</div>';
    for (var i = 0; i < L.items.length; i++) {
      var href = 'claudecode/' + L.items[i][0];
      var cls = (cur === href) ? ' class="nav-item active"' : ' class="nav-item"';
      h += '<a' + cls + ' href="../../' + lang + '/' + href + '">' + L.items[i][1] + '</a>';
    }
    h += '</div>';
    var mainNav = document.getElementById('main-nav');
    if (mainNav) mainNav.insertAdjacentHTML('beforebegin', h);
    else sidebar.insertAdjacentHTML('beforeend', h);
  });
})();

// Claude Code Docs — standalone sidebar
(function(){
var p=window.location.pathname;
var l=(p.match(/\/(en|es|pt)\//)||[])[1]||'en';
var L={en:{title:"Claude Code",home:"FWH Docs",ov:"Overview",ins:"Installation",md:"CLAUDE.md",sk:"Skills",wf:"Workflows",sc:"Commands",sa:"Samples"},es:{title:"Claude Code",home:"Inicio FWH",ov:"Visión General",ins:"Instalación",md:"CLAUDE.md",sk:"Skills",wf:"Workflows",sc:"Comandos",sa:"Ejemplos"},pt:{title:"Claude Code",home:"Início FWH",ov:"Visão Geral",ins:"Instalação",md:"CLAUDE.md",sk:"Skills",wf:"Workflows",sc:"Comandos",sa:"Exemplos"}}[l];
var c=p.replace(/^.*\/(en|es|pt)\//,'$1/');
function lnk(h,t){var cl=(c===l+'/claudecode/'+h)?' class="nav-item active"':' class="nav-item"';return'<a'+cl+' href="../../'+l+'/claudecode/'+h+'">'+t+'</a>';}
function sec(t,i){var h='<div class="nav-section"><div class="nav-section-title">'+t+'</div>';for(var j=0;j<i.length;j+=2)h+=lnk(i[j],i[j+1]);return h+'</div>';}
document.getElementById('sidebar').innerHTML=
'<div id="sidebar-header"><a href="../../index.html" style="text-decoration:none;color:inherit"><h2>'+L.title+'</h2></a><span class="version">Docs</span></div>'+
'<a class="nav-item" href="../../index.html" style="margin:8px 16px;font-size:12px;color:var(--text-dim)">&larr; '+L.home+'</a>'+
sec('Contents',['overview.html',L.ov,'installation.html',L.ins,'claudemd.html',L.md,'skills.html',L.sk,'workflows.html',L.wf,'slash-commands.html',L.sc,'samples.html',L.sa]);
})();

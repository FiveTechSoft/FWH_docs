var funcLinks = {
  "browse":"ui/twbrowse.html",
  "cgetfile32":"reference/functions.html",
  "ereport":"printing/tereport.html",
  "fw_at":"utilities/tfwstack.html",
  "fw_decode":"utilities/tfwstack.html",
  "fw_memoedit":"reference/functions.html",
  "fw_numtowords":"utilities/tfwstack.html",
  "fw_rectojson":"data/tdatarow.html",
  "fw_setmultilang":"utilities/tfwstack.html",
  "fw_showxlsx":"utilities/texcel.html",
  "fw_xmlview":"utilities/txmlwriter.html",
  "fwgetoleobject":"utilities/ole.html",
  "fwsavepreviewtopdf":"printing/tpreview.html",
  "fwstring":"utilities/tfwstack.html",
  "fwzebra_barcode":"printing/tbarcode.html",
  "getwebapp":"internet/twebserver.html",
  "msgcalc":"reference/functions.html",
  "msgget":"reference/functions.html",
  "msglist":"reference/functions.html",
  "msglogo":"reference/functions.html",
  "msgmeter":"reference/functions.html",
  "msgtoolbar":"reference/functions.html",
  "now":"utilities/ttime.html",
  "pickcolor":"utilities/tpicker_color.html",
  "setdarktheme":"getting-started/whatsnew.html",
  "setobject":"reference/functions.html",
  "waitseconds":"reference/functions.html",
  "xbrowse":"ui/txbrowse.html",
};

document.addEventListener("DOMContentLoaded", function() {
  var lang = (window.location.pathname.match(/\/(en|es|pt)\//) || [])[1] || 'en';
  document.querySelectorAll('.index-columns li code').forEach(function(code) {
    var fn = code.textContent.replace('()','').trim().toLowerCase();
    if (funcLinks[fn]) {
      var a = document.createElement('a');
      a.href = '../../' + lang + '/' + funcLinks[fn];
      a.innerHTML = code.innerHTML;
      code.innerHTML = '';
      code.appendChild(a);
    }
  });
});

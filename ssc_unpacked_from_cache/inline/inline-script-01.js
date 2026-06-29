/* extracted from index.html | inline script #1 | attrs: (none) */
window.__sscErrors = [];
function __sscShowError(msg){
  window.__sscErrors.push(msg);
  var box = document.getElementById('__ssc_err_box');
  if(!box){
    box = document.createElement('div');
    box.id = '__ssc_err_box';
    box.style.cssText = 'position:fixed;left:0;right:0;bottom:0;max-height:45vh;overflow:auto;background:#2b0b0b;color:#ffb4b4;font:12px/1.6 monospace;padding:12px 16px;z-index:999999;border-top:3px solid #ff4d4f;white-space:pre-wrap;word-break:break-all';
    (document.body||document.documentElement).appendChild(box);
  }
  box.textContent = '⚠️ 页面运行错误（请截图发给开发）：\n\n' + window.__sscErrors.join('\n\n');
}
window.addEventListener('error', function(e){
  __sscShowError((e.message||'error') + (e.filename?(' @ '+e.filename.split('/').pop()+':'+e.lineno+':'+e.colno):''));
});
window.addEventListener('unhandledrejection', function(e){
  __sscShowError('Promise rejected: ' + (e.reason && (e.reason.stack||e.reason.message||e.reason)));
});

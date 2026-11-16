'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const language = new URLSearchParams(location.search).get('lang') || 'HTML';
  const storageKey = 'codethd-lang-' + language;
  const extension = {
    HTML:'html', CSS:'css', JavaScript:'js', TypeScript:'ts', Python:'py', Java:'java',
    C:'c', 'C++':'cpp', 'C#':'cs', Go:'go', Rust:'rs', PHP:'php', Ruby:'rb',
    Kotlin:'kt', Swift:'swift', Dart:'dart', R:'r', Perl:'pl', Lua:'lua', Bash:'sh',
    PowerShell:'ps1', SQL:'sql', 'PL/SQL':'sql', 'T-SQL':'sql', Scala:'scala',
    Haskell:'hs', Elixir:'ex', Erlang:'erl', Clojure:'clj', Groovy:'groovy',
    Fortran:'f90', COBOL:'cob', Julia:'jl', Nim:'nim', Crystal:'cr', Zig:'zig',
    D:'d', OCaml:'ml', Prolog:'pl', Scheme:'scm', Solidity:'sol', GDScript:'gd',
    Markdown:'md', JSON:'json', XML:'xml', YAML:'yml', TOML:'toml', Dockerfile:'Dockerfile
  };
  const modeMime = {
    HTML:'htmlmixed', CSS:'css', JavaScript:'javascript', TypeScript:'application/typescript',
    Python:'python', Java:'application/x-java', C:'text/x-csrc', 'C++':'text/x-c++src',
    'C#':'text/x-csharp', Go:'text/x-go', Rust:'text/x-rustsrc', PHP:'application/x-httpd-php',
    Ruby:'text/x-ruby', Bash:'text/x-sh', PowerShell:'powershell', SQL:'text/x-sql',
    JSON:'application/json', XML:'application/xml', YAML:'text/x-yaml', Markdown:'markdown',
    'React JSX':'jsx', Solidity:'text/x-solidity', Dockerfile:'dockerfile'
  };
  const runtimeName = {
    Python:'python', JavaScript:'javascript', TypeScript:'typescript', Java:'java',
    C:'c', 'C++':'cpp', 'C#':'csharp', Go:'go', Rust:'rust', PHP:'php', Ruby:'ruby',
    Kotlin:'kotlin', Swift:'swift', Dart:'dart', R:'r', Perl:'perl', Lua:'lua',
    Bash:'bash', Haskell:'haskell', Elixir:'elixir', Erlang:'erlang', Clojure:'clojure',
    Scala:'scala', 'F#':'fsharp', Fortran:'fortran', COBOL:'cobol', Julia:'julia',
    Nim:'nim', Crystal:'crystal', Zig:'zig', D:'d', OCaml:'ocaml', Prolog:'prolog',
    Scheme:'scheme', 'Common Lisp':'commonlisp', Groovy:'groovy', 'Objective-C':'objectivec',
    Assembly:'assembly'
  };
  const samples = {
    HTML:'<!doctype html>\n<html lang="ar" dir="rtl">\n<head><meta charset="UTF-8"><title>مرحبًا</title></head>\n<body>\n  <h1>مرحبًا بك في CodeTHD</h1>\n  <p>ابدأ ببناء مشروعك.</p>\n</body>\n</html>',
    CSS:'body {\n  font-family: system-ui, sans-serif;\n  background: #101827;\n  color: white;\n  padding: 2rem;\n}\nh1 { color: #35d6a3; }',
    JavaScript:'const message = "Hello from CodeTHD";\nconsole.log(message);',
    TypeScript:'type Greeting = { name: string };\nconst greet = (user: Greeting): string => `Hello, ${user.name}`;\nconsole.log(greet({ name: "CodeTHD" }));',
    Python:'def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("CodeTHD"))',
    Java:'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodeTHD!");\n    }\n}',
    C:'#include <stdio.h>\n\nint main(void) {\n    printf("Hello, CodeTHD!\\\n");\n    return 0;\n}',
    'C++':'#include <iostream>\n\nint main() {\n    std::cout << "Hello, CodeTHD!" << std::endl;\n    return 0;\n}',
    'C#':'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, CodeTHD!");\n    }\n}',
    Go:'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, CodeTHD!")\n}',
    Rust:'fn main() {\n    println!("Hello, CodeTHD!");\n}',
    PHP:'<?php\necho "Hello, CodeTHD!";',
    Ruby:'puts "Hello, CodeTHD!"',
    SQL:'SELECT name, language\nFROM examples\nWHERE active = TRUE\nORDER BY name;',
    Bash:'echo "Hello, CodeTHD!"',
    JSON:'{\n  "name": "CodeTHD",\n  "version": "1.0.0",\n  "ready": true\n}',
    Markdown:'# Hello, CodeTHD\n\nWrite your notes in **Markdown**.'
  };

  const editorElement = $('source');
  const output = $('output');
  const preview = $('preview');
  const runButton = $('runBtn');
  let editor;
  let toastTimer;
  let saveTimer;

  function toast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2300);
  }
  function setOutput(message, kind='normal') {
    output.textContent = message;
    output.className = kind === 'error' ? 'status-bad' : '';
    $('outputTab').classList.add('active');
    $('previewTab').classList.remove('active');
    output.style.display = 'block';
    preview.style.display = 'none';
  }
  function getMode() {
    return modeMime[language] || language;
  }
  function initialiseEditor() {
    $('languagePill').textContent = language;
    $('fileName').textContent = 'main.' + (extension[language] || 'txt');
    document.title = language + ' - CodeTHD';
    CodeMirror.modeURL = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/%N/%N.js';
    editor = CodeMirror.fromTextArea(editorElement, {
      value: '',
      lineNumbers: true,
      lineWrapping: true,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      theme: 'material-darker',
      mode: 'text/plain',
      autoCloseBrackets: true,
      matchBrackets: true,
      lineWiseCopyCut: true,
      extraKeys: {
        'Ctrl-S': saveCode,
        'Cmd-S': saveCode,
        'Ctrl-Enter': runCode,
        'Cmd-Enter': runCode,
        Tab: cm => cm.execCommand('defaultTab')
      }
    });
    const saved = localStorage.getItem(storageKey);
    editor.setValue(saved !== null ? saved : (samples[language] || '// اكتب الكود هنا\n'));
    const requestedMode = getMode();
    const info = CodeMirror.findModeByMIME(requestedMode) || CodeMirror.findModeByName(requestedMode);
    if (info && info.mode) {
      editor.setOption('mode', info.mime || info.mode);
      CodeMirror.autoLoadMode(editor, info.mode);
      $('modeStatus').textContent = '• تلوين نحوي';
      $('editorMode').textContent = 'CodeMirror • ' + info.name;
    } else {
      editor.setOption('mode', requestedMode);
      $('modeStatus').textContent = '• وضع نصي';
      $('editorMode').textContent = 'CodeMirror • نص عادي';
    }
    editor.on('cursorActivity', () => {
      const cursor = editor.getCursor();
      $('cursorStatus').textContent = `السطر ${cursor.line + 1}، العمود ${cursor.ch + 1}`;
    });
    editor.on('change', () => {
      $('saveStatus').textContent = '• تغييرات غير محفوظة';
      $('saveStatus').className = 'status-warn';
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        localStorage.setItem(storageKey, editor.getValue());
        $('saveStatus').textContent = '• حُفظ تلقائيًا';
        $('saveStatus').className = 'status-good';
      }, 650);
    });
  }
  function saveCode() {
    if (!editor) return;
    localStorage.setItem(storageKey, editor.getValue());
    $('saveStatus').textContent = '• محفوظ على هذا الجهاز';
    $('saveStatus').className = 'status-good';
    toast('تم حفظ الكود على هذا الجهاز');
  }
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(editor.getValue());
      toast('تم نسخ الكود');
    } catch {
      editor.focus();
      editor.execCommand('selectAll');
      toast('حددنا الكود؛ استخدم Ctrl+C للنسخ');
    }
  }
  function downloadCode() {
    const blob = new Blob([editor.getValue()], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'main.' + (extension[language] || 'txt');
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('بدأ تنزيل الملف');
  }
  function escapeScript(code) {
    return String(code).replace(/<\/script/gi, '<\\/script');
  }
  function browserBridge() {
    return `(function(){const send=(type,args)=>parent.postMessage({source:'codethd-preview',type,args},'*');['log','info','warn','error'].forEach(type=>{const original=console[type].bind(console);console[type]=(...args)=>{original(...args);send(type,args.map(v=>{try{return typeof v==='object'?JSON.stringify(v):String(v)}catch{return String(v)}}).join(' '))}});window.addEventListener('error',e=>send('error',e.message+' ('+e.lineno+':'+e.colno+')'));window.addEventListener('unhandledrejection',e=>send('error',String(e.reason)));})();`;
  }
  function runInBrowser() {
    const code = editor.getValue();
    const bridge = '<script>' + browserBridge() + '<\/script>';
    let documentBody = '';
    let styles = 'body{font-family:system-ui,sans-serif;padding:22px;color:#172033}';
    let userScript = '';
    if (language === 'HTML') {
      documentBody = code;
    } else if (language === 'CSS') {
      styles += '\n' + code.replace(/<\/style/gi, '<\\/style');
      documentBody = '<main><h2>معاينة CSS</h2><p>هذا مثال لمعاينة التنسيقات. أضف عناصر HTML عبر المحرر الرئيسي عند الحاجة.</p><button>زر تجريبي</button></main>';
    } else {
      documentBody = '<main id="app"></main>';
      userScript = '<script>' + escapeScript(code) + '<\/script>';
    }
    const page = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + styles + '</style></head><body>' + bridge + documentBody + userScript + '</body></html>';
    preview.setAttribute('sandbox', 'allow-scripts');
    preview.srcdoc = page;
    preview.style.display = 'block';
    output.style.display = 'none';
    $('previewTab').classList.add('active');
    $('outputTab').classList.remove('active');
    $('runStatus').textContent = 'معاينة محلية';
    $('runNote').innerHTML = '<strong>تشغيل داخل المتصفح:</strong> نفّذنا الكود في إطار معزول عن بيانات الموقع. لا تستخدم هذه المعاينة لتجربة مفاتيح سرية أو بيانات حساسة.';
  }
  async function runOnServer() {
    const cfg = window.CODETHD_CONFIG || {};
    const runnerUrl = String(cfg.runnerUrl || '').replace(/\/$/, '');
    if (!runnerUrl) {
      setOutput('لم يتم ربط خادم تشغيل بعد.\n\nيمكنك استخدام المحرر وحفظ الملفات وتنزيلها الآن. لتشغيل ' + language + '، يجب نشر خدمة تشغيل آمنة ثم وضع عنوانها في runnerUrl داخل codethd-config.js.\n\nلن نرسل كودك إلى خدمة عامة غير موثوقة.', 'error');
      $('runStatus').textContent = 'الخادم غير مربوط';
      $('runNote').innerHTML = '<strong>محرر اللغة جاهز:</strong> التلوين والحفظ والتنزيل متاحون. تشغيل هذه اللغة يحتاج خادمًا منفصلًا ومعزولًا.';
      return;
    }
    const state = await window.CODETHD_AUTH_READY;
    if (!state) {
      setOutput('سجّل الدخول أولًا لاستخدام خدمة تشغيل الأكواد.', 'error');
      $('runStatus').textContent = 'يلزم تسجيل الدخول';
      return;
    }
    const session = await window.CodeTHDCloud.session();
    if (!session || !session.access_token) {
      setOutput('انتهت جلسة الدخول. سجّل الدخول مرة أخرى.', 'error');
      return;
    }
    const runtime = runtimeName[language];
    if (!runtime) {
      setOutput('لا يوجد ربط تشغيل مهيأ لهذه اللغة حتى الآن. يمكنك تحرير الملف وتلوينه وتنزيله.', 'error');
      $('runStatus').textContent = 'تشغيل غير مدعوم بعد';
      return;
    }
    runButton.disabled = true;
    runButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ التشغيل';
    $('runStatus').textContent = 'جارٍ تنفيذ الكود...';
    setOutput('يتم إرسال الكود إلى خادم CodeTHD المعزول...');
    $('runNote').textContent = 'لا تضع كلمات مرور أو مفاتيح سرية داخل كود ترسله إلى خدمة تنفيذ الأكواد.';
    try {
      const response = await fetch(runnerUrl + '/api/execute', {
        method: 'POST',
        headers: {'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
        body: JSON.stringify({language:runtime,code:editor.getValue(),stdin:$('stdin').value})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'تعذر تشغيل الكود (' + response.status + ')');
      const parts = [];
      if (data.compile?.output) parts.push('--- Compile ---\n' + data.compile.output);
      if (data.run?.output) parts.push('--- Output ---\n' + data.run.output);
      if (!parts.length) parts.push('انتهى التنفيذ دون مخرجات.');
      parts.push('\nExit code: ' + (data.run?.code ?? 'غير متاح'));
      setOutput(parts.join('\n'));
      $('runStatus').textContent = data.run?.code === 0 ? 'اكتمل بنجاح' : 'انتهى التنفيذ';
      $('runNote').innerHTML = '<strong>بيئة التشغيل:</strong> ' + String(data.language || runtime) + ' ' + String(data.version || '') + ' — راجع المخرجات أعلاه.';
    } catch (error) {
      setOutput(error.message || 'حدث خطأ أثناء التشغيل.', 'error');
      $('runStatus').textContent = 'فشل التشغيل';
    } finally {
      runButton.disabled = false;
      runButton.innerHTML = '<i class="fa-solid fa-play"></i> تشغيل';
    }
  }
  async function runCode() {
    if (!editor) return;
    if (['HTML','CSS','JavaScript'].includes(language)) {
      runInBrowser();
      return;
    }
    await runOnServer();
  }
  function updateRuntimeNote() {
    const local = ['HTML','CSS','JavaScript'].includes(language);
    if (local) {
      $('runNote').innerHTML = '<strong>مدعوم محليًا:</strong> يعمل داخل المتصفح في إطار معزول. لا يحتاج إلى خادم تنفيذ.';
      $('runStatus').textContent = 'تشغيل محلي';
      return;
    }
    $('stdinWrap').style.display = 'block';
    $('runNote').innerHTML = '<strong>المحرر متاح:</strong> التلوين والحفظ والتنزيل يعملان. زر التشغيل يحتاج خادم CodeTHD منفصلًا؛ لا نزعم أن كل لغة تعمل قبل تثبيت بيئتها.';
    $('runStatus').textContent = 'يتطلب خادم تشغيل';
  }
  function connectPreviewMessages() {
    window.addEventListener('message', event => {
      if (event.source !== preview.contentWindow || event.data?.source !== 'codethd-preview') return;
      const type = ['log','info','warn','error'].includes(event.data.type) ? event.data.type : 'log';
      const line = '[' + type.toUpperCase() + '] ' + String(event.data.args || '');
      const prior = output.textContent.startsWith('أهلًا') ? '' : output.textContent + '\n';
      output.textContent = (prior + line).slice(-12000);
      output.style.display = 'block';
      preview.style.display = 'none';
      $('outputTab').classList.add('active');
      $('previewTab').classList.remove('active');
    });
  }
  $('runBtn').addEventListener('click', runCode);
  $('saveBtn').addEventListener('click', saveCode);
  $('downloadBtn').addEventListener('click', downloadCode);
  $('copyBtn').addEventListener('click', copyCode);
  $('resetBtn').addEventListener('click', () => {
    if (confirm('هل تريد استبدال النص الحالي بمثال البداية؟')) {
      editor.setValue(samples[language] || '// اكتب الكود هنا\n');
      saveCode();
    }
  });
  $('clearOutputBtn').addEventListener('click', () => setOutput('تم مسح المخرجات.'));
  $('outputTab').addEventListener('click', () => {
    $('outputTab').classList.add('active');$('previewTab').classList.remove('active');
    output.style.display='block';preview.style.display='none';
  });
  $('previewTab').addEventListener('click', () => {
    if (!preview.srcdoc) return;
    $('previewTab').classList.add('active');$('outputTab').classList.remove('active');
    preview.style.display='block';output.style.display='none';
  });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {e.preventDefault();saveCode();}
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter') {e.preventDefault();runCode();}
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {e.preventDefault();copyCode();}
  });
  (async () => {
    initialiseEditor();
    updateRuntimeNote();
    connectPreviewMessages();
    const state = await window.CODETHD_AUTH_READY;
    if (state?.profile) {
      $('accountLink').innerHTML = '<i class="fa-solid fa-user-check"></i><span class="hide-mobile">' + String(state.profile.display_name || state.profile.username || 'حسابي').replace(/[&<>"]/g,'') + '</span>';
      $('accountLink').title = 'الحساب @' + String(state.profile.username || '');
    }
  })().catch(error => {
    console.error(error);
    setOutput('تعذر تحميل المحرر. أعد تحميل الصفحة.', 'error');
  });
})();

'use strict';
(function () {
  const $ = function (id) { return document.getElementById(id); };
  const language = new URLSearchParams(location.search).get('lang') || 'HTML';
  const extensions = {
    HTML:'html',CSS:'css',JavaScript:'js',TypeScript:'ts',Python:'py',Java:'java',
    C:'c','C++':'cpp','C#':'cs',Go:'go',Rust:'rs',PHP:'php',Ruby:'rb',Kotlin:'kt',
    Swift:'swift',Dart:'dart',R:'r',Perl:'pl',Lua:'lua',Bash:'sh',PowerShell:'ps1',
    SQL:'sql','PL/SQL':'sql','T-SQL':'sql',Scala:'scala',Haskell:'hs',Elixir:'ex',
    Erlang:'erl',Clojure:'clj',Groovy:'groovy',Fortran:'f90',COBOL:'cob',Julia:'jl',
    Nim:'nim',Crystal:'cr',Zig:'zig',D:'d',OCaml:'ml',Prolog:'pl',Scheme:'scm',
    Solidity:'sol',GDScript:'gd',Markdown:'md',JSON:'json',XML:'xml',YAML:'yml',
    TOML:'toml',Dockerfile:'Dockerfile','React JSX':'jsx','Angular TypeScript':'ts'
  };
  const runtimeNames = {
    Python:'python',JavaScript:'javascript',TypeScript:'typescript',Java:'java',
    C:'c','C++':'cpp','C#':'csharp',Go:'go',Rust:'rust',PHP:'php',Ruby:'ruby',
    Kotlin:'kotlin',Swift:'swift',Dart:'dart',R:'r',Perl:'perl',Lua:'lua',Bash:'bash',
    PowerShell:'powershell',Haskell:'haskell',Elixir:'elixir',Erlang:'erlang',
    Clojure:'clojure',Scala:'scala','F#':'fsharp',Fortran:'fortran',COBOL:'cobol',
    Julia:'julia',Nim:'nim',Crystal:'crystal',Zig:'zig',D:'d',OCaml:'ocaml',
    Prolog:'prolog',Scheme:'scheme','Common Lisp':'commonlisp',Groovy:'groovy',
    'Objective-C':'objectivec',Assembly:'assembly',Solidity:'solidity'
  };
  const modeNames = {
    'React JSX':'JSX','Angular TypeScript':'TypeScript','C++':'C++','C#':'C#',
    'F#':'F#','Objective-C':'Objective-C','Objective-C++':'Objective-C++',
    'PL/SQL':'SQL','T-SQL':'SQL','GDScript':'Python'
  };
  const samples = {
    HTML:'<main class="welcome">\n  <h1>مرحبًا بك في CodeTHD</h1>\n  <p>ابدأ ببناء مشروعك.</p>\n</main>',
    CSS:'body {\n  font-family: system-ui, sans-serif;\n  background: #101827;\n  color: white;\n  padding: 2rem;\n}\nh1 { color: #35d6a3; }',
    JavaScript:'const message = "Hello from CodeTHD";\nconsole.log(message);\ndocument.getElementById("app").textContent = message;',
    TypeScript:'type Greeting = { name: string };\nconst greet = (user: Greeting): string => "Hello, " + user.name;\nconsole.log(greet({ name: "CodeTHD" }));',
    Python:'def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("CodeTHD"))',
    Java:'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodeTHD!");\n    }\n}',
    C:'#include <stdio.h>\n\nint main(void) {\n    printf("Hello, CodeTHD!\\n");\n    return 0;\n}',
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
  const storageKey = 'codethd-lang-v2-' + language;
  const editorElement = $('source');
  const output = $('output');
  const preview = $('preview');
  const runButton = $('runBtn');
  let editor = null;
  let saveTimer = null;
  let toastTimer = null;
  let consoleLines = [];

  function notify(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $('toast').classList.remove('show'); }, 2200);
  }
  function showOutput(message, isError) {
    output.textContent = message || '';
    output.classList.toggle('status-bad', !!isError);
    $('outputTab').click();
  }
  function setRunStatus(message, kind) {
    $('runStatus').textContent = message;
    $('runStatus').className = kind || 'muted';
  }
  function saveCode(silent) {
    if (!editor) return;
    try {
      localStorage.setItem(storageKey, editor.getValue());
      $('saveStatus').textContent = 'محفوظ على هذا الجهاز';
      $('saveStatus').className = 'status-good';
      if (!silent) notify('تم حفظ الملف محليًا');
    } catch (error) {
      $('saveStatus').textContent = 'تعذر الحفظ';
      $('saveStatus').className = 'status-bad';
      if (!silent) notify('مساحة التخزين ممتلئة أو غير متاحة');
    }
  }
  function initialiseEditor() {
    $('languagePill').textContent = language;
    $('fileName').textContent = 'main.' + (extensions[language] || 'txt');
    document.title = language + ' — CodeTHD Studio';
    const saved = localStorage.getItem(storageKey);
    editor = CodeMirror.fromTextArea(editorElement, {
      lineNumbers: true,
      lineWrapping: false,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      theme: 'material-darker',
      mode: 'text/plain',
      autoCloseBrackets: true,
      matchBrackets: true,
      styleActiveLine: true,
      extraKeys: {
        'Ctrl-S': function () { saveCode(false); },
        'Cmd-S': function () { saveCode(false); },
        'Ctrl-Enter': runCode,
        'Cmd-Enter': runCode,
        'Tab': function (cm) { cm.replaceSelection('  ', 'end'); }
      }
    });
    editor.setValue(saved !== null ? saved : (samples[language] || '// اكتب الكود هنا\n'));
    const modeName = modeNames[language] || language;
    const info = CodeMirror.findModeByName(modeName);
    if (info && info.mode) {
      editor.setOption('mode', info.mime || info.mode);
      CodeMirror.autoLoadMode(editor, info.mode);
      $('modeStatus').textContent = 'تلوين نحوي متاح';
      $('editorMode').textContent = 'CodeMirror · ' + info.name;
    } else {
      editor.setOption('mode', 'text/plain');
      $('modeStatus').textContent = 'وضع نصي عام لهذه اللغة';
      $('editorMode').textContent = 'CodeMirror · Plain text';
    }
    editor.on('cursorActivity', function () {
      const cursor = editor.getCursor();
      $('cursorStatus').textContent = 'السطر ' + (cursor.line + 1) + '، العمود ' + (cursor.ch + 1);
    });
    editor.on('change', function () {
      $('saveStatus').textContent = 'تغييرات غير محفوظة';
      $('saveStatus').className = 'status-warn';
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () { saveCode(true); }, 550);
    });
  }
  function switchTab(which) {
    const showPreview = which === 'preview';
    $('previewTab').classList.toggle('active', showPreview);
    $('outputTab').classList.toggle('active', !showPreview);
    $('preview').parentElement.classList.toggle('active', showPreview);
    output.classList.toggle('active', !showPreview);
  }
  function clearConsole() {
    consoleLines = [];
    $('consoleOutput').textContent = 'Console جاهز.';
  }
  function renderConsole(type, message) {
    consoleLines.push('[' + String(type).toUpperCase() + '] ' + String(message));
    if (consoleLines.length > 150) consoleLines = consoleLines.slice(-150);
    $('consoleOutput').textContent = consoleLines.join('\n');
  }
  function escapeScriptEnd(text) {
    return String(text).replace(/<\/script/gi, '<\\/script');
  }
  function bridgeScript() {
    return '(function(){' +
      'function send(type,args){parent.postMessage({source:"codethd-preview",type:type,args:Array.prototype.map.call(args,function(v){try{return typeof v==="object"?JSON.stringify(v):String(v)}catch(e){return String(v)}}).join(" ")},"*")}' +
      '["log","info","warn","error"].forEach(function(type){var original=console[type].bind(console);console[type]=function(){original.apply(console,arguments);send(type,arguments)}});' +
      'window.addEventListener("error",function(e){send("error",[e.message+" ("+e.lineno+":"+e.colno+")"])});' +
      'window.addEventListener("unhandledrejection",function(e){send("error",[String(e.reason)])});' +
      '})();';
  }
  function createCsp() {
    return '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data: blob:; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; connect-src \'none\'; form-action \'none\'; base-uri \'none\'; object-src \'none\'; frame-src \'none\'">';
  }
  function makePreviewDocument(code) {
    const csp = createCsp();
    const bridge = '<script>' + bridgeScript() + '</script>';
    const cssCode = code.replace(/<\/style/gi, '<\\/style');
    const scriptCode = escapeScriptEnd(code);
    if (language === 'HTML' && /<html[\s>]/i.test(code)) {
      let html = code;
      if (/<head[\s>]/i.test(html)) {
        html = html.replace(/<head([^>]*)>/i, '<head$1>' + csp + bridge);
      } else {
        html = html.replace(/<html([^>]*)>/i, '<html$1><head>' + csp + bridge + '</head>');
      }
      return html;
    }
    let body = '';
    let styles = 'body{font-family:system-ui,sans-serif;padding:22px;color:#172033}';
    let userScript = '';
    if (language === 'HTML') {
      body = code;
    } else if (language === 'CSS') {
      styles += '\n' + cssCode;
      body = '<main><h2>معاينة CSS</h2><p>هذا المحتوى التجريبي لتجربة التنسيقات.</p><button>زر تجريبي</button></main>';
    } else {
      body = '<main id="app"><p>JavaScript preview is ready.</p></main>';
      userScript = '<script>' + scriptCode + '</script>';
    }
    return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + csp + '<style>' + styles + '</style>' + bridge + '</head><body>' + body + userScript + '</body></html>';
  }
  function runInBrowser() {
    clearConsole();
    preview.setAttribute('sandbox', 'allow-scripts');
    preview.srcdoc = makePreviewDocument(editor.getValue());
    $('preview').style.display = 'block';
    $('output').style.display = 'none';
    switchTab('preview');
    setRunStatus('معاينة محلية', 'status-good');
    $('runNote').innerHTML = '<strong>تشغيل محلي:</strong> نُفّذ الكود في إطار معزول دون صلاحية الوصول إلى ملفات الموقع أو جلسة الحساب. اتصالات الشبكة الخارجية محجوبة في المعاينة.';
  }
  function decodeBase64(value) {
    if (!value) return '';
    try {
      const binary = atob(value);
      const bytes = Uint8Array.from(binary, function (char) { return char.charCodeAt(0); });
      return new TextDecoder().decode(bytes);
    } catch (error) {
      return String(value);
    }
  }
  async function runOnServer() {
    const runtime = runtimeNames[language];
    if (!runtime) {
      showOutput('CodeTHD لا يملك بيئة تشغيل مهيأة لهذه اللغة بعد.\nيمكنك الاستمرار في تحرير الملف وتلوينه (بحسب دعم CodeMirror) وتنزيله.', true);
      setRunStatus('بيئة التشغيل غير مهيأة', 'status-bad');
      return;
    }
    if (!window.CodeTHDCloud || !window.CODETHD_AUTH_READY) {
      showOutput('خدمة الحسابات غير متاحة في هذه الصفحة. أعد تحميلها أو تحقق من إعداد Supabase.', true);
      setRunStatus('خدمة الحساب غير متاحة', 'status-bad');
      return;
    }
    const authState = await window.CODETHD_AUTH_READY;
    if (!authState) {
      showOutput('سجّل الدخول أولًا قبل تشغيل كود على الخادم.', true);
      setRunStatus('يلزم تسجيل الدخول', 'status-warn');
      return;
    }
    runButton.disabled = true;
    runButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ التشغيل';
    setRunStatus('جارٍ إرسال المهمة...', 'muted');
    showOutput('يتم إرسال الكود إلى بيئة التشغيل المعزولة...', false);
    $('runNote').textContent = 'لا تضع كلمات مرور أو رموز وصول أو بيانات خاصة داخل كود يتم تشغيله على خادم.';
    try {
      const result = await window.CodeTHDCloud.client.functions.invoke('execute-code', {
        body: { language: runtime, code: editor.getValue(), stdin: $('stdin').value || '' }
      });
      if (result.error) {
        const details = result.error.context && typeof result.error.context.json === 'function'
          ? await result.error.context.json().catch(function () { return null; }) : null;
        throw new Error((details && details.error) || result.error.message || 'تعذر الاتصال بخدمة التنفيذ.');
      }
      const data = result.data || {};
      if (data.error) throw new Error(data.error);
      const chunks = [];
      const stdout = data.stdout || '';
      const stderr = data.stderr || '';
      const compile = data.compile_output || '';
      if (compile) chunks.push('--- Compile ---\n' + compile);
      if (stdout) chunks.push('--- Output ---\n' + stdout);
      if (stderr) chunks.push('--- Errors ---\n' + stderr);
      if (!chunks.length) chunks.push(data.status === 'accepted' ? 'اكتمل التنفيذ دون مخرجات.' : 'لا توجد مخرجات.');
      if (data.exit_code !== null && data.exit_code !== undefined) chunks.push('\nExit code: ' + data.exit_code);
      if (data.time) chunks.push('Time: ' + data.time);
      if (data.memory) chunks.push('Memory: ' + data.memory);
      showOutput(chunks.join('\n'), Number(data.exit_code) !== 0 && data.exit_code !== null);
      setRunStatus(Number(data.exit_code) === 0 ? 'اكتمل بنجاح' : 'انتهى التنفيذ', Number(data.exit_code) === 0 ? 'status-good' : 'status-warn');
      $('runNote').textContent = 'خادم التنفيذ: ' + String(data.language || runtime) + '. تأكد من أن المسؤول نشره مع حدود الذاكرة والوقت وتعطيل الشبكة.';
    } catch (error) {
      showOutput(error.message || 'حدث خطأ أثناء التشغيل.', true);
      setRunStatus('فشل التشغيل', 'status-bad');
    } finally {
      runButton.disabled = false;
      runButton.innerHTML = '<i class="fa-solid fa-play"></i> تشغيل';
    }
  }
  async function runCode() {
    if (!editor) return;
    if (language === 'HTML' || language === 'CSS' || language === 'JavaScript') {
      runInBrowser();
      return;
    }
    await runOnServer();
  }
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(editor.getValue());
      notify('تم نسخ الكود');
    } catch (error) {
      editor.focus();
      editor.execCommand('selectAll');
      notify('حددنا الكود؛ استخدم Ctrl+C');
    }
  }
  function downloadCode() {
    const blob = new Blob([editor.getValue()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'main.' + (extensions[language] || 'txt');
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    notify('بدأ تنزيل الملف');
  }
  function resetCode() {
    if (!window.confirm('هل تريد استبدال الكود الحالي بمثال البداية؟')) return;
    editor.setValue(samples[language] || '// اكتب الكود هنا\n');
    saveCode(true);
    notify('تمت استعادة مثال البداية');
  }
  function setupMessages() {
    window.addEventListener('message', function (event) {
      if (event.source !== preview.contentWindow || !event.data || event.data.source !== 'codethd-preview') return;
      const type = ['log', 'info', 'warn', 'error'].indexOf(event.data.type) >= 0 ? event.data.type : 'log';
      renderConsole(type, event.data.args || '');
    });
  }
  function setup() {
    initialiseEditor();
    $('runBtn').addEventListener('click', runCode);
    $('saveBtn').addEventListener('click', function () { saveCode(false); });
    $('copyBtn').addEventListener('click', copyCode);
    $('downloadBtn').addEventListener('click', downloadCode);
    $('resetBtn').addEventListener('click', resetCode);
    $('clearConsoleBtn').addEventListener('click', clearConsole);
    $('clearOutputBtn').addEventListener('click', function () { output.textContent = 'تم مسح المخرجات.'; });
    $('previewTab').addEventListener('click', function () { switchTab('preview'); });
    $('outputTab').addEventListener('click', function () { switchTab('output'); });
    $('stdinWrap').style.display = runtimeNames[language] && !['HTML', 'CSS', 'JavaScript'].includes(language) ? 'block' : 'none';
    $('runNote').innerHTML = ['HTML', 'CSS', 'JavaScript'].includes(language)
      ? '<strong>مدعوم محليًا:</strong> تشغيل داخل إطار معزول في المتصفح، دون حاجة إلى خادم.'
      : '<strong>محرر اللغة جاهز:</strong> التلوين والحفظ والتنزيل متاحون. تشغيل هذه اللغة يتطلب نشر وظيفة التنفيذ وربط بيئة تشغيل آمنة.';
    setRunStatus(['HTML', 'CSS', 'JavaScript'].includes(language) ? 'تشغيل محلي' : 'يتطلب خادم تشغيل', 'muted');
    setupMessages();
    document.addEventListener('keydown', function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveCode(false);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        runCode();
      }
    });
    if (window.CODETHD_AUTH_READY) {
      window.CODETHD_AUTH_READY.then(function (state) {
        if (state && state.profile) {
          $('accountLink').innerHTML = '<i class="fa-solid fa-user-check"></i><span class="hide-mobile">' +
            String(state.profile.display_name || state.profile.username || 'حسابي').replace(/[&<>"]/g, '') + '</span>';
          $('accountLink').title = 'الحساب @' + String(state.profile.username || '');
        }
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
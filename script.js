// ============================================
// إدارة الوضع الليلي والفاتح
// ============================================
const themeToggle = document.getElementById('themeToggle');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const particlesContainer = document.getElementById('particles');
const previewArea = document.getElementById('preview-area');
const htmlCodeArea = document.getElementById('html-code');
const cssCodeArea = document.getElementById('css-code');
const jsCodeArea = document.getElementById('js-code');
const consoleOutput = document.getElementById('console-output');

// CodeMirror Editors
let htmlEditor, cssEditor, jsEditor;

// تحميل الوضع المحفوظ
function initTheme() {
    const savedTheme = localStorage.getItem('codethd-theme') || 'dark-mode';
    document.body.classList.add(savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const icon = theme === 'dark-mode' ? '🌙' : '☀️';
    themeToggle.querySelector('.theme-icon').textContent = icon;
}

themeToggle.addEventListener('click', () => {
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        localStorage.setItem('codethd-theme', 'light-mode');
        updateThemeIcon('light-mode');
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('codethd-theme', 'dark-mode');
        updateThemeIcon('dark-mode');
    }
    
    createParticles(10, 'sparkles');
});

// ============================================
// تهيئة محررات CodeMirror
// ============================================
function initEditors() {
    htmlEditor = CodeMirror(document.getElementById('html-editor'), {
        value: htmlCodeArea.value,
        mode: 'htmlmixed',
        lineNumbers: true,
        lineWrapping: true,
        indentUnit: 2,
        indentWithTabs: false,
        theme: 'material-darker',
        extraKeys: {
            'Ctrl-Space': 'autocomplete',
            'Ctrl-/': 'toggleComment',
            'Cmd-Space': 'autocomplete',
            'Cmd-/': 'toggleComment'
        },
        autoCloseBrackets: true,
        matchBrackets: true
    });

    cssEditor = CodeMirror(document.getElementById('css-editor'), {
        value: cssCodeArea.value,
        mode: 'css',
        lineNumbers: true,
        lineWrapping: true,
        indentUnit: 2,
        indentWithTabs: false,
        theme: 'material-darker',
        extraKeys: {
            'Ctrl-Space': 'autocomplete',
            'Ctrl-/': 'toggleComment',
            'Cmd-Space': 'autocomplete',
            'Cmd-/': 'toggleComment'
        },
        autoCloseBrackets: true,
        matchBrackets: true
    });

    jsEditor = CodeMirror(document.getElementById('js-editor'), {
        value: jsCodeArea.value,
        mode: 'javascript',
        lineNumbers: true,
        lineWrapping: true,
        indentUnit: 2,
        indentWithTabs: false,
        theme: 'material-darker',
        extraKeys: {
            'Ctrl-Space': 'autocomplete',
            'Ctrl-/': 'toggleComment',
            'Cmd-Space': 'autocomplete',
            'Cmd-/': 'toggleComment'
        },
        autoCloseBrackets: true,
        matchBrackets: true
    });

    // تحديث عند التغيير
    [htmlEditor, cssEditor, jsEditor].forEach(editor => {
        editor.on('change', () => {
            updatePreview();
            saveCodeToLocalStorage();
        });
    });
}

// ============================================
// تحديث المعاينة - Preview Update
// ============================================
function updatePreview() {
    try {
        const html = htmlEditor.getValue();
        const css = cssEditor.getValue();
        const js = jsEditor.getValue();
        
        const doc = previewArea.contentDocument || previewArea.contentWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { margin: 0; padding: 10px; font-family: 'Segoe UI', sans-serif; }
                        ${css}
                    </style>
                </head>
                <body>
                    ${html}
                    <script>
                        try {
                            ${js}
                        } catch(e) {
                            console.error('خطأ في الكود:', e.message);
                        }
                    <\/script>
                </body>
            </html>
        `);
        doc.close();
    } catch (error) {
        console.error('خطأ في تحديث المعاينة:', error);
    }
}

// ============================================
// وحدة التحكم - Console Interception
// ============================================
function setupConsoleInterception() {
    const iframe = previewArea;
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    // ننتظر قليلاً لتحميل iframe
    setTimeout(() => {
        try {
            const iframeWindow = iframe.contentWindow;
            
            iframeWindow.console.log = function(...args) {
                originalLog(...args);
                addConsoleOutput(args.join(' '), 'log');
            };
            
            iframeWindow.console.error = function(...args) {
                originalError(...args);
                addConsoleOutput(args.join(' '), 'error');
            };
            
            iframeWindow.console.warn = function(...args) {
                originalWarn(...args);
                addConsoleOutput(args.join(' '), 'warn');
            };
            
            iframeWindow.console.info = function(...args) {
                originalInfo(...args);
                addConsoleOutput(args.join(' '), 'info');
            };
        } catch (e) {
            console.log('لا يمكن الوصول إلى console في iframe');
        }
    }, 100);
}

function addConsoleOutput(message, type = 'log') {
    const line = document.createElement('div');
    line.className = `console-${type}`;
    line.textContent = message;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// زر مسح console
document.getElementById('clearConsoleBtn').addEventListener('click', () => {
    consoleOutput.innerHTML = '';
    showNotification('تم مسح السجل! ✓');
});

// ============================================
// حفظ واسترجاع الكود من LocalStorage
// ============================================
function saveCodeToLocalStorage() {
    localStorage.setItem('codethd-html', htmlEditor.getValue());
    localStorage.setItem('codethd-css', cssEditor.getValue());
    localStorage.setItem('codethd-js', jsEditor.getValue());
}

function loadCodeFromLocalStorage() {
    const savedHtml = localStorage.getItem('codethd-html');
    const savedCss = localStorage.getItem('codethd-css');
    const savedJs = localStorage.getItem('codethd-js');
    
    if (savedHtml) htmlEditor.setValue(savedHtml);
    if (savedCss) cssEditor.setValue(savedCss);
    if (savedJs) jsEditor.setValue(savedJs);
    
    updatePreview();
}

// ============================================
// زر مسح الكل
// ============================================
clearBtn.addEventListener('click', () => {
    if (confirm('هل تريد حقاً مسح جميع الأكواد؟ لا يمكن التراجع عن هذا!')) {
        htmlEditor.setValue('');
        cssEditor.setValue('');
        jsEditor.setValue('');
        localStorage.removeItem('codethd-html');
        localStorage.removeItem('codethd-css');
        localStorage.removeItem('codethd-js');
        updatePreview();
        createParticles(15, 'stars');
        showNotification('تم مسح جميع الأكواد! 🗑️');
    }
});

// ============================================
// استيراد وتصدير المشروع
// ============================================
exportBtn.addEventListener('click', () => {
    const html = htmlEditor.getValue();
    const css = cssEditor.getValue();
    const js = jsEditor.getValue();
    
    const fullHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>من Codethd</title>
    <style>
        ${css}
    </style>
</head>
<body>
    ${html}
    <script>
        ${js}
    <\/script>
</body>
</html>`;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codethd-${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    createParticles(20, 'bubbles');
    showNotification('تم تنزيل المشروع! 📥');
});

importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            parseAndLoadHTML(content);
        };
        reader.readAsText(file);
    };
    input.click();
});

function parseAndLoadHTML(htmlContent) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // استخراج CSS
        const styleTag = doc.querySelector('style');
        const css = styleTag ? styleTag.textContent : '';
        
        // استخراج JS
        const scriptTag = doc.querySelector('script');
        const js = scriptTag ? scriptTag.textContent : '';
        
        // استخراج HTML (body)
        const bodyContent = doc.body.innerHTML.replace(/<script[^>]*>.*?<\/script>/gs, '');
        
        htmlEditor.setValue(bodyContent);
        cssEditor.setValue(css);
        jsEditor.setValue(js);
        
        saveCodeToLocalStorage();
        updatePreview();
        createParticles(15, 'stars');
        showNotification('تم استيراد المشروع بنجاح! ✓');
    } catch (error) {
        showNotification('خطأ في استيراد الملف! ❌');
        console.error('خطأ:', error);
    }
}

// ============================================
// أزرار النسخ
// ============================================
document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-copy');
        let text = '';
        
        if (targetId === 'html-code') text = htmlEditor.getValue();
        else if (targetId === 'css-code') text = cssEditor.getValue();
        else if (targetId === 'js-code') text = jsEditor.getValue();
        
        navigator.clipboard.writeText(text).then(() => {
            showNotification('تم النسخ! ✓');
        }).catch(() => {
            showNotification('فشل النسخ! ❌');
        });
    });
});

// ============================================
// تأثيرات الجزيئات العائمة
// ============================================
function createParticles(count, type = 'random') {
    const types = ['stars', 'bubbles', 'sparkles'];
    
    for (let i = 0; i < count; i++) {
        const particleType = type === 'random' ? types[Math.floor(Math.random() * types.length)] : type;
        const particle = document.createElement('div');
        particle.className = `particle ${particleType}`;
        
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        
        if (particleType === 'stars') {
            particle.textContent = ['⭐', '✨', '🌟'][Math.floor(Math.random() * 3)];
            particle.style.fontSize = (10 + Math.random() * 15) + 'px';
        } else if (particleType === 'bubbles') {
            const size = 10 + Math.random() * 30;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
        } else if (particleType === 'sparkles') {
            particle.textContent = ['💫', '✨', '⚡'][Math.floor(Math.random() * 3)];
            particle.style.fontSize = (8 + Math.random() * 12) + 'px';
        }
        
        const duration = 2 + Math.random() * 2;
        particle.style.animationDuration = duration + 's';
        
        particlesContainer.appendChild(particle);
        
        setTimeout(() => particle.remove(), duration * 1000);
    }
}

// إنشاء جزيئات عند تحريك الماوس
document.addEventListener('mousemove', (e) => {
    if (Math.random() > 0.98) {
        createParticles(1, 'random');
    }
});

// ============================================
// تبويبات الجوال
// ============================================
function setupMobileTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // إزالة active من جميع التبويبات
            tabButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.panel, .preview-container').forEach(panel => {
                panel.classList.remove('active');
            });
            
            // إضافة active للتبويب المختار
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // تفعيل التبويب الأول افتراضياً
    if (window.innerWidth <= 768) {
        document.getElementById('html-tab').classList.add('active');
        tabButtons[0].classList.add('active');
    }
}

// ============================================
// اختصارات لوحة المفاتيح - Keyboard Shortcuts
// ============================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S: حفظ
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCodeToLocalStorage();
        showNotification('تم الحفظ! ✓');
    }
    
    // Ctrl/Cmd + L: مسح الكل
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        clearBtn.click();
    }
    
    // Ctrl/Cmd + E: تصدير
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportBtn.click();
    }
    
    // Ctrl/Cmd + I: استيراد
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        importBtn.click();
    }
    
    // Ctrl/Cmd + Enter: تشغيل/تحديث المعاينة
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        updatePreview();
        showNotification('تم تحديث المعاينة! 🔄');
    }
});

// ============================================
// إشعارات سريعة
// ============================================
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 6px;
        z-index: 10000;
        animation: slideIn 0.3s ease forwards;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        font-weight: 600;
    `;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ============================================
// تهيئة التطبيق
// ============================================
function initApp() {
    initTheme();
    initEditors();
    loadCodeFromLocalStorage();
    setupMobileTabs();
    setTimeout(setupConsoleInterception, 200);
    createParticles(5, 'stars');
    showNotification('مرحباً بك في Codethd! 👋');
}

// بدء التطبيق
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ============================================
// معلومات التطبيق في Console
// ============================================
console.log(
    '%cمرحباً بك في Codethd 👋',
    'font-size: 20px; font-weight: bold; color: #667eea;'
);
console.log(
    '%cمحرر الكود الاحترافي - Professional Code Editor',
    'font-size: 14px; color: #764ba2;'
);
console.log(
    '%c\n⌨️ اختصارات لوحة المفاتيح:\nCtrl+S أو Cmd+S : حفظ الكود\nCtrl+L أو Cmd+L : مسح الكل\nCtrl+E أو Cmd+E : تصدير\nCtrl+I أو Cmd+I : استيراد\nCtrl+Enter : تحديث المعاينة',
    'font-size: 12px; color: #888; font-family: monospace;'
);

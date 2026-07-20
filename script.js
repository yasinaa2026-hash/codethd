// ============================================
// إدارة الوضع الليلي والفاتح
// ============================================
const themeToggle = document.getElementById('themeToggle');
const htmlCode = document.getElementById('html-code');
const cssCode = document.getElementById('css-code');
const jsCode = document.getElementById('js-code');
const previewArea = document.getElementById('preview-area');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const particlesContainer = document.getElementById('particles');

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
// تحديث المعاينة - Preview Update
// ============================================
function updatePreview() {
    try {
        const html = htmlCode.value;
        const css = cssCode.value;
        const js = jsCode.value;
        
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

// تحديث المعاينة عند تغيير الكود
[htmlCode, cssCode, jsCode].forEach(el => {
    el.addEventListener('input', () => {
        updatePreview();
        saveCodeToLocalStorage();
    });
});

// ============================================
// حفظ واسترجاع الكود من LocalStorage
// ============================================
function saveCodeToLocalStorage() {
    localStorage.setItem('codethd-html', htmlCode.value);
    localStorage.setItem('codethd-css', cssCode.value);
    localStorage.setItem('codethd-js', jsCode.value);
}

function loadCodeFromLocalStorage() {
    const savedHtml = localStorage.getItem('codethd-html');
    const savedCss = localStorage.getItem('codethd-css');
    const savedJs = localStorage.getItem('codethd-js');
    
    if (savedHtml) htmlCode.value = savedHtml;
    if (savedCss) cssCode.value = savedCss;
    if (savedJs) jsCode.value = savedJs;
    
    updatePreview();
}

// ============================================
// زر مسح الكل
// ============================================
clearBtn.addEventListener('click', () => {
    if (confirm('هل تريد حقاً مسح جميع الأكواد؟ لا يمكن التراجع عن هذا!')) {
        htmlCode.value = '';
        cssCode.value = '';
        jsCode.value = '';
        localStorage.removeItem('codethd-html');
        localStorage.removeItem('codethd-css');
        localStorage.removeItem('codethd-js');
        updatePreview();
        createParticles(15, 'stars');
    }
});

// ============================================
// زر تنزيل HTML
// ============================================
exportBtn.addEventListener('click', () => {
    const html = htmlCode.value;
    const css = cssCode.value;
    const js = jsCode.value;
    
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
    </script>
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
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (Math.random() > 0.98) {
        createParticles(1, 'random');
    }
});

// إنشاء جزيئات عند الضغط على الأزرار
[clearBtn, exportBtn, themeToggle].forEach(btn => {
    btn.addEventListener('click', () => {
        createParticles(5, 'random');
    });
});

// ============================================
// تأثيرات متقدمة - Advanced Animations
// ============================================

// تأثير Ripple عند الضغط على الأزرار
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// ============================================
// Keyboard Shortcuts
// ============================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S: حفظ (منع الحفظ الافتراضي)
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
// اختصارات لوحة المفاتيح - مساعدة
// ============================================
const showHelp = () => {
    const helpText = `
اختصارات لوحة المفاتيح:
━━━━━━━━━━━━━━━━━━━━━━━━
Ctrl+S أو Cmd+S : حفظ الكود
Ctrl+L أو Cmd+L : مسح الكل
Ctrl+E أو Cmd+E : تصدير HTML
━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    console.log(helpText);
};

// ============================================
// تهيئة التطبيق
// ============================================
function initApp() {
    initTheme();
    loadCodeFromLocalStorage();
    createParticles(5, 'stars');
    showNotification('مرحباً بك في Codethd! 👋');
}

// بدء التطبيق
initApp();

// ============================================
// إضافة Tooltips للأزرار
// ============================================
const addTooltips = () => {
    clearBtn.title = 'مسح جميع الأكواد (Ctrl+L)';
    exportBtn.title = 'تنزيل ملف HTML (Ctrl+E)';
    themeToggle.title = 'تبديل الوضع الليلي/الفاتح';
};

addTooltips();

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
    '%cللمزيد من المعلومات، اكتب: showHelp()',
    'font-size: 12px; color: #888;'
);

// إتاحة showHelp في Console
window.showHelp = showHelp;

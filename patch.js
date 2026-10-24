/* ============================================================
   MiveYar — Professional Patch v1
   - پشتیبان‌گیری هفتگی خودکار
   - سرعت (حذف افکت‌های سنگین از لیست‌ها)
   - حس اپ موبایل (لمس، فونت، فشار دکمه)
   ============================================================ */
(function(){
  'use strict';

  /* ---------- سرعت + حس اپ ---------- */
  var css = document.createElement('style');
  css.id = 'patch-css';
  css.textContent =
    '*{-webkit-tap-highlight-color:transparent}' +
    'body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}' +
    '@supports (-webkit-touch-callout:none){input,select,textarea{font-size:max(16px,1em)}}' +
    '.dcard,.drow,.table-wrap,.table-wrap td,.toast,.item-row,.shop-actions,.fsum,.dled,.im-chip,.mc,.mb-c{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
    'body.dm .hb-track{animation-play-state:paused!important}' +
    '.content,.modal-box,.dlist{-webkit-overflow-scrolling:touch}' +
    '.btn:active{transform:scale(.97);transition:transform .08s}' +
    '.dcard,.drow,.money-box,.stat{transition-duration:.12s!important}';
  document.head.appendChild(css);

  /* ---------- پشتیبان هفتگی خودکار ---------- */
  var BK_KEY = 'miveyar_last_bk';
  var BK_SNOOZE = 'miveyar_bk_snooze';
  var DAY = 86400000;

  function getDB() {
    try {
      var raw = localStorage.getItem('roohollah_store_db_v2');
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  function counts() {
    var d = getDB();
    if (!d) return { days: 0, inv: 0, debt: 0 };
    var days = new Set(
      Object.keys(d.daily || {})
        .concat(Object.values(d.shopping || {}).map(function(x){return x.date}))
        .concat(Object.keys(d.financial || {}))
    ).size;
    return {
      days: days,
      inv: Object.keys(d.invoices || {}).length,
      debt: Object.keys(d.debts || {}).length
    };
  }

  function download() {
    try {
      var db = getDB();
      if (!db) { if (typeof toast === 'function') toast('داده‌ای برای پشتیبان نیست','error'); return; }
      var design = null, cx = null;
      try { var dr = localStorage.getItem('roohollah_design'); if (dr) design = JSON.parse(dr); } catch(e){}
      try { var cr = localStorage.getItem('roohollah_cx'); if (cr) cx = JSON.parse(cr); } catch(e){}
      var payload = { version:3, debtsV:5, layoutV2:true, exportedAt:new Date().toISOString(), db:db, design:design||{}, cx:cx||{} };
      var blob = new Blob([JSON.stringify(payload)], { type:'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      var d = new Date(), p = function(n){return String(n).padStart(2,'0')};
      a.download = 'miveyar_backup_' + d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 5000);
      localStorage.setItem(BK_KEY, String(Date.now()));
      if (typeof toast === 'function') toast('پشتیبان دانلود شد ✅');
      hide();
    } catch(e) {
      if (typeof toast === 'function') toast('پشتیبان‌گیری انجام نشد','error');
    }
  }

  function snooze() {
    localStorage.setItem(BK_SNOOZE, String(Date.now() + 3*DAY));
    hide();
  }

  function hide() {
    var b = document.getElementById('bkBanner');
    if (b) b.remove();
  }

  function show() {
    if (document.getElementById('bkBanner')) return;
    var last = Number(localStorage.getItem(BK_KEY) || 0);
    var snoozeUntil = Number(localStorage.getItem(BK_SNOOZE) || 0);
    if (Date.now() < snoozeUntil) return;
    if (last && (Date.now() - last) < 7*DAY) return;

    var c = counts();
    if (c.days + c.inv + c.debt === 0) return;

    var days = last ? Math.floor((Date.now()-last)/DAY) : null;

    var b = document.createElement('div');
    b.id = 'bkBanner'; b.dir = 'rtl';
    b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:950;padding:14px 16px;border-radius:18px;background:linear-gradient(135deg,#3981f5,#7758f6);color:#fff;box-shadow:0 12px 32px rgba(57,129,245,.4);font-family:inherit';
    b.innerHTML =
      '<div style="display:flex;align-items:flex-start;gap:10px">' +
        '<div style="font-size:24px;line-height:1">🛡️</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:800;font-size:15px;margin-bottom:4px">پشتیبان بگیر</div>' +
          '<div style="font-size:12.5px;opacity:.9;line-height:1.7">' +
            (days === null ? 'هنوز از اطلاعاتت پشتیبان نگرفتی' : days + ' روز از آخرین پشتیبان گذشته') +
            '<br>' + c.days + ' روز • ' + c.inv + ' فاکتور • ' + c.debt + ' طلب' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px">' +
        '<button id="bkNowBtn" style="flex:1;border:0;border-radius:12px;padding:11px;font:inherit;font-weight:800;font-size:14px;background:#fff;color:#3981f5;cursor:pointer">💾 دانلود پشتیبان</button>' +
        '<button id="bkLaterBtn" style="flex:0 0 auto;border:0;border-radius:12px;padding:11px 14px;font:inherit;font-weight:700;font-size:13px;background:rgba(255,255,255,.22);color:#fff;cursor:pointer">بعداً</button>' +
      '</div>';
    document.body.appendChild(b);
    document.getElementById('bkNowBtn').onclick = download;
    document.getElementById('bkLaterBtn').onclick = snooze;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(show, 1800); });
  } else {
    setTimeout(show, 1800);
  }

  var lastCheck = 0;
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden && Date.now() - lastCheck > 60000) {
      lastCheck = Date.now();
      show();
    }
  });
/* ---------- انیمیشن‌های حرفه‌ای و حس اپلیکیشن ---------- */
var cssAnim = document.createElement('style');
cssAnim.textContent =
  'html{scroll-behavior:smooth}' +
  
  /* انیمیشن باز شدن پنجره‌ها (فنری) */
  '@keyframes proModalPop{0%{opacity:0;transform:scale(0.85) translateY(20px)}100%{opacity:1;transform:scale(1) translateY(0)}}' +
  '.modal.show .modal-box{animation:proModalPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards!important}' +
  
  /* انیمیشن عوض شدن تب‌ها (محو و بالا آمدن) */
  '@keyframes proTabFade{0%{opacity:0;transform:translateY(15px)}100%{opacity:1;transform:translateY(0)}}' +
  '.tab.active{animation:proTabFade 0.3s ease-out forwards!important}' +
  
  /* افکت لمس روی دکمه‌ها و کارت‌ها */
  '.btn:active, .mi:active, .stat:active, .dcard:active, .drow:active{transform:scale(0.94)!important;transition:transform 0.05s!important}' +
  '.btn, .mi, .stat, .dcard, .drow{transition:transform 0.15s ease-out, box-shadow 0.2s ease-out}' +
  
  /* افکت شناور شدن کارت‌ها (فقط برای دسکتاپ و هاور) */
  '@media(hover:hover){.stat:hover, .dcard:hover, .drow:hover{transform:translateY(-3px);box-shadow:0 12px 25px rgba(0,0,0,0.15)}}' +
  
  /* انیمیشن پیام‌های پایین صفحه (Toast) */
  '@keyframes proToastUp{0%{opacity:0;transform:translateY(30px) scale(0.9)}100%{opacity:1;transform:translateY(0) scale(1)}}' +
  '.toast.show{animation:proToastUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards!important;transition:none!important}' +
  
  /* نرم کردن تغییر صفحات */
  '#main, .content { transform: translateZ(0); will-change: transform, opacity; }';
document.head.appendChild(cssAnim);
   /* ---------- سیستم نجات داده‌ها (نسخه پشتیبان نامرئی) ---------- */
var SHADOW_KEY = 'miveyar_shadow_db';
var MAIN_KEY = 'roohollah_store_db_v2';

// ۱. بازیابی خودکار در صورت پاک شدن یا خراب شدن داده اصلی
try {
  var mainData = localStorage.getItem(MAIN_KEY);
  var shadowData = localStorage.getItem(SHADOW_KEY);
  
  // اگر دیتای اصلی نیست یا خیلی کوچیکه (خراب شده)، ولی دیتای سایه داریم
  if ((!mainData || mainData.length < 20) && shadowData && shadowData.length > 20) {
    localStorage.setItem(MAIN_KEY, shadowData);
    setTimeout(function() {
      if (typeof toast === 'function') {
        toast('اطلاعات شما به طور خودکار بازیابی شد ✅');
      }
    }, 2000);
  }
} catch(e) {}

// ۲. ذخیره خودکار در سایه (هر ۳۰ ثانیه)
setInterval(function() {
  try {
    var mainData = localStorage.getItem(MAIN_KEY);
    if (mainData && mainData.length > 20) {
      localStorage.setItem(SHADOW_KEY, mainData);
    }
  } catch(e) {}
}, 30000);

// ۳. ذخیره سایه زمان بستن یا مینیمایز شدن برنامه
window.addEventListener('beforeunload', function() {
  try {
    var mainData = localStorage.getItem(MAIN_KEY);
    if (mainData && mainData.length > 20) {
      localStorage.setItem(SHADOW_KEY, mainData);
    }
  } catch(e) {}
});
   /* ---------- ۱. جست‌وجوی فوق‌هوشمند (فارسی‌فهم) ---------- */
if (typeof window.gsSearch === 'function') {
  var originalGsSearch = window.gsSearch;
  window.gsSearch = function(raw) {
    if (!raw) return originalGsSearch(raw);
    
    // تابع نرمال‌سازی متن (یکسان‌سازی ی/ک، حذف نیم‌فاصله و اعراب)
    var normalize = function(str) {
      return String(str || '')
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/[\u064B-\u065F]/g, '') // حذف اعراب
        .replace(/[\u200c\u200f\u200e]/g, ' ') // تبدیل نیم‌فاصله به فاصله
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .trim();
    };
    
    var normRaw = normalize(raw);
    if (!normRaw) return originalGsSearch(raw);
    
    var toks = normRaw.split(' ');
    var hit = function(h) {
      var t = normalize(h);
      return toks.every(function(k) { return t.indexOf(k) > -1; });
    };
    
    // کپی از منطق جست‌وجوی اصلی برای اعمال نرمال‌سازی
    var G = {"🧾 فاکتورها": [], "🛒 خریدها": [], "🤝 طلب‌ها": [], "📅 روزها": []};
    
    try {
      // ۱. فاکتورها
      var P = new Map();
      Object.values(window.db.invoices || {}).sort(function(a,b){ return b.date.localeCompare(a.date); }).forEach(function(x) {
        var itemNames = (x.items || []).map(function(i){return i.name;}).join(' ');
        if (!hit([x.person, x.date, x.total, x.settled ? "تسویه شد" : "", itemNames].join(" "))) return;
        var k = typeof pkey === 'function' ? pkey(x.person) : x.person;
        var o = P.get(k) || {person:x.person, open:0, done:0, sum:0};
        if (x.settled) o.done++; else o.open++;
        o.sum += Number(x.total) || 0;
        P.set(k, o);
      });
      P.forEach(function(o, k) {
        G["🧾 فاکتورها"].push({ a:"person", id:k, t:o.person, s:[o.open ? fmt(o.open)+" باز" : "", o.done ? fmt(o.done)+" تسویه‌شده" : ""].filter(Boolean).join(" • ")+" • "+money(o.sum) });
      });
      
      // ۲. خریدها
      Object.values(window.db.shopping || {}).sort(function(a,b){ return b.date.localeCompare(a.date); }).forEach(function(x) {
        var itemNames = (x.items || []).map(function(i){return i.name+" "+(i.seller||"");}).join(' ');
        if (hit([x.date, x.total, itemNames].join(" "))) {
          G["🛒 خریدها"].push({ a:"shop", id:x.id, t:"خرید "+fa(x.date), s:money(x.total)+" • "+ (x.items||[]).slice(0,3).map(function(i){return i.name;}).join("، ") });
        }
      });
      
      // ۳. طلب‌ها
      Object.values(window.db.debts || {}).forEach(function(x) {
        if (hit([x.name, x.amount, x.date, x.due, x.settled ? "تسویه" : "باز"].join(" "))) {
          G["🤝 طلب‌ها"].push({ a:"debt", id:x.id, t:x.name, s:money(x.amount)+(x.settled ? " • تسویه شده" : " • باز") });
        }
      });
      
      // ۴. روزها
      if (typeof dailyDates === 'function' && typeof daily === 'function') {
        dailyDates().sort(function(a,b){ return b.localeCompare(a); }).forEach(function(d) {
          var x = daily(d);
          if (hit([d, x.buy, x.sale].join(" "))) {
            G["📅 روزها"].push({ a:"day", id:d, t:"روز "+fa(d), s:"خرید "+money(x.buy)+" • فروش "+money(x.sale) });
          }
        });
      }
    } catch(e) {
      return originalGsSearch(raw); // در صورت خطا، به حالت عادی برگرد
    }
    return G;
  };
}

/* ---------- ۲. دکمه شناور (FAB) برای دسترسی سریع ---------- */
var cssFab = document.createElement('style');
cssFab.textContent =
  '#quickFab{position:fixed;bottom:calc(85px + env(safe-area-inset-bottom,0px));left:20px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3981f5,#7758f6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;box-shadow:0 8px 25px rgba(57,129,245,.5);z-index:900;cursor:pointer;transition:transform .2s;border:none}' +
  '#quickFab:active{transform:scale(.9)}' +
  '#quickMenu{position:fixed;bottom:calc(150px + env(safe-area-inset-bottom,0px));left:20px;display:flex;flex-direction:column;gap:10px;z-index:899;opacity:0;pointer-events:none;transform:translateY(20px);transition:.25s}' +
  '#quickMenu.show{opacity:1;pointer-events:auto;transform:translateY(0)}' +
  '.q-item{display:flex;align-items:center;gap:8px;background:#fff;color:#333;padding:10px 16px;border-radius:30px;font-size:14px;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,.15);cursor:pointer;text-decoration:none;border:1px solid #eee}' +
  'body.glass3 .q-item{background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.3);backdrop-filter:blur(10px)}' +
  '@keyframes qPop{0%{transform:scale(0)}100%{transform:scale(1)}}';
document.head.appendChild(cssFab);

var fab = document.createElement('button');
fab.id = 'quickFab';
fab.innerHTML = '+';

var qMenu = document.createElement('div');
qMenu.id = 'quickMenu';
qMenu.innerHTML = 
  '<div class="q-item" data-tab="shopping"><span>🛒</span> ثبت خرید جدید</div>' +
  '<div class="q-item" data-tab="daily"><span>📅</span> ثبت فروش روز</div>' +
  '<div class="q-item" data-tab="invoices"><span>🧾</span> فاکتور جدید</div>';

document.body.appendChild(fab);
document.body.appendChild(qMenu);

fab.addEventListener('click', function() {
  qMenu.classList.toggle('show');
  fab.style.transform = qMenu.classList.contains('show') ? 'rotate(45deg)' : 'none';
});

qMenu.querySelectorAll('.q-item').forEach(function(item) {
  item.addEventListener('click', function() {
    var tabId = this.getAttribute('data-tab');
    qMenu.classList.remove('show');
    fab.style.transform = 'none';
    if (typeof window.show === 'function') window.show(tabId);
    if (typeof A !== 'undefined' && A[tabId] === undefined) {
       // اگر تب باز شد، حالا دکمه افزودن کالا/ریست را هم شبیه‌سازی کنیم
       if(tabId === 'shopping' && typeof resetShop === 'function') resetShop();
       if(tabId === 'invoices' && typeof resetInv === 'function') resetInv();
    }
  });
});
  console.log('[Patch] v1 ready ✅');
})();

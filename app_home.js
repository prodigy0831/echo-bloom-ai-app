/* app_home.js */
'use strict';

/* ==========================
   전역 엘리먼트 / 기본 설정
========================== */
const app = document.getElementById('app');

// 엔드포인트 (필요 시 변경)
const QUOTE_API = '/api/next-quote';
const TRANSCRIPT_API = '/api/transcript';
const ASR_API = '/api/asr';

/* ==========================
   뷰 전환 / 라우팅
========================== */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const view = btn.dataset.view;

  // 읽기 시작! → 현재 문장 저장 후 read 뷰 AJAX 로드
  if (view === 'read') {
    const currentQuoteEl =
      document.getElementById('quoteText') || document.querySelector('.bubble > div');
    if (currentQuoteEl) {
      localStorage.setItem('currentQuote', currentQuoteEl.innerHTML);
    }
    loadView('read');
    return;
  }

  if (view) {
    e.preventDefault();
    loadView(view);
  }
});

// view → 파일 매핑
function viewToUrl(viewName){
  switch(viewName){
    case 'bookmark': return 'views/bookmark.html';
    case 'custom'  : return 'views/custom.html';
    case 'read'    : return 'views/read.html';
    case 'correct'    : return 'views/correct.html';
    default        : return null;
  }
}

async function loadView(viewName){
  await transitionOut();

  const url = viewToUrl(viewName);
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();

    app.innerHTML = html;

    
    // read 화면: 문장 주입 + 음성 인식 초기화
    if (viewName === 'read') {
      const saved = localStorage.getItem('currentQuote');
      const target = app.querySelector('#readQuote');
      if (target) {
        target.innerHTML = saved && saved.trim() ? saved : '문장을 불러오지 못했습니다.';
      }
      initReadVoice();
    }
  } catch (err) {
    app.innerHTML = `
      <section style="padding:24px">
        <div class="bubble">뷰 <b>${viewName}</b>를 불러오는 중 오류가 발생했어요.</div>
      </section>`;
    console.error('Load failed:', err);
  }

// app.innerHTML = html; 다음에 분기 추가
if (viewName === 'bookmark') {
  initBookmarkView(); // ✅ 북마크 화면 초기화
}

// app.innerHTML = html; 다음 분기들 사이에 추가
if (viewName === 'custom') {
  initCustomView();
}

if (viewName === 'correct') {
  initCorrectView(); // ✅ 아래 함수
}

  transitionIn();
}

function transitionOut(){
  return new Promise((resolve)=>{
    app.classList.add('leaving');
    app.classList.remove('entered','entering');
    setTimeout(resolve, 250);
  });
}
function transitionIn(){
  app.classList.add('entering');
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      app.classList.remove('leaving','entering');
      app.classList.add('entered');
    });
  });
}

/* ==========================
   헤더: 쿠키 → 이름/아바타
========================== */
function getCookie(name) {
  const m = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\/+^])/g, '\\$1') + '=([^;]*)')
  );
  return m ? decodeURIComponent(m[1]) : null;
}

function setUsernameFromCookie(){
  const nameKeys = ['user_name','username','name'];
  let nameVal = null;
  for (const k of nameKeys){
    nameVal = getCookie(k);
    if (nameVal) break;
  }
  const el = document.getElementById('username');
  if (!el) return;
  el.textContent = (nameVal && nameVal.trim()) ? `${nameVal.trim()}님` : 'USER님';
}

function setAvatarFromCookie(){
  const avatarKeys = ['user_avatar','profileImage','avatar'];
  let url = null;
  for (const k of avatarKeys){
    url = getCookie(k);
    if (url) break;
  }
  const avatarEl = document.getElementById('profileAvatar');
  if (!avatarEl) return;

  if (url && /^https?:\/\//i.test(url)){
    avatarEl.innerHTML = '';
    const img = document.createElement('img');
    img.src = url;
    img.alt = '프로필 이미지';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.borderRadius = '50%';
    img.style.objectFit = 'cover';
    avatarEl.appendChild(img);
  }
}

// 초기화(헤더)
(function initHeader(){
  setUsernameFromCookie();
  setAvatarFromCookie();
})();

/* ==========================
   음악 재생/일시정지 토글
========================== */
// <audio id="bgMusic" src="music/music.mp4" loop></audio> 필요
const musicToggle = document.getElementById('musicToggle');
const musicIcon = document.getElementById('musicIcon');
const bgMusic = document.getElementById('bgMusic');

if (musicToggle && musicIcon && bgMusic) {
  musicToggle.addEventListener('click', () => {
    if (bgMusic.paused) {
      bgMusic.play();
      musicIcon.innerHTML = `
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      `;
      musicToggle.setAttribute('aria-label', '음악 일시정지');
    } else {
      bgMusic.pause();
      musicIcon.innerHTML = `<polygon points="6,4 20,12 6,20" />`;
      musicToggle.setAttribute('aria-label', '음악 재생');
    }
  });
}

/* ==========================
   NEXT: 서버 문장 로드 + 폴백
========================== */
const FALLBACK_QUOTES = [
  '“어려워도 괜찮아.<br/>나는 희망을 찾을 수 있을 거야!”',
  '“말하기 테스트용”',
  '“로딩 실패시 송출되는 테스트 문장 - <br/>지금의 너도 충분히 잘하고 있어.”',
  '“로딩 실패시 송출되는 테스트 문장 -<br/>어둠 속에서도 작은 빛은 늘 있어.”',
  '“로딩 실패시 송출되는 테스트 문장 -<br/>천천히 가도 괜찮아, 멈추지만 않으면 돼.”',
  '“로딩 실패시 송출되는 테스트 문장 -<br/>오늘의 수고가 내일의 힘이 될 거야.”',
  '“로딩 실패시 송출되는 테스트 문장 -<br/>이제 할 말이 없음 걍 열심히 살아라”'
];
let fallbackIdx = 0;

function getQuoteEl(){
  return document.getElementById('quoteText');
}

function setQuote(text){
  const el = getQuoteEl();
  if (!el) return;
  el.innerHTML = text.replace(/\n/g, '<br/>');
}
function showFallback(){
  setQuote(FALLBACK_QUOTES[fallbackIdx]);
  fallbackIdx = (fallbackIdx + 1) % FALLBACK_QUOTES.length;
}
function fetchWithTimeout(url, opts={}, ms=5000){
  return Promise.race([
    fetch(url, opts),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
  ]);
}

// ✅ 초기 진입 시 자동으로 한 번 불러오기
async function loadInitialQuote(){
  // (옵션) 로딩 표시
  setQuote('불러오는 중…');

  try {
    const res = await fetchWithTimeout(QUOTE_API, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error('bad-status ' + res.status);
    const data = await res.json().catch(() => ({}));
    const text = (data && typeof data.text === 'string') ? data.text.trim() : '';
    if (text) setQuote(text);
    else showFallback();
  } catch (e) {
    showFallback();
    console.error('initial quote load failed:', e);
  }
}

// 기존 next 버튼용 로더(유지)
async function loadNextQuote(btn){
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  try {
    const res = await fetchWithTimeout(QUOTE_API, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error('bad-status ' + res.status);
    const data = await res.json().catch(() => ({}));
    const text = (data && typeof data.text === 'string') ? data.text.trim() : '';
    if (text) setQuote(text);
    else showFallback();
  } catch (e) {
    showFallback();
    console.error('quote load failed:', e);
  } finally {
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
  }
}

// next 버튼 핸들러(유지)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button.next');
  if (!btn) return;
  loadNextQuote(btn);
});

// 🔔 페이지 로드(혹은 스크립트 실행) 시 즉시 1회 호출
// 스크립트를 <head defer>로 넣었거나 </body> 직전에 넣었다면 아래 한 줄이면 충분
loadInitialQuote();
// 만약 타이밍 이슈가 있다면 아래처럼 바꿔도 됨:
// window.addEventListener('DOMContentLoaded', loadInitialQuote);


/* ==========================
   음성 인식 / 서버 전송 유틸
========================== */
function getSessionId(){
  let sid = localStorage.getItem('voice_session_id');
  if (!sid) {
    sid = 'vs_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('voice_session_id', sid);
  }
  return sid;
}

const TRANSCRIPT_QUEUE_KEY = 'pending_transcripts_v1';
function queuePush(payload){
  const arr = JSON.parse(localStorage.getItem(TRANSCRIPT_QUEUE_KEY) || '[]');
  arr.push(payload);
  localStorage.setItem(TRANSCRIPT_QUEUE_KEY, JSON.stringify(arr));
}
async function flushQueue(){
  const arr = JSON.parse(localStorage.getItem(TRANSCRIPT_QUEUE_KEY) || '[]');
  if (!arr.length) return;
  const rest = [];
  for (const p of arr) {
    try {
      await postJSON(TRANSCRIPT_API, p);
    } catch {
      rest.push(p);
    }
  }
  localStorage.setItem(TRANSCRIPT_QUEUE_KEY, JSON.stringify(rest));
}
window.addEventListener('online', flushQueue);

async function postJSON(url, body, tries=2){
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (tries > 0) return postJSON(url, body, tries-1);
    throw new Error('bad-status ' + res.status);
  }
  return res.json().catch(() => ({}));
}

async function sendTranscript({ text, is_final, quote, extra }){
  const payload = {
    text,
    is_final: !!is_final,
    quote: quote || null,
    user: getCookie('user_name') || getCookie('username') || null,
    session_id: getSessionId(),
    ts: new Date().toISOString(),
    ...extra
  };

  if (!navigator.onLine) { queuePush(payload); return; }

  try {
    await postJSON(TRANSCRIPT_API, payload);
  } catch (e) {
    queuePush(payload);
  }
}

/* ==========================
   read 전용: 음성 인식 초기화
   (꽃 아이콘 버튼 반짝임: #micToggle.blink .mic-flower { animation: ... })
========================== */
/* ==========================
   read 전용: 음성 인식 초기화 (클라이언트 비교 + 분기)
========================== */
function initReadVoice(){
  const btn = app.querySelector('#micToggle');          // 꽃 버튼
  const flower = app.querySelector('#flowerIcon');      // <img id="flowerIcon" ...>
  const transcriptEl = app.querySelector('#transcript');
  const readQuoteRaw = (app.querySelector('#readQuote')?.innerText || '').trim();
  if (!btn) return;

  let isListening = false;

  // ---------- 유틸: 텍스트 정규화 & 유사도 ----------
  const normalize = (s) => {
    if (!s) return '';
    return s
      .replace(/[“”"']/g, '')        // 따옴표 제거
      .replace(/<br\s*\/?>/gi, ' ')  // (예방적) BR 제거
      .replace(/\s+/g, ' ')          // 공백 정리
      .replace(/[.,!?;:()\[\]{}~\-_/\\]/g, '') // 구두점 제거(필요시 조정)
      .trim()
      .toLowerCase()
      .normalize('NFKC');
  };

  // 레벤슈타인 거리
  const levenshtein = (a, b) => {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = new Array(n + 1);
    for (let j = 0; j <= n; j++) dp[j] = j;
    for (let i = 1; i <= m; i++) {
      let prev = dp[0]; dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const tmp = dp[j];
        dp[j] = Math.min(
          dp[j] + 1,                   // deletion
          dp[j - 1] + 1,               // insertion
          prev + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
        );
        prev = tmp;
      }
    }
    return dp[n];
  };

  const isMatch = (expected, spoken) => {
    const A = normalize(expected);
    const B = normalize(spoken);
    if (!A || !B) return false;
    if (A === B) return true;
    // 포함(부분 일치) 허용
    if (A.includes(B) || B.includes(A)) return true;
    // 유사도 90% 이상 허용
    const dist = levenshtein(A, B);
    const maxLen = Math.max(A.length, B.length);
    const sim = 1 - dist / Math.max(1, maxLen);
    return sim >= 0.9;
  };

  // ---------- 모달 ----------
  function showResultModal(ok, onRetry){
    // 기존 모달 제거
    const old = document.getElementById('read-result-modal');
    if (old) old.remove();

    const wrap = document.createElement('div');
    wrap.id = 'read-result-modal';
    wrap.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,.45); display: grid; place-items: center;
    `;
    wrap.innerHTML = `
      <div style="background:#fff; color:#222; width:min(90vw,360px); border-radius:16px; padding:18px; box-shadow:0 10px 30px rgba(0,0,0,.25); text-align:center;">
        <div style="font-weight:700; font-size:1rem; margin-bottom:8px;">
          ${ok ? '정확해요! 잘 읽었어요 🌟' : '조금만 더 정확히 읽어볼까요?'}
        </div>
        ${ok ? '' : '<div style="font-size:.92rem; color:#555; margin-bottom:14px;">다시 시도하거나 홈으로 이동할 수 있어요.</div>'}
        <div style="display:flex; gap:8px; justify-content:center; margin-top:6px; flex-wrap:wrap;">
          ${ok ? `
            <button id="modal-ok" style="padding:8px 14px; border:none; background:#1a7a29; color:#fff; border-radius:999px; cursor:pointer;">계속</button>
          ` : `
            <button id="modal-retry" style="padding:8px 14px; border:none; background:#1a7a29; color:#fff; border-radius:999px; cursor:pointer;">다시 시도</button>
            <button id="modal-home"  style="padding:8px 14px; border:1px solid #ddd; background:#fff; color:#333; border-radius:999px; cursor:pointer;">홈으로</button>
          `}
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    if (ok) {
      wrap.querySelector('#modal-ok').addEventListener('click', () => {
        wrap.remove();
        // 일치면 correct.html로
        loadView('correct');
      });
    } else {
      wrap.querySelector('#modal-retry').addEventListener('click', () => {
        wrap.remove();
        onRetry && onRetry();
      });
      wrap.querySelector('#modal-home').addEventListener('click', () => {
        // 홈으로 (초기 화면 복귀)
        window.location.reload();
      });
      wrap.querySelector('#modal-close').addEventListener('click', () => {
        wrap.remove();
      });
    }
  }

  // ---------- 상태(반짝임) ----------
  const setState = (on) => {
    isListening = on;
    if (flower) flower.classList.toggle('glowing', on);
  };

  // ---------- Web Speech API 우선 ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    const recog = new SR();
    recog.lang = 'ko-KR';
    recog.interimResults = true;
    recog.continuous = true;

    let finalText = '';

    recog.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + ' ';
      }
      if (transcriptEl) transcriptEl.textContent = finalText.trim();
    };

    recog.onend = () => {
      if (!isListening) {
        const ok = isMatch(readQuoteRaw, finalText);
        setState(false);
        showResultModal(ok, () => { finalText = ''; recog.start(); setState(true); });
      } else {
        // 브라우저가 끊었는데 계속 듣는 상태면 재시작
        try { recog.start(); } catch {}
      }
    };

    btn.addEventListener('click', () => {
      if (!isListening) { finalText = ''; try { recog.start(); setState(true); } catch {} }
      else { setState(false); try { recog.stop(); } catch {} }
    });

    return; // STT 경로 사용
  }

  // ---------- 폴백: MediaRecorder → /api/asr 필요 없음 ----------
  // 서버 없이 비교하려면, 폴백에서는 브라우저가 텍스트를 못 만들어서
  // 클라이언트만으로는 "텍스트 변환"이 불가합니다.
  // (즉, 폴백을 쓰려면 /api/asr 같은 STT 서버가 필요)
  // 폴백을 잠시 비활성화하거나 안내를 띄우세요.
  btn.addEventListener('click', () => {
    if (!isListening) {
      setState(true);
      showResultModal(false, () => setState(false));
      console.warn('이 브라우저는 Web Speech API를 지원하지 않아, 클라이언트만으로 텍스트 비교가 어렵습니다.');
    } else {
      setState(false);
    }
  });
}

/* ─────────────────────────────────────────────
   correct 뷰: 문장 주입 + 북마크 토글 + 랜덤 응원 + 홈버튼
───────────────────────────────────────────── */

// 서버 엔드포인트: 여기서 서버 주소 바꿔주세용
const BOOKMARK_EXISTS_API = '/api/bookmarks/exists?text=';
const BOOKMARK_ADD_API    = '/api/bookmarks';
const BOOKMARK_DEL_API    = '/api/bookmarks';

/* 🔐 JWT 토큰 → Authorization 헤더 자동 부착 공통 래퍼 */
function getJwtToken() {
  // 우선순위: localStorage → sessionStorage → (읽을 수 있는) 쿠키
  const ls = localStorage.getItem('jwt') || localStorage.getItem('access_token');
  if (ls) return ls;

  const ss = sessionStorage.getItem('jwt') || sessionStorage.getItem('access_token');
  if (ss) return ss;

  // 쿠키명이 token일 때 (HttpOnly면 JS로 못 읽음)
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (m) return decodeURIComponent(m[1]);

  return null;
}

async function fetchJSONWithAuth(url, { method='GET', headers={}, body=null } = {}) {
  const token = getJwtToken();
  const h = new Headers(headers);
  if (token && !h.has('Authorization')) {
    h.set('Authorization', `Bearer ${token}`);
  }

  const init = { method, headers: h, cache: 'no-store' };
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    h.set('Content-Type', 'application/json');
    init.body = JSON.stringify(body);
  } else if (body) {
    init.body = body;
  }

  const res = await fetch(url, init);
  if (res.status === 401 || res.status === 403) throw new Error(`auth-failed ${res.status}`);
  if (!res.ok) {
    const txt = await res.text().catch(()=> '');
    throw new Error(`HTTP ${res.status} ${txt}`);
  }
  try { return await res.json(); } catch { return {}; }
}

/* SVG 아이콘 스왑 */
function setBookmarkIcon(active){
  const icon = app.querySelector('#bookmarkIcon');
  if (!icon) return;
  if (active) {
    // 활성: 꽉 찬 별
    icon.innerHTML = '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#f4c430"></path>';
  } else {
    // 비활성: 테두리 별
    icon.innerHTML = '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="none" stroke="#f4c430" stroke-width="2" stroke-linejoin="round"></path>';
  }
}

/* JWT 인증 붙여서 서버와 통신 */
async function checkBookmark(text){
  const url = BOOKMARK_EXISTS_API + encodeURIComponent(text);
  try {
    const data = await fetchJSONWithAuth(url, { method: 'GET' });
    return !!data.exists;
  } catch (e) {
    console.error('checkBookmark failed:', e);
    return false; // 실패 시 기본값
  }
}

async function addBookmark(text){
  await fetchJSONWithAuth(BOOKMARK_ADD_API, {
    method: 'POST',
    body: { text }
  });
}

async function removeBookmark(text){
  // 백엔드가 DELETE JSON을 받지 않으면, POST /bookmarks/delete 로 변경
  await fetchJSONWithAuth(BOOKMARK_DEL_API, {
    method: 'DELETE',
    body: { text }
  });
}

function pickRandomEncourage(){
  const LINES = [
    '멋져요! 오늘도 해냈네요!',
    '성공적으로 해냈어요! 긍정 에너지가 오늘 하루를 이끌어갈 거예요.',
    '훌륭해요! 마음속 긍정의 씨앗이 무럭무럭 자라고 있어요.',
    '해냈군요! 오늘도 스스로에게 좋은 습관을 선물했어요.',
    '성공! 당신이 믿는 대로 이루어질 거예요.',
    '잘했어요! 지금 한 마디가 당신을 더 강하게 만듭니다.',
    '축하해요! 오늘을 위한 긍정 에너지를 가득 채웠습니다.',
    '자신감이 느껴져요! 오늘도 하루를 멋지게 만들어봐요.',
    '성공! 이 에너지가 잠재의식 속에 깊이 새겨졌어요.',
    '잘했어요! 다음 문장도 기대되는데요?',
    '정말 좋아요! 듣는 저도 기분이 좋아지네요.',
    '성공! 이제 이 느낌을 그대로 즐겨보세요.',
    '퍼펙트! 오늘도 스스로에게 칭찬 한 번!',
    '성공이에요! 목소리에 힘이 실려 있네요.',
    '완벽해요! 목소리가 확신에 가득 차 있네요.'
  ];
  return LINES[Math.floor(Math.random()*LINES.length)];
}

function initCorrectView(){
  // 1) 문장 주입 (read에서 저장한 값 재사용)
  const saved = localStorage.getItem('currentQuote');
  const target = app.querySelector('#correctQuote');
  if (target) {
    target.innerHTML = saved && saved.trim() ? saved : '문장을 불러오지 못했습니다.';
  }

  // 2) 랜덤 응원 문구
  const encEl = app.querySelector('#encourageText');
  if (encEl) encEl.textContent = pickRandomEncourage();

  // 3) 홈으로
  const homeBtn = app.querySelector('#goHome');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // 4) 북마크 초기 상태 + 토글
  const quotePlain = (target?.innerText || '').trim();
  const toggleBtn = app.querySelector('#bookmarkToggle');
  if (!toggleBtn || !quotePlain) return;

  // 초기 상태 체크
  (async () => {
    const exists = await checkBookmark(quotePlain);
    toggleBtn.setAttribute('aria-pressed', exists ? 'true' : 'false');
    setBookmarkIcon(exists);
  })();

  // 토글
  toggleBtn.addEventListener('click', async () => {
    const nowActive = toggleBtn.getAttribute('aria-pressed') === 'true';

    // 낙관적 UI
    toggleBtn.setAttribute('aria-pressed', nowActive ? 'false' : 'true');
    setBookmarkIcon(!nowActive);

    try {
      if (nowActive) {
        await removeBookmark(quotePlain);  // 삭제
      } else {
        await addBookmark(quotePlain);     // 등록
      }
    } catch (e) {
      console.error('bookmark toggle failed:', e);
      // 실패 시 롤백
      toggleBtn.setAttribute('aria-pressed', nowActive ? 'true' : 'false');
      setBookmarkIcon(nowActive);

      // 간단 토스트
      const old = document.getElementById('bm-toast'); if (old) old.remove();
      const toast = document.createElement('div');
      toast.id = 'bm-toast';
      toast.textContent = '북마크 동기화에 실패했어요. 네트워크/로그인을 확인해 주세요.';
      toast.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#222;color:#fff;padding:10px 14px;border-radius:999px;font-size:.9rem;z-index:9999;';
      document.body.appendChild(toast);
      setTimeout(()=>toast.remove(), 2000);
    }
  });
}

function initBookmarkView(){
  const quoteEl = app.querySelector('#quoteText');      // 북마크 문장을 표시할 곳
  const nextBtn = app.querySelector('.bubble .next');   // 다음 북마크
  const ctaEl   = app.querySelector('.cta');            // 버튼 영역
  const readBtn = app.querySelector('[data-view="read"]');

  if (!quoteEl) return;

  // 상태
  let bookmarks = []; // 문자열 배열
  let idx = 0;

  // 렌더
  const render = () => {
    if (!bookmarks.length) {
      quoteEl.innerHTML = '저장된 북마크가 없어요.';
      if (nextBtn) nextBtn.disabled = true;

      // 👉 읽기 버튼 대신 홈 버튼 표시
      if (ctaEl) {
        ctaEl.innerHTML = `
          <button type="button" onclick="location.href='home.html'">홈으로</button>
        `;
      }
      return;
    }

    if (nextBtn) nextBtn.disabled = (bookmarks.length <= 1);

    const text = String(bookmarks[idx] ?? '').trim();
    quoteEl.innerHTML = text.replace(/\n/g, '<br/>');

    // 👉 북마크가 있으면 다시 읽기 버튼으로 복원
    if (ctaEl) {
      ctaEl.innerHTML = `
        <button type="button" data-view="read">읽기 시작!</button>
      `;
    }
  };

  // 북마크 불러오기
  (async () => {
    quoteEl.innerHTML = '불러오는 중…';

    try {
      let data;
      const token = getJwtToken();
      if (token) {
        data = await fetchJSONWithAuth(BOOKMARK_LIST_ME_API, { method: 'GET' });
      } else {
        const uid = getCookie('user_id') || getCookie('uid') || getCookie('id');
        if (!uid) throw new Error('NO_ID');
        data = await fetchJSONWithAuth(BOOKMARK_LIST_BYID_API(uid), { method: 'GET' });
      }

      if (Array.isArray(data)) {
        bookmarks = data.map(String);
      } else if (Array.isArray(data?.items)) {
        bookmarks = data.items.map(x => String(x.text ?? x.content ?? ''));
      } else {
        bookmarks = [];
      }
    } catch (e) {
      console.error('bookmark load failed:', e);
      bookmarks = [];
    } finally {
      render();
    }
  })();

  // 다음 버튼: 북마크 순환
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!bookmarks.length) return;
      idx = (idx + 1) % bookmarks.length;
      render();
    });
  }
  // 읽기 시작! → 기존 전역 핸들러가 #quoteText.innerHTML을 localStorage에 저장하고 read.html 로드
  // (이미 app_home.js에 구현되어 있으므로 별도 처리 불필요)
  // 단, 혹시 커스텀 저장을 강제하고 싶다면 아래 주석 해제:
  /*
  if (readBtn) {
    readBtn.addEventListener('click', () => {
      localStorage.setItem('currentQuote', quoteEl.innerHTML);
      loadView('read');
    });
  }
  */
}

// ===== 커스텀문장 API 엔드포인트(예시) =====
const CUSTOM_LIST_ME_API    = '/api/custom-sentences/me';                    // JWT 인증
const CUSTOM_LIST_BYID_API  = (uid) => `/api/users/${uid}/custom-sentences`; // 쿠키 id 기반

function initCustomView(){
  const quoteEl = app.querySelector('#quoteText');       // 커스텀 문장 표시 영역
  const nextBtn = app.querySelector('.bubble .next');    // 다음 문장
  const ctaEl   = app.querySelector('.cta');             // 버튼 영역
  const readBtn = app.querySelector('[data-view="read"]');
  if (!quoteEl) return;

  // 상태
  let customs = []; // 문자열 배열
  let idx = 0;

  // 렌더러
  const render = () => {
    if (!customs.length) {
      quoteEl.innerHTML = '저장된 커스텀 문장이 없어요.';
      if (nextBtn) nextBtn.disabled = true;

      // 👉 읽기 시작! 대신 홈 버튼 노출
      if (ctaEl) {
        ctaEl.innerHTML = `
          <button type="button" onclick="location.href='home.html'">홈으로</button>
        `;
      }
      return;
    }

    if (nextBtn) nextBtn.disabled = (customs.length <= 1);

    const text = String(customs[idx] ?? '').trim();
    quoteEl.innerHTML = text.replace(/\n/g, '<br/>');

    // 👉 커스텀 문장이 있으면 읽기 시작! 버튼 복원
    if (ctaEl) {
      ctaEl.innerHTML = `
        <button type="button" data-view="read">읽기 시작!</button>
      `;
    }
  };

  // 데이터 로드
  (async () => {
    quoteEl.innerHTML = '불러오는 중…';
    try {
      let data;
      const token = getJwtToken?.() || null;
      if (token) {
        data = await fetchJSONWithAuth(CUSTOM_LIST_ME_API, { method: 'GET' });
      } else {
        const uid = getCookie?.('user_id') || getCookie?.('uid') || getCookie?.('id');
        if (!uid) throw new Error('NO_ID');
        data = await fetchJSONWithAuth(CUSTOM_LIST_BYID_API(uid), { method: 'GET' });
      }

      // 응답 정규화
      if (Array.isArray(data)) {
        customs = data.map(String);
      } else if (Array.isArray(data?.items)) {
        customs = data.items.map(x => String(x.text ?? x.content ?? ''));
      } else {
        customs = [];
      }
    } catch (e) {
      console.error('custom list load failed:', e);
      customs = [];
    } finally {
      render();
    }
  })();

  // 다음 문장
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!customs.length) return;
      idx = (idx + 1) % customs.length;
      render();
    });
  }

  // 읽기 시작! 저장 후 read로 이동하는 별도 처리 필요 없으면 주석 유지 (전역 핸들러가 처리)
  /*
  if (readBtn) {
    readBtn.addEventListener('click', () => {
      localStorage.setItem('currentQuote', quoteEl.innerHTML);
      loadView('read');
    });
  }
  */
}


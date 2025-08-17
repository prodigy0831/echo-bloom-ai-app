/**
 * 마이페이지 데이터 로딩
 * - 서버에서 problems(배열), tone(문자열) 가져옴
 * - 실패 시 폴백 표시
 */
document.addEventListener('DOMContentLoaded', initMyPage);

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


async function initMyPage(){
  const DEFAULT_PROBLEMS = ['문제1', '문제2', '문제3'];   // <- 실패 시 임시 단어
  const DEFAULT_TONE     = '단호한 톤';                   // <- 실패 시 임시 톤

  const chipsEl = document.getElementById('problemChips');
  const toneEl  = document.getElementById('toneChip');

  // 로딩 상태
  renderProblems(chipsEl, ['로딩','중입','니다']); // 임시
  toneEl.textContent = '로딩 중…';

  try{
    // ========== 실제 서버 API 엔드포인트로 바꿔주세요 ============
    const res = await fetch('/api/mypage', { credentials:'include' });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();

    const probs = normalizeProblems(data?.problems, DEFAULT_PROBLEMS);
    renderProblems(chipsEl, probs);

    const tone = (typeof data?.tone === 'string' && data.tone.trim())
      ? data.tone.trim()
      : DEFAULT_TONE;
    toneEl.textContent = tone;

  }catch(err){
    // 실패 → 폴백
    renderProblems(chipsEl, DEFAULT_PROBLEMS);
    toneEl.textContent = DEFAULT_TONE;
    console.warn('[mypage] load failed, using fallback:', err);
  }
}

/* 배열 정제: 최소 3개로 보정하고, 문자열만 추림 */
function normalizeProblems(list, fallback){
  const arr = Array.isArray(list) ? list.filter(v => typeof v === 'string' && v.trim()) : [];
  const out = arr.slice(0,3);
  while(out.length < 3) out.push(fallback[out.length] ?? '문제');
  return out;
}

/* 칩 렌더: 4글자 + … 요약 */
function renderProblems(container, problems){
  container.innerHTML = '';
  problems.slice(0,3).forEach(p => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = summarize(p, 4);
    container.appendChild(chip);
  });
}

/* 안전 요약(유니코드 안전): 4글자 초과면 '…' 붙임 */
function summarize(str, limit){
  const units = Array.from(String(str).trim()); // surrogate/emoji 안전
  if (units.length <= limit) return units.join('');
  return units.slice(0, limit).join('') + '…';
}

/* ================= 링크 공유 관련 함수 =================== */
(function(){
  // ★ 원하는 링크로 바꾸세요
  const SHARE_URL = 'https://www.우리메인홈도메인.kr/';

  const card = document.getElementById('shareCard');
  const toast = document.getElementById('toast');

  card?.addEventListener('click', shareIt);
  card?.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); shareIt(); }
  });

  async function shareIt(){
    try{
      // 1) 지원되면 네이티브 공유창
      if (navigator.share) {
        await navigator.share({
          title: '에코블룸',
          text: '에코블룸을 함께 써봐요!',
          url: SHARE_URL
        });
        return;
      }
      // 2) 그렇지 않으면 클립보드 복사
      await copyToClipboard(SHARE_URL);
      showToast('링크가 복사되었어요');
    }catch(e){
      // 사용자가 공유 취소한 경우 등은 조용히 무시
      console.warn('share/copy canceled or failed:', e);
    }
  }

  async function copyToClipboard(text){
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text); // HTTPS 필요
    }
    // 비보안/레거시 폴백
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); }
    finally { document.body.removeChild(ta); }
  }

  function showToast(msg){
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(()=> toast.classList.remove('show'), 1800);
  }
})();
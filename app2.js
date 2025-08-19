// app2.js
document.addEventListener('DOMContentLoaded', () => {
  // 설문 임시 저장(새로고침하면 사라짐)
  window.__SURVEY__ = window.__SURVEY__ || { problems: [], tone: null };

  // 우상단 X(전역): 메인으로 이동
  const globalClose = document.getElementById('goBack');
  if (globalClose) {
    globalClose.addEventListener('click', (e) => {
      e.preventDefault();
      location.href = '../main.html';
    });
  }

  const stage = document.getElementById('stage');
  if (!stage) return;

  const TRANSITION = 250;

  async function swapInner(url){
    const current = stage.querySelector('.view');
    if (current) {
      current.classList.remove('entered','entering');
      current.classList.add('leaving');
    }

    let html = '';
    try{
      const res = await fetch(url, { headers:{'X-Requested-With':'XMLHttpRequest'} });
      if(!res.ok) throw new Error('load error');
      html = await res.text();
    }catch(e){
      html = `
        <div class="view entering">
          <h2 class="title">불러오지 못했어요 😢</h2>
          <div class="bottom">
            <a href="#" class="cta" id="retry">다시 시도</a>
          </div>
        </div>`;
    }

    setTimeout(() => {
      stage.innerHTML = html;
      const next = stage.querySelector('.view');
      if(next){
        next.classList.add('entering');
        requestAnimationFrame(()=> {
          requestAnimationFrame(()=> {
            next.classList.remove('entering');
            next.classList.add('entered');
            bindLocal(); // 새 요소 이벤트 다시 연결
          });
        });
      }
    }, TRANSITION);
  }

  function bindLocal(){

    const goSurvey = stage.querySelector('#goSurvey');
    if (goSurvey) {
      goSurvey.addEventListener('click', (e) => {
        e.preventDefault();
        swapInner('search2.html');
      });
    }

    // 에러시 재시도
    const retry = stage.querySelector('#retry');
    retry && retry.addEventListener('click', (e)=>{ e.preventDefault(); location.reload(); });

    // 단계별 초기화 (있을 때만 동작)
    initChoiceStep();        // search2 (다중 선택 1~3)
    initToneStep();          // search3 (단일 선택)
    initFinalStep();         // search4 (완료 전송)
  }

/*
 * 단계별 즉시 저장 버전!
 * - search2(문제 선택): 다음 클릭 시 즉시 서버 전송 (최소 1개, 최대 3개)
 * - search3(톤 선택): 다음 클릭 시 즉시 서버 전송 (이건 단일 값)
 * - search4(완료): 이미 저장된 값을 기반으로 바로 이동
 */

// ========================
// 서버 설정
// ========================
const API_URL = 'survey.php'; // 백엔드 URL여기에 넣어주시면 됩니다. 지금은 임시로 php파일 넣어뒀는데 작동은 잘 되네요!

// ✅ 톤 옵션을 가져올 API (예시: 필요에 맞게 수정)
const TONES_API = 'survey.php?action=tones'; // or '/api/survey/tones'

// ✅ 서버 실패 시 사용할 기본 톤 옵션
const DEFAULT_TONES = [
  { value: 'tone1', label: '“나는 어떤 어려움 속에서도 희망을 찾을 수 있어.”' },
  { value: 'tone2', label: '“어려워도 괜찮아, 나는 희망을 찾을 수 있을 거야.”' },
  { value: 'tone3', label: '“어떤 어려움도 나를 꺾을 수 없다, 나는 반드시 희망을 찾아낼 것이다.”' },
];


// ========================
// 아래가 서버 전송용 함수
// ========================
async function postSurvey(partial){
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    credentials: 'same-origin',
    body: JSON.stringify(partial)
  });
  if (!res.ok) {
    const msg = await res.text().catch(()=> 'server error');
    throw new Error(msg || 'server error');
  }
  return res;
}

function lockButton(btn, on){
  if(!btn) return;
  if(on){
    btn.classList.add('is-loading');
    btn.setAttribute('disabled','disabled');
  } else {
    btn.classList.remove('is-loading');
    btn.removeAttribute('disabled');
  }
}

// ========================
// search2: 문제 선택
// ========================
function initChoiceStep(){
  const root = stage?.querySelector('#surveyChoices');
  if(!root) return;

  const MAX = 3;
  const list = [...root.querySelectorAll('.opt')];
  const next = root.querySelector('#toNext');
  const counter = root.querySelector('#selCount');

  // 복구 (뒤로 갔다 올 때)
  let selected = Array.isArray(window.__SURVEY__?.problems) ? [...window.__SURVEY__.problems] : [];
  list.forEach(btn => {
    if (selected.includes(btn.dataset.value)) btn.classList.add('selected');
  });

  const updateUI = () => {
    if (counter) counter.textContent = selected.length ? `(${selected.length}/3)` : '';

    if (selected.length >= 1 && selected.length <= MAX){
      next?.classList.remove('is-disabled');
      next?.setAttribute('aria-disabled','false');
    } else {
      next?.classList.add('is-disabled');
      next?.setAttribute('aria-disabled','true');
    }

    list.forEach(btn => {
      if(selected.length >= MAX && !selected.includes(btn.dataset.value)){
        btn.setAttribute('disabled','disabled');
      } else {
        btn.removeAttribute('disabled');
      }
    });
  };

  list.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = String(btn.dataset.value);
      const idx = selected.indexOf(val);
      if (idx > -1){
        selected.splice(idx,1);
        btn.classList.remove('selected');
      } else {
        if (selected.length >= MAX) return;
        selected.push(val);
        btn.classList.add('selected');
      }
      // 즉시 로컬 저장
      window.__SURVEY__ = window.__SURVEY__ || {};
      window.__SURVEY__.problems = selected.slice();
      updateUI();
    });
  });

  next?.addEventListener('click', async (e)=>{
    e.preventDefault();
    if (next.classList.contains('is-disabled')) return;

    if (selected.length < 1 || selected.length > MAX){
      alert('문제는 최소 1개, 최대 3개까지 선택할 수 있어요.');
      return;
    }

    lockButton(next, true);
    try {
      await postSurvey({ problems: selected });
      swapInner('search3.html');
    } catch (err){
      console.error(err);
      alert('문제 선택을 저장하는 데 실패했어요. 잠시 후 다시 시도해 주세요.');
      lockButton(next, false);
    }
  });

  updateUI();
}

// ✅ 서버 응답을 표준화: [{value, label}] 형태로 변환
function normalizeTones(data){
  // 허용 포맷 예:
  // 1) [{ value:'toneX', label:'문구' }, ...]
  // 2) ['문구1','문구2',...]  -> value 자동 부여
  // 3) { items: [...] }      -> items 사용
  const src = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  const arr = src.map((item, i) => {
    if (typeof item === 'string') {
      return { value: `tone${i+1}`, label: item };
    }
    const v = item.value ?? item.id ?? `tone${i+1}`;
    const l = item.label ?? item.text ?? String(item);
    return { value: String(v), label: String(l) };
  }).filter(x => x.label?.trim());
  return arr;
}

// ✅ 서버에서 톤 옵션 받아와서 #toneList에 주입 (실패 시 DEFAULT_TONES)
async function populateToneOptions(root){
  const listEl = root.querySelector('#toneList');
  if (!listEl) return;

  // 로딩 상태 표시(선택)
  listEl.innerHTML = `
    <li style="opacity:.7;padding:6px 0">불러오는 중…</li>
  `;

  let tones = [];
  try {
    const res = await fetch(TONES_API, {
      method: 'GET',
      headers: { 'X-Requested-With':'XMLHttpRequest', 'Accept':'application/json' },
      cache: 'no-store',
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json().catch(()=> ({}));
    tones = normalizeTones(data);
    if (!tones.length) throw new Error('empty');
  } catch (e) {
    // 실패 → 기본 옵션 폴백
    console.warn('tones load failed, fallback to defaults:', e);
    tones = DEFAULT_TONES.slice();
  }

  // 렌더
  listEl.innerHTML = tones.map(t =>
    `<li><button type="button" class="opt" data-value="${t.value}">${t.label}</button></li>`
  ).join('');
}

/* ========================
   search3: 톤 단일 선택  (교체 버전)
   - 서버에서 옵션 로드 → 실패 시 기본 3개로 폴백
   - 이후 기존 선택/저장/다음단계 로직 그대로
======================== */
function initToneStep(){
  const root = stage?.querySelector('#toneStep');
  if(!root) return;

  const prev = root.querySelector('#prevStep');
  const next = root.querySelector('#toNext');

  // next 버튼 초기 비활성
  enableNext(false);

  // 1) 옵션을 서버에서 받아와 주입(폴백 포함)
  populateToneOptions(root).then(() => {
    // 2) 옵션이 주입된 뒤에 이벤트 바인딩/복구
    const list = [...root.querySelectorAll('.opt')];

    // 복구
    const saved = window.__SURVEY__?.tone || null;
    if (saved) {
      const btn = list.find(b => b.dataset.value === saved);
      btn && btn.classList.add('selected');
      enableNext(true);
    }

    list.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        list.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        window.__SURVEY__ = window.__SURVEY__ || {};
        window.__SURVEY__.tone = btn.dataset.value; // 즉시 로컬 저장
        enableNext(true);
      });
    });
  });

  // 이전 단계
  prev && prev.addEventListener('click', (e)=>{ e.preventDefault(); swapInner('search2.html'); });

  // 다음 단계
  next && next.addEventListener('click', async (e)=>{
    e.preventDefault();
    if (next.classList.contains('is-disabled')) return;

    const tone = window.__SURVEY__?.tone || '';
    if (!tone.trim()){
      alert('톤을 선택해 주세요.');
      return;
    }

    lockButton(next, true);
    try {
      await postSurvey({ tone });
      swapInner('search4.html');
    } catch (err){
      console.error(err);
      alert('톤 선택을 저장하는 데 실패했어요. 잠시 후 다시 시도해 주세요.');
      lockButton(next, false);
    }
  });

  function enableNext(on){
    if(!next) return;
    if(on){ next.classList.remove('is-disabled'); next.setAttribute('aria-disabled','false'); }
    else  { next.classList.add('is-disabled');    next.setAttribute('aria-disabled','true');  }
  }
}

// ========================
// search4: 완료 → 메인 이동 (서버 전송 없음)
// ========================
function initFinalStep(){
  const root = stage?.querySelector('#finalStep');
  if(!root) return;

  // 디버그 표시 (선택)
  const dbgProblems = root.querySelector('#debugProblems');
  const dbgTone     = root.querySelector('#debugTone');
  if (dbgProblems && dbgTone) {
    const problems = (window.__SURVEY__ && Array.isArray(window.__SURVEY__.problems))
      ? window.__SURVEY__.problems : [];
    const tone = (window.__SURVEY__ && window.__SURVEY__.tone) ? window.__SURVEY__.tone : '(없음)';
    dbgProblems.textContent = problems.length ? problems.join(', ') : '(없음)';
    dbgTone.textContent = tone;
  }

  const start = root.querySelector('#startNow');
  if (!start) return;

  // 필요 시 여기서 postSurvey({ step: 'complete' }) 한 번 더 호출 가능
  start.addEventListener('click', (e)=>{
   e.preventDefault();
   location.href = '../home.html';
  });
}

// ========================
// 초기 실행 (기존 구조 유지)
// ========================
// bindLocal()은 기존 코드에 맞춰 사용 (로컬 초기화 등)
if (typeof bindLocal === 'function') {
  bindLocal();
}

});

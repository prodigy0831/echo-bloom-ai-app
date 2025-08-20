
document.addEventListener('DOMContentLoaded', () => {
  const group   = document.getElementById('toneList');
  const buttons = Array.from(group.querySelectorAll('.opt'));
  const nextBtn = document.getElementById('toNext');
  
  // 현재 사용자의 선택된 톤을 불러와서 미리 체크
  loadCurrentTone();

  // 서버 엔드포인트 & 성공 후 이동할 주소 (Mock Server 사용)
  const ENDPOINT_TONE = '/api/v1/user/tone';  // Mock Server에서 처리할 엔드포인트
  const NEXT_URL      = 'mypage.html';        // 성공 후 이동

  // 선택 상태 관리 (이미 구현돼있으면 이 블록은 생략해도 됨)
  group.setAttribute('role','radiogroup');
  buttons.forEach(b => {
    b.setAttribute('role','radio');
    b.setAttribute('aria-checked','false');
    b.addEventListener('click', () => select(b));
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(b); }
    });
  });
  function select(btn){
    buttons.forEach(b => {
      const on = b === btn;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    nextBtn?.classList.remove('is-disabled');
    nextBtn?.removeAttribute('aria-disabled');
  }

  // 다음 버튼 → 서버 전송
  nextBtn?.addEventListener('click', async () => {
    console.log('🎨 톤 수정 확인 버튼 클릭됨');
    
    // 아직 선택 안 했으면 막기
    const selected = group.querySelector('.opt.selected');
    if (!selected) {
      console.log('❌ 선택된 톤이 없음');
      alert('먼저 톤을 선택해주세요.');
      return;
    }
    
    // 톤 값을 숫자로 변환 (tone1 -> 1, tone2 -> 2, tone3 -> 3)
    const toneStr = selected.dataset.value; // 예: "tone1", "tone2", "tone3"
    const toneValue = parseInt(toneStr.replace('tone', ''));
    console.log('🎵 선택된 톤:', toneStr, '→', toneValue);

    // 전송 중 상태
    nextBtn.classList.add('is-disabled');
    nextBtn.setAttribute('aria-disabled','true');

    // CSRF 토큰 쓰는 프로젝트라면 meta에서 꺼내 헤더에 추가
    const CSRF = document.querySelector('meta[name="csrf-token"]')?.content;

    try {
      console.log('📤 톤 업데이트 fetch 요청:', ENDPOINT_TONE, { tone: toneValue });
      
      const res = await fetch(ENDPOINT_TONE, {
        method: 'POST',
        credentials: 'include', // 쿠키 인증 시
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(CSRF ? { 'X-CSRF-Token': CSRF } : {})
        },
        body: JSON.stringify({ tone: toneValue })
      });

      console.log('📥 톤 업데이트 서버 응답:', res.status, res.statusText);

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const responseData = await res.json();
      console.log('✅ 톤 업데이트 서버 응답 데이터:', responseData);

      console.log('🔄 마이페이지로 이동:', NEXT_URL);
      location.href = NEXT_URL;

    } catch (err) {
      console.error('❌ 톤 수정 실패:', err);
      alert('전송에 실패했어요. 네트워크 상태를 확인한 후 다시 시도해 주세요.');
      // 실패 시 다시 활성화
      nextBtn.classList.remove('is-disabled');
      nextBtn.removeAttribute('aria-disabled');
    }
  });
  
  // 현재 사용자의 톤을 불러와서 미리 선택 상태로 표시
  async function loadCurrentTone() {
    console.log('🎨 현재 사용자 톤 불러오기 시작');
    
    try {
      const res = await fetch('/api/users/me/categories');
      if (res.ok) {
        const data = await res.json();
        console.log('🎵 현재 사용자 톤:', data.tone);
        
        if (data.tone) {
          // 톤 ID를 tone1, tone2, tone3 형식으로 변환
          const toneValue = `tone${data.tone}`;
          const button = group.querySelector(`[data-value="${toneValue}"]`);
          if (button) {
            select(button);
            console.log(`✅ 톤 ${toneValue} 미리 선택됨`);
          }
        }
      } else {
        console.log('⚠️ 사용자 데이터 로드 실패, 기본값 사용');
      }
    } catch (error) {
      console.warn('⚠️ 사용자 톤 로드 중 오류:', error);
    }
  }
});


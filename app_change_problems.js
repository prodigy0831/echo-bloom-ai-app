document.addEventListener('DOMContentLoaded', () => {
  const list      = document.getElementById('choiceList');
  const buttons   = Array.from(list.querySelectorAll('.opt'));
  const selCount  = document.getElementById('selCount');
  const nextBtn   = document.getElementById('toNext');
  const MAX       = 3;
  
  // 현재 사용자의 선택된 문제들을 불러와서 미리 체크
  loadCurrentProblems();

  // 서버 엔드포인트 & 성공 후 이동 경로 (Mock Server 사용)
  const ENDPOINT  = '/api/v1/user/problems';     // Mock Server에서 처리할 엔드포인트
  const NEXT_URL  = 'mypage.html';               // 저장 성공 후 이동할 페이지

  // 선택 토글(최대 3개)
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
      } else {
        const picked = list.querySelectorAll('.opt.selected').length;
        if (picked >= MAX) {
          // 가벼운 피드백(선택 초과)
          btn.animate([{transform:'scale(1)'},{transform:'scale(0.98)'},{transform:'scale(1)'}], {duration:150});
          return;
        }
        btn.classList.add('selected');
      }
      updateState();
    });
  });

  function updateState(){
    const picked = list.querySelectorAll('.opt.selected').length;
    selCount.textContent = picked ? `(${picked}/${MAX})` : '';
    if (picked > 0) {
      nextBtn.classList.remove('is-disabled');
      nextBtn.removeAttribute('aria-disabled');
    } else {
      nextBtn.classList.add('is-disabled');
      nextBtn.setAttribute('aria-disabled','true');
    }
  }

  // 다음 → 서버 전송
  nextBtn.addEventListener('click', async () => {
    console.log('🔘 문제 수정 확인 버튼 클릭됨');
    
    if (nextBtn.classList.contains('is-disabled')) {
      console.log('⚠️ 버튼이 비활성화 상태임');
      return;
    }

    const values = Array.from(list.querySelectorAll('.opt.selected')).map(b => Number(b.dataset.value));
    console.log('📝 선택된 문제들:', values);
    
    if (values.length === 0) { 
      console.log('❌ 선택된 문제가 없음');
      alert('최소 1개 이상 선택해주세요.'); 
      return; 
    }

    console.log('🚀 서버로 문제 업데이트 요청 시작');
    nextBtn.classList.add('is-disabled'); nextBtn.setAttribute('aria-disabled','true');

    // CSRF 토큰을 쓰는 경우(선택): <meta name="csrf-token" content="...">
    const CSRF = document.querySelector('meta[name="csrf-token"]')?.content;

    try{
      console.log('📤 fetch 요청:', ENDPOINT, { problems: values });
      
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(CSRF ? {'X-CSRF-Token': CSRF} : {})
        },
        body: JSON.stringify({ problems: values })
      });
      
      console.log('📥 서버 응답:', res.status, res.statusText);
      
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const responseData = await res.json();
      console.log('✅ 서버 응답 데이터:', responseData);
      
      console.log('🔄 마이페이지로 이동:', NEXT_URL);
      location.href = NEXT_URL;
    } catch (err) {
      console.error('❌ 문제 수정 실패:', err);
      alert('저장에 실패했어요. 네트워크 상태를 확인하고 다시 시도해주세요.');
      nextBtn.classList.remove('is-disabled'); nextBtn.removeAttribute('aria-disabled');
    }
  });
  
  // 현재 사용자의 문제들을 불러와서 미리 선택 상태로 표시
  async function loadCurrentProblems() {
    console.log('🔄 현재 사용자 문제 불러오기 시작');
    
    try {
      const res = await fetch('/api/users/me/categories');
      if (res.ok) {
        const data = await res.json();
        console.log('📋 현재 사용자 문제:', data.problems);
        
        if (data.problems && Array.isArray(data.problems)) {
          // 현재 선택된 문제들을 체크 상태로 만들기
          data.problems.forEach(problemId => {
            const button = list.querySelector(`[data-value="${problemId}"]`);
            if (button) {
              button.classList.add('selected');
              console.log(`✅ 문제 ${problemId} 미리 선택됨`);
            }
          });
          updateState();
        }
      } else {
        console.log('⚠️ 사용자 데이터 로드 실패, 기본값 사용');
      }
    } catch (error) {
      console.warn('⚠️ 사용자 문제 로드 중 오류:', error);
    }
  }
});

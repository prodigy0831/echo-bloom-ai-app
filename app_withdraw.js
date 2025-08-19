    document.getElementById('goBack').addEventListener('click', () => {
    window.location.href = 'setting.html';
  });
  
  (function(){
    const agree = document.getElementById('agreeWithdraw');
    const btn = document.getElementById('withdrawBtn');

    function syncBtn(){
      const on = !!agree.checked;
      btn.disabled = !on;
      btn.setAttribute('aria-disabled', String(!on));
      btn.classList.toggle('enabled', on);
    }
    agree.addEventListener('change', syncBtn);
    syncBtn();

    btn.addEventListener('click', async (e) => {
      if (btn.disabled) return;
      // TODO: 실제 탈퇴 API로 교체하세요.
      // 예) POST /api/account/withdraw  (세션/쿠키 사용 시 credentials 포함)
      try {
        btn.textContent = '처리 중...';
        /* const res = await fetch('/api/account/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // credentials: 'include', // 세션 쿠키 사용 시 주석 제거
          body: JSON.stringify({ reason: 'user_request' })
        });
        if (!res.ok) throw new Error('탈퇴 요청 실패');
        // 성공 처리: 알림 후 메인 이동 등 */
        alert('탈퇴가 완료되었습니다.');
         location.href = 'withdraw_done.html';
      } catch (err) {
        alert('잠시 후 다시 시도해 주세요.');
        console.error(err);
      } finally {
        btn.textContent = '회원 탈퇴하기';
      }
    });
  })();
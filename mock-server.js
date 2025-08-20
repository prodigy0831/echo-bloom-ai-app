// Echo Bloom Mock Server - 기존 API 엔드포인트와 호환되는 서버
class MockServer {
  constructor() {
    this.setupFetchInterceptor();
    // localStorage에서 기존 사용자 데이터 로드
    this.userData = this.loadUserData();
    console.log('🚀 Echo Bloom Mock Server 시작됨');
    console.log('💾 저장된 사용자 데이터 로드:', this.userData);
  }

  setupFetchInterceptor() {
    // 원본 fetch 저장
    const originalFetch = window.fetch;
    
    // fetch 요청 가로채기
    window.fetch = async (url, options = {}) => {
      console.log('🌐 Mock Server: 요청 가로채기', url, options);
      
      // API 요청만 가로채기
      if (typeof url === 'string' && url.startsWith('/api/v1/affirmations/tone-examples')) {
        return this.handleAffirmationAPI(url, options);
      }
      
      // 메인 확언 API 가로채기
      if (typeof url === 'string' && url.includes('/api/v1/affirmations/main')) {
        console.log('🎯 메인 확언 API 감지 - 즉시 처리');
        const response = await this.handleMainAffirmationAPI(url, options);
        console.log('📤 메인 확언 응답 반환:', response.status);
        return response;
      }
      
      // 카카오 로그인 URL 요청 가로채기
      if (typeof url === 'string' && url.includes('/auth/kakao/login-url')) {
        return this.handleKakaoLoginURL();
      }
      
      // 인증 체크 API 가로채기
      if (typeof url === 'string' && url.includes('/api/check-auth')) {
        return this.handleAuthCheck();
      }
      
      // 사용자 카테고리 정보 API 가로채기
      if (typeof url === 'string' && url.includes('/api/users/me/categories')) {
        return this.handleUserCategoriesAPI();
      }
      
      // 북마크 체크 API 가로채기
      if (typeof url === 'string' && url.includes('/api/v1/bookmarks/check')) {
        return this.handleBookmarkCheck(url, options);
      }
      
      // 북마크 추가 API 가로채기
      if (typeof url === 'string' && url.includes('/api/v1/bookmarks/add')) {
        return this.handleBookmarkAdd(url, options);
      }
      
      // 북마크 삭제 API 가로채기
      if (typeof url === 'string' && url.includes('/api/v1/bookmarks/remove')) {
        return this.handleBookmarkRemove(url, options);
      }
      
      // 사용자 문제 업데이트 API 가로채기
      if (typeof url === 'string' && url.includes('/api/v1/user/problems')) {
        return this.handleUserProblemsUpdate(url, options);
      }
      
      // 사용자 톤 업데이트 API 가로채기
      if (typeof url === 'string' && url.includes('/api/v1/user/tone')) {
        return this.handleUserToneUpdate(url, options);
      }
      
      // 다른 요청은 원본 fetch로 처리
      return originalFetch(url, options);
    };
  }

  async handleAffirmationAPI(url, options) {
    console.log('📝 처리 중: 확언 API 요청');
    
    try {
      // 요청 본문 파싱
      let requestData = {};
      if (options.body) {
        requestData = JSON.parse(options.body);
      }
      
      console.log('📨 요청 데이터:', requestData);

              // 문제 선택 처리
        if (requestData.problems && Array.isArray(requestData.problems)) {
          this.userData.problems = requestData.problems;
          this.saveUserData(); // localStorage에 저장
          console.log('✅ 문제 선택 저장:', this.userData.problems);
          
          // Clova AI로 톤 예시 생성 시도
          let toneExamples;
          if (window.clovaAIClient) {
            try {
              console.log('🤖 Clova AI로 톤 예시 생성 시도');
              toneExamples = await window.clovaAIClient.generateToneExamples(requestData.problems);
              
              // 빈 응답 체크
              if (!toneExamples || !toneExamples.affirmation1 || toneExamples.affirmation1.trim() === '') {
                console.warn('⚠️ Clova AI가 빈 응답을 반환했습니다. Mock 사용');
                throw new Error('빈 응답');
              }
              
              console.log('✅ Clova AI 톤 예시 생성 성공');
            } catch (error) {
              console.warn('⚠️ Clova AI 톤 예시 생성 실패, Mock 사용:', error);
              toneExamples = this.generateToneExamples(requestData.problems);
            }
          } else {
            toneExamples = this.generateToneExamples(requestData.problems);
          }
          
          return new Response(JSON.stringify(toneExamples), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      
      // 톤 선택 처리
      if (requestData.tone) {
        let tone = requestData.tone;
        
        // 톤 정규화: tone1, tone2, tone3 -> 1, 2, 3
        if (typeof tone === 'string' && tone.startsWith('tone')) {
          tone = parseInt(tone.replace('tone', ''));
        }
        
        this.userData.tone = tone;
        this.saveUserData(); // localStorage에 저장
        console.log('✅ 톤 선택 저장 (정규화됨):', this.userData.tone);
        
        return new Response(JSON.stringify({
          success: true,
          tone1: requestData.tone,
          message: '톤 선택이 저장되었습니다.'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 기본 응답
      return new Response(JSON.stringify({
        success: true,
        message: '요청이 처리되었습니다.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('❌ API 처리 오류:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  generateToneExamples(problems) {
    // 문제별 확언 예시
    const problemExamples = {
      1: "일상에 활력을 되찾는 확언들", // 일상에 활력이 없어요
      2: "집중력과 계획 실행력을 높이는 확언들", // 계획을 끝내지 못하고 집중력이 떨어져요
      3: "불안을 달래고 평온을 찾는 확언들", // 걱정이 많고 불안해요
      4: "과거를 받아들이고 현재에 집중하는 확언들", // 과거를 후회해요
      5: "자신감과 자존감을 높이는 확언들", // 스스로가 부족하게 느껴지고 자신감이 없어요
      6: "용서와 화해를 위한 확언들", // 누군가를 용서하는 것이 어려워요
      7: "소속감과 연결감을 느끼는 확언들", // 외롭고 소속감을 느끼기 힘들어요
      8: "삶의 목적과 의미를 찾는 확언들", // 뭘 위해 살아야 하는지 모르겠어요
      9: "새로운 시작과 성장을 위한 확언들" // 내가 모든 걸 망친 것 같고 제자리를 느껴요
    };

    const selectedExamples = problems.map(p => problemExamples[p] || "긍정적인 확언들").join(", ");
    
    return {
      success: true,
      tone1: "따뜻하고 부드러운 톤으로: " + selectedExamples,
      tone2: "힘차고 강한 톤으로: " + selectedExamples,
      tone3: "차분하고 안정적인 톤으로: " + selectedExamples,
      message: "톤 예시가 생성되었습니다."
    };
  }

  async handleKakaoLoginURL() {
    console.log('🔑 카카오 로그인 URL 요청 처리');
    
    // 시뮬레이션된 카카오 로그인 URL
    const mockKakaoUrl = `https://kauth.kakao.com/oauth/authorize?client_id=mock&redirect_uri=${encodeURIComponent(window.location.origin)}/auth/kakao/callback&response_type=code&scope=profile_nickname%20profile_image%20account_email`;
    
    return new Response(mockKakaoUrl, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  async handleAuthCheck() {
    console.log('🔒 인증 체크 요청 처리');
    
    // 항상 인증 성공으로 처리 (개발 모드)
    return new Response('Authenticated', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  async handleMainAffirmationAPI(url, options) {
    console.log('🏠 메인 확언 API 요청 처리');
    console.log('🔍 요청 URL:', url);
    console.log('🔍 요청 옵션:', options);
    
    try {
      // 저장된 사용자 데이터를 기반으로 확언 생성
      let affirmations;
      
      // 사용자 데이터가 없으면 테스트 데이터 사용
      const testProblems = this.userData.problems || [1, 3, 5]; // 활력부족, 불안감, 자신감부족
      
      // 톤 정규화: tone1, tone2, tone3 -> 1, 2, 3
      let userTone = this.userData.tone;
      if (typeof userTone === 'string' && userTone.startsWith('tone')) {
        userTone = parseInt(userTone.replace('tone', ''));
      }
      const testTone = userTone || 1; // 기본값: 따뜻하고 부드러운 톤
      
      console.log('🎯 메인 확언 생성 요청:', { 
        problems: testProblems, 
        tone: testTone,
        hasClova: !!window.clovaAIClient?.API_KEY,
        isTestData: !this.userData.problems
      });
      
      // 백엔드 확인
      if (!window.echoBloomBackend) {
        console.error('❌ EchoBloom 백엔드가 초기화되지 않음');
        throw new Error('백엔드 초기화 실패');
      }
      
      console.log('🔧 백엔드 상태:', window.echoBloomBackend);
      
      // 항상 맞춤형 확언 생성 (테스트 데이터라도)
      affirmations = await window.echoBloomBackend.generateAffirmations(
        testProblems, 
        testTone
      );
      console.log('✅ 확언 생성 완료:', affirmations);
      
      // app_home.js에서 기대하는 형식으로 응답
      const randomAffirmation = [
        affirmations.affirmation1,
        affirmations.affirmation2, 
        affirmations.affirmation3
      ][Math.floor(Math.random() * 3)];
      
      return new Response(JSON.stringify({
        text: randomAffirmation,
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('❌ 메인 확언 API 처리 오류:', error);
      
      // 실패시 기본 확언 제공
      const fallbackAffirmations = [
        "나는 오늘도 최고야!",
        "어려워도 괜찮아, 나는 희망을 찾을 수 있을 거야!",
        "나는 사랑받을 자격이 있는 사람이야"
      ];
      
      const randomFallback = fallbackAffirmations[Math.floor(Math.random() * fallbackAffirmations.length)];
      
      return new Response(JSON.stringify({
        text: randomFallback,
        success: false,
        error: error.message
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async handleUserCategoriesAPI() {
    console.log('👤 사용자 카테고리 정보 API 요청 처리');
    
    try {
      // 저장된 사용자 데이터에서 문제와 톤 정보 가져오기
      const problemIds = this.userData.problems || [];
      
      // 톤 정규화: tone1, tone2, tone3 -> 1, 2, 3
      let userTone = this.userData.tone;
      if (typeof userTone === 'string' && userTone.startsWith('tone')) {
        userTone = parseInt(userTone.replace('tone', ''));
      }
      const toneId = userTone || 1;
      
      console.log('📋 현재 사용자 설정:', { problemIds, toneId });
      
      return new Response(JSON.stringify({
        problems: problemIds, // ID 배열로 반환 (마이페이지에서 사용)
        tone: toneId,        // 톤 ID로 반환
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('❌ 사용자 카테고리 API 처리 오류:', error);
      
      // 기본값 반환
      return new Response(JSON.stringify({
        problems: ['자신감 부족', '스트레스', '불안감'],
        tone: '따뜻하고 부드러운',
        success: false,
        error: error.message
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 북마크 체크 API 처리
  async handleBookmarkCheck(url, options) {
    console.log('🔖 북마크 체크 API 요청 처리:', url);
    
    try {
      // URL에서 sentence 파라미터 추출
      const urlObj = new URL(url, 'http://localhost:3001');
      const sentence = urlObj.searchParams.get('sentence');
      
      console.log('📝 체크할 문장:', sentence);
      
      // 북마크 상태를 localStorage에서 확인
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      const exists = bookmarks.some(bookmark => bookmark.sentence === sentence);
      
      console.log('🔖 북마크 존재 여부:', exists);
      
      return new Response(JSON.stringify({
        exists: exists,
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('❌ 북마크 체크 오류:', error);
      return new Response(JSON.stringify({
        exists: false,
        success: false,
        error: error.message
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 북마크 추가 API 처리
  async handleBookmarkAdd(url, options) {
    console.log('➕ 북마크 추가 API 요청 처리');
    
    try {
      const requestData = options.body ? JSON.parse(options.body) : {};
      const sentence = requestData.sentence;
      
      console.log('📝 추가할 문장:', sentence);
      
      if (!sentence) {
        throw new Error('문장이 제공되지 않았습니다');
      }
      
      // localStorage에서 북마크 목록 가져오기
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      
      // 중복 체크
      const exists = bookmarks.some(bookmark => bookmark.sentence === sentence);
      if (!exists) {
        bookmarks.push({
          sentence: sentence,
          addedAt: new Date().toISOString()
        });
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        console.log('✅ 북마크 추가 완료');
      } else {
        console.log('⚠️ 이미 북마크에 존재함');
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: exists ? '이미 북마크에 있습니다' : '북마크에 추가되었습니다'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('❌ 북마크 추가 오류:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 북마크 삭제 API 처리
  async handleBookmarkRemove(url, options) {
    console.log('➖ 북마크 삭제 API 요청 처리');
    
    try {
      const requestData = options.body ? JSON.parse(options.body) : {};
      const sentence = requestData.sentence;
      
      console.log('📝 삭제할 문장:', sentence);
      
      if (!sentence) {
        throw new Error('문장이 제공되지 않았습니다');
      }
      
      // localStorage에서 북마크 목록 가져오기
      let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      
      // 해당 문장 삭제
      const originalLength = bookmarks.length;
      bookmarks = bookmarks.filter(bookmark => bookmark.sentence !== sentence);
      
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
      
      const deleted = originalLength !== bookmarks.length;
      console.log(deleted ? '✅ 북마크 삭제 완료' : '⚠️ 삭제할 북마크가 없음');
      
      return new Response(JSON.stringify({
        success: true,
        message: deleted ? '북마크에서 삭제되었습니다' : '북마크에 없습니다'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('❌ 북마크 삭제 오류:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 사용자 문제 업데이트 API 처리
  async handleUserProblemsUpdate(url, options) {
    console.log('🔄 사용자 문제 업데이트 API 요청 처리');
    
    try {
      const requestData = options.body ? JSON.parse(options.body) : {};
      const problems = requestData.problems || requestData.selected || [];
      
      console.log('📝 업데이트할 문제들:', problems);
      
      if (!Array.isArray(problems) || problems.length === 0) {
        throw new Error('문제가 제공되지 않았습니다');
      }
      
      // 사용자 데이터 업데이트
      this.userData.problems = problems;
      this.saveUserData(); // localStorage에 저장
      console.log('✅ 사용자 문제 업데이트 완료:', problems);
      
      return new Response(JSON.stringify({
        success: true,
        message: '문제가 성공적으로 업데이트되었습니다',
        problems: problems
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('❌ 사용자 문제 업데이트 오류:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 사용자 톤 업데이트 API 처리
  async handleUserToneUpdate(url, options) {
    console.log('🎨 사용자 톤 업데이트 API 요청 처리');
    
    try {
      const requestData = options.body ? JSON.parse(options.body) : {};
      let tone = requestData.tone || requestData.selected;
      
      console.log('📝 업데이트할 톤 (원본):', tone);
      
      if (!tone) {
        throw new Error('톤이 제공되지 않았습니다');
      }
      
      // 톤 정규화: tone1, tone2, tone3 -> 1, 2, 3
      if (typeof tone === 'string' && tone.startsWith('tone')) {
        tone = parseInt(tone.replace('tone', ''));
      }
      
      console.log('📝 정규화된 톤:', tone);
      
      // 사용자 데이터 업데이트
      this.userData.tone = tone;
      this.saveUserData(); // localStorage에 저장
      console.log('✅ 사용자 톤 업데이트 완료:', tone);
      
      return new Response(JSON.stringify({
        success: true,
        message: '톤이 성공적으로 업데이트되었습니다',
        tone: tone
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('❌ 사용자 톤 업데이트 오류:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 문제 ID를 문제명으로 변환
  getProblemNames(problemIds) {
    const problemMap = {
      1: '일상에 활력이 없어요',
      2: '계획을 끝내지 못하고 집중력이 떨어져요',
      3: '걱정이 많고 불안해요',
      4: '과거를 후회해요',
      5: '스스로가 부족하게 느껴지고 자신감이 없어요',
      6: '누군가를 용서하는 것이 어려워요',
      7: '외롭고 소속감을 느끼기 힘들어요',
      8: '뭘 위해 살아야 하는지 모르겠어요',
      9: '내가 모든 걸 망친 것 같고 제자리를 느껴요'
    };
    
    return problemIds.map(id => problemMap[id] || '알 수 없는 문제');
  }

  // 톤 ID를 톤명으로 변환
  getToneName(toneId) {
    const toneMap = {
      1: '따뜻하고 부드러운',
      2: '힘차고 강한', 
      3: '결의에 찬 강한',
      4: '밝고 긍정적인',
      5: '지혜롭고 깊이 있는',
      'tone1': '따뜻하고 부드러운',
      'tone2': '힘차고 강한',
      'tone3': '결의에 찬 강한'
    };
    
    return toneMap[toneId] || '따뜻하고 부드러운';
  }

  // 현재 사용자 데이터 조회
  getUserData() {
    return this.userData;
  }

  // 저장된 확언 생성
  async generateAffirmations() {
    if (!window.echoBloomBackend) {
      console.error('❌ echoBloomBackend가 없습니다');
      return {
        affirmation1: "나는 할 수 있어",
        affirmation2: "나는 소중한 사람이야", 
        affirmation3: "오늘도 좋은 하루야"
      };
    }

    const problems = this.userData.problems || [1];
    const tone = this.userData.tone || 1;
    
    return await window.echoBloomBackend.generateAffirmations(problems, parseInt(tone));
  }

  // localStorage에서 사용자 데이터 로드
  loadUserData() {
    try {
      const savedData = localStorage.getItem('echobloom_user_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('📋 localStorage에서 사용자 데이터 복원:', parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('⚠️ localStorage 데이터 로드 실패:', error);
    }
    
    // 기본값 반환
    return {
      problems: null,
      tone: null
    };
  }

  // localStorage에 사용자 데이터 저장
  saveUserData() {
    try {
      localStorage.setItem('echobloom_user_data', JSON.stringify(this.userData));
      console.log('💾 localStorage에 사용자 데이터 저장:', this.userData);
    } catch (error) {
      console.error('❌ localStorage 저장 실패:', error);
    }
  }

  // 디버깅용 - 현재 저장된 데이터 확인
  debugUserData() {
    console.log('🔍 현재 Mock Server userData:', this.userData);
    console.log('🔍 localStorage 데이터:', localStorage.getItem('echobloom_user_data'));
  }
}

// Mock 서버 초기화
document.addEventListener('DOMContentLoaded', () => {
  if (!window.mockServer) {
    window.mockServer = new MockServer();
    console.log('✅ Mock Server 준비 완료');
  }
});

// 글로벌 접근을 위해
window.MockServer = MockServer;

// 향상된 Echo Bloom 앱 로직
class EchoBloomApp {
  constructor() {
    this.backend = window.echoBloomBackend;
    this.speechManager = window.speechRecognitionManager;
    this.currentScreen = 'main';
    this.selectedProblems = [];
    this.selectedTone = null;
    this.currentAffirmations = null;
    
    this.initializeApp();
  }

  async initializeApp() {
    // 기본 사용자 인증
    await this.backend.authenticateUser();
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 초기 화면 설정
    this.loadMainScreen();
  }

  setupEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      this.bindMainScreenEvents();
    });
  }

  loadMainScreen() {
    console.log('📱 메인 화면 로딩');
    // 메인 화면 초기화 로직
    this.bindMainScreenEvents();
  }

  bindMainScreenEvents() {
    // 메인 화면 버튼들
    const startKakaoBtn = document.getElementById('startKakao');
    const skipLinkBtn = document.getElementById('skipLink');
    
    if (startKakaoBtn) {
      startKakaoBtn.addEventListener('click', () => {
        this.handleLogin();
      });
    }
    
    if (skipLinkBtn) {
      skipLinkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }
  }

  async handleLogin() {
    try {
      await this.backend.authenticateUser();
      this.navigateToIntro();
    } catch (error) {
      console.error('로그인 실패:', error);
      this.navigateToIntro(); // 실패해도 계속 진행
    }
  }

  navigateToIntro() {
    this.loadView('views/intro.html');
  }

  async loadView(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('페이지 로드 실패');
      
      const html = await response.text();
      const app = document.getElementById('app');
      
      if (app) {
        // 페이드 효과
        app.classList.add('leaving');
        
        setTimeout(() => {
          app.innerHTML = html;
          app.classList.remove('leaving');
          app.classList.add('entered');
          
          // 새 페이지의 이벤트 바인딩
          this.bindCurrentPageEvents();
        }, 250);
      }
    } catch (error) {
      console.error('뷰 로드 실패:', error);
    }
  }

  bindCurrentPageEvents() {
    // 공통 이벤트들
    this.bindGoBackEvents();
    this.bindNavigationEvents();
    
    // 페이지별 특수 이벤트들
    this.bindPageSpecificEvents();
  }

  bindGoBackEvents() {
    const goBackBtns = document.querySelectorAll('#goBack, .go-back');
    goBackBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = '/main.html';
      });
    });
  }

  bindNavigationEvents() {
    // 인트로 네비게이션
    const goDeeper = document.getElementById('goDeeper');
    const goDeeper2 = document.getElementById('goDeeper2');
    const goDeeper3 = document.getElementById('goDeeper3');
    const goDeeper4 = document.getElementById('goDeeper4');
    
    if (goDeeper) {
      goDeeper.addEventListener('click', () => this.loadView('views/intro2.html'));
    }
    if (goDeeper2) {
      goDeeper2.addEventListener('click', () => this.loadView('views/intro3.html'));
    }
    if (goDeeper3) {
      goDeeper3.addEventListener('click', () => this.loadView('views/intro4.html'));
    }
    if (goDeeper4) {
      goDeeper4.addEventListener('click', () => this.loadView('views/search.html'));
    }
  }

  bindPageSpecificEvents() {
    // 문제 선택 페이지
    if (window.location.pathname.includes('search.html') || document.querySelector('.problem-selector')) {
      this.bindProblemSelectionEvents();
    }
    
    // 톤 선택 페이지
    if (document.querySelector('.tone-selector')) {
      this.bindToneSelectionEvents();
    }
    
    // 읽기 페이지
    if (document.querySelector('.reading-practice')) {
      this.bindReadingEvents();
    }
    
    // 홈 페이지
    if (document.querySelector('.bubble')) {
      this.bindHomeEvents();
    }
  }

  bindProblemSelectionEvents() {
    const problemCheckboxes = document.querySelectorAll('input[name="problems"]');
    const nextButton = document.querySelector('.next-button, #problemNextBtn');
    
    problemCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectedProblems();
      });
    });
    
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        this.handleProblemSelection();
      });
    }
  }

  bindToneSelectionEvents() {
    const toneRadios = document.querySelectorAll('input[name="tone"]');
    const nextButton = document.querySelector('.next-button, #toneNextBtn');
    
    toneRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.selectedTone = parseInt(radio.value);
      });
    });
    
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        this.handleToneSelection();
      });
    }
  }

  bindReadingEvents() {
    const recordButton = document.querySelector('.record-button, #recordBtn');
    const playButton = document.querySelector('.play-button, #playBtn');
    const nextSentenceBtn = document.querySelector('.next-sentence, #nextSentenceBtn');
    
    if (recordButton) {
      recordButton.addEventListener('click', () => {
        this.handleRecording();
      });
    }
    
    if (playButton) {
      playButton.addEventListener('click', () => {
        this.playCurrentSentence();
      });
    }
    
    if (nextSentenceBtn) {
      nextSentenceBtn.addEventListener('click', () => {
        this.loadNextSentence();
      });
    }
  }

  bindHomeEvents() {
    const nextButton = document.querySelector('.next, .bubble .next');
    const readingStartBtn = document.querySelector('[data-view="read"]');
    const bookmarkBtn = document.querySelector('[data-view="bookmark"]');
    const customBtn = document.querySelector('[data-view="custom"]');
    
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        this.loadNextAffirmation();
      });
    }
    
    if (readingStartBtn) {
      readingStartBtn.addEventListener('click', () => {
        this.loadView('views/read.html');
      });
    }
    
    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', () => {
        this.loadView('views/bookmark.html');
      });
    }
    
    if (customBtn) {
      customBtn.addEventListener('click', () => {
        this.loadView('views/custom.html');
      });
    }
  }

  updateSelectedProblems() {
    const checkedBoxes = document.querySelectorAll('input[name="problems"]:checked');
    this.selectedProblems = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
  }

  async handleProblemSelection() {
    if (this.selectedProblems.length === 0) {
      alert('최소 하나의 문제를 선택해주세요.');
      return;
    }
    
    // 다음 단계로 이동 (톤 선택 또는 확언 생성)
    this.loadView('views/change_tone.html');
  }

  async handleToneSelection() {
    if (!this.selectedTone) {
      alert('톤을 선택해주세요.');
      return;
    }
    
    try {
      // 사용자 설정 저장
      await this.backend.saveUserPreferences(
        this.backend.currentUser.id,
        this.selectedProblems,
        this.selectedTone
      );
      
      // 확언 생성
      this.currentAffirmations = await this.backend.generateAffirmations(
        this.selectedProblems,
        this.selectedTone
      );
      
      // 홈 화면으로 이동
      window.location.href = '/home.html';
      
    } catch (error) {
      console.error('톤 선택 처리 실패:', error);
      alert('설정 저장에 실패했습니다. 다시 시도해주세요.');
    }
  }

  async loadNextAffirmation() {
    try {
      const affirmations = await this.backend.getMainAffirmation();
      const quoteText = document.getElementById('quoteText');
      
      if (quoteText && affirmations) {
        const affirmationList = [
          affirmations.affirmation1,
          affirmations.affirmation2,
          affirmations.affirmation3
        ];
        
        const randomAffirmation = affirmationList[Math.floor(Math.random() * affirmationList.length)];
        quoteText.innerHTML = randomAffirmation;
      }
    } catch (error) {
      console.error('확언 로드 실패:', error);
    }
  }

  async handleRecording() {
    const currentSentence = this.getCurrentSentence();
    if (!currentSentence) {
      alert('읽을 문장이 없습니다.');
      return;
    }
    
    const recordButton = document.querySelector('.record-button, #recordBtn');
    if (recordButton) {
      recordButton.textContent = '녹음 중...';
      recordButton.disabled = true;
    }
    
    try {
      await this.speechManager.startRecording(
        currentSentence,
        (result) => this.handleRecognitionResult(result),
        (error) => this.handleRecognitionError(error)
      );
    } catch (error) {
      console.error('녹음 시작 실패:', error);
      this.resetRecordButton();
    }
  }

  handleRecognitionResult(result) {
    console.log('음성 인식 결과:', result);
    
    // 결과 표시
    this.displayRecognitionResult(result);
    
    // 녹음 버튼 복원
    this.resetRecordButton();
  }

  handleRecognitionError(error) {
    console.error('음성 인식 오류:', error);
    alert('음성 인식에 실패했습니다. 다시 시도해주세요.');
    this.resetRecordButton();
  }

  displayRecognitionResult(result) {
    const resultContainer = document.querySelector('.result-container, #resultContainer');
    if (resultContainer) {
      resultContainer.innerHTML = `
        <div class="recognition-result">
          <h3>인식 결과</h3>
          <p><strong>원본:</strong> ${result.originalSentence}</p>
          <p><strong>인식:</strong> ${result.recognizedText}</p>
          <p><strong>점수:</strong> ${result.score}점</p>
          <p><strong>피드백:</strong> ${result.feedback}</p>
          ${result.note ? `<p class="note">${result.note}</p>` : ''}
        </div>
      `;
      resultContainer.style.display = 'block';
    }
  }

  resetRecordButton() {
    const recordButton = document.querySelector('.record-button, #recordBtn');
    if (recordButton) {
      recordButton.textContent = '🎤 녹음하기';
      recordButton.disabled = false;
    }
  }

  getCurrentSentence() {
    const sentenceElement = document.querySelector('.current-sentence, #currentSentence, #quoteText');
    return sentenceElement ? sentenceElement.textContent.trim() : '';
  }

  playCurrentSentence() {
    const sentence = this.getCurrentSentence();
    if (!sentence) return;
    
    // TTS로 문장 읽기
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    } else {
      alert('음성 합성이 지원되지 않는 브라우저입니다.');
    }
  }

  async loadNextSentence() {
    // 다음 확언 문장 로드
    await this.loadNextAffirmation();
  }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.echoBloomApp = new EchoBloomApp();
});

// 글로벌 함수들 (기존 호환성을 위해)
function loadView(url) {
  if (window.echoBloomApp) {
    window.echoBloomApp.loadView(url);
  }
}

// 기존 앱과 호환성 유지
if (typeof window.loadView === 'undefined') {
  window.loadView = loadView;
}

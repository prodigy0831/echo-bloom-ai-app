// JavaScript로 구현한 Echo Bloom 백엔드
class EchoBloomBackend {
  constructor() {
    this.initializeData();
    this.currentUser = null;
  }

  initializeData() {
    // 카테고리 데이터 초기화
    this.categories = {
      PROBLEM: [
        { id: 1, name: "자신감 부족" },
        { id: 2, name: "불안감" },
        { id: 3, name: "우울감" },
        { id: 4, name: "스트레스" },
        { id: 5, name: "인간관계" },
        { id: 6, name: "진로 고민" },
        { id: 7, name: "학업/업무 압박" },
        { id: 8, name: "건강 걱정" }
      ],
      TONE: [
        { id: 1, name: "따뜻하고 부드러운" },
        { id: 2, name: "힘차고 강한" },
        { id: 3, name: "차분하고 안정적인" },
        { id: 4, name: "밝고 긍정적인" },
        { id: 5, name: "지혜롭고 깊이 있는" }
      ]
    };

    // 확언 문구 템플릿
    this.affirmationTemplates = {
      "자신감 부족": [
        "나는 충분히 가치 있는 사람이야",
        "나는 내가 할 수 있다고 믿어",
        "나는 매일 더 자신감 있는 사람이 되고 있어"
      ],
      "불안감": [
        "지금 이 순간, 나는 안전해",
        "나는 평온함을 선택해",
        "모든 것이 잘 될 거야"
      ],
      "우울감": [
        "나는 희망을 품고 살아가는 사람이야",
        "어둠 뒤에는 반드시 빛이 있어",
        "나는 사랑받을 자격이 있는 사람이야"
      ],
      "스트레스": [
        "나는 차분하게 하나씩 해결해 나가",
        "나는 스트레스보다 강한 사람이야",
        "지금 이 순간에 집중하면 괜찮아"
      ],
      "인간관계": [
        "나는 좋은 사람들을 만날 자격이 있어",
        "나는 진정한 관계를 만들어가는 사람이야",
        "나는 사랑하고 사랑받는 사람이야"
      ],
      "진로 고민": [
        "나는 내 길을 찾아가고 있어",
        "나는 올바른 방향으로 가고 있어",
        "나는 내 꿈을 실현할 수 있는 사람이야"
      ],
      "학업/업무 압박": [
        "나는 최선을 다하는 것만으로도 충분해",
        "나는 꾸준히 성장하고 있어",
        "나는 균형 잡힌 삶을 살 수 있어"
      ],
      "건강 걱정": [
        "나는 내 몸을 잘 돌보는 사람이야",
        "나는 건강해지고 있어",
        "나는 나 자신을 사랑하는 사람이야"
      ]
    };

    // 사용자 데이터 저장소
    this.users = JSON.parse(localStorage.getItem('echoBloom_users') || '{}');
    this.bookmarks = JSON.parse(localStorage.getItem('echoBloom_bookmarks') || '[]');
    this.customSentences = JSON.parse(localStorage.getItem('echoBloom_custom') || '[]');
  }

  // 사용자 인증 (간소화된 카카오 로그인 시뮬레이션)
  async authenticateUser(userData = null) {
    if (!userData) {
      // 기본 사용자 생성
      userData = {
        id: 'user_' + Date.now(),
        name: '체험 사용자',
        email: 'demo@echobloom.com',
        isNewUser: true
      };
    }

    this.currentUser = userData;
    
    // 신규 사용자라면 사용자 데이터 저장
    if (userData.isNewUser) {
      this.users[userData.id] = {
        ...userData,
        problems: [],
        tone: null,
        createdAt: new Date().toISOString()
      };
      this.saveUserData();
    }

    return {
      success: true,
      user: userData,
      accessToken: 'mock_access_token_' + userData.id,
      refreshToken: 'mock_refresh_token_' + userData.id
    };
  }

  // 확언 문구 생성 (Clova AI 사용)
  async generateAffirmations(problems, tone) {
    if (!problems || problems.length === 0) {
      throw new Error('문제 카테고리를 선택해주세요');
    }

    // 톤 정규화: tone1, tone2, tone3 -> 1, 2, 3
    if (typeof tone === 'string' && tone.startsWith('tone')) {
      tone = parseInt(tone.replace('tone', ''));
    }

    console.log('🎯 확언 생성 시작:', { problems, tone: tone, normalizedTone: true });

    try {
      // Clova AI Client가 있으면 사용
      if (window.clovaAIClient) {
        console.log('🤖 Clova AI로 확언 생성 시도');
        const aiResult = await window.clovaAIClient.generateAffirmations(problems, tone);
        
        console.log('🔍 Clova AI 응답 구조:', aiResult);
        console.log('🔍 affirmation1 존재 여부:', !!aiResult?.affirmation1);
        
        if (aiResult && aiResult.affirmation1 && aiResult.affirmation1.trim() !== '') {
          console.log('✅ Clova AI 확언 생성 성공 - AI 결과 반환');
          return aiResult;
        } else {
          console.log('⚠️ Clova AI 응답이 있지만 구조가 올바르지 않거나 빈 응답');
          console.log('🔍 응답 내용:', aiResult);
        }
      }
    } catch (error) {
      console.warn('⚠️ Clova AI 사용 실패, 폴백 사용:', error);
    }

    // 폴백: 기존 하드코딩된 방식
    console.log('📝 하드코딩된 확언 템플릿 사용');
    return this.generateHardcodedAffirmations(problems, tone);
  }

  // 하드코딩된 확언 생성 (폴백용)
  generateHardcodedAffirmations(problems, tone) {
    const affirmations = [];
    
    for (const problemId of problems) {
      const problem = this.categories.PROBLEM.find(p => p.id === problemId);
      if (problem) {
        const templates = this.affirmationTemplates[problem.name] || [
          "나는 할 수 있어",
          "나는 괜찮아",
          "나는 소중한 사람이야"
        ];
        
        // 톤에 따라 문구 조정
        const adjustedTemplate = this.adjustToneForAffirmation(templates, tone);
        affirmations.push(...adjustedTemplate);
      }
    }

    // 중복 제거 및 3개 선택
    const uniqueAffirmations = [...new Set(affirmations)];
    const selectedAffirmations = this.shuffleArray(uniqueAffirmations).slice(0, 3);

    return {
      affirmation1: selectedAffirmations[0] || "나는 충분히 가치 있는 사람이야",
      affirmation2: selectedAffirmations[1] || "나는 할 수 있어",
      affirmation3: selectedAffirmations[2] || "나는 사랑받을 자격이 있어"
    };
  }

  // 톤에 따른 문구 조정
  adjustToneForAffirmation(templates, toneId) {
    if (!toneId) return templates;

    const tone = this.categories.TONE.find(t => t.id === toneId);
    if (!tone) return templates;

    // 톤에 따라 문구의 어미나 표현 조정
    return templates.map(template => {
      switch (tone.name) {
        case "따뜻하고 부드러운":
          return template.replace(/야$/, '요').replace(/어$/, '어요');
        case "힘차고 강한":
          return template.replace(/야$/, '다!').replace(/어$/, '자!');
        case "차분하고 안정적인":
          return template.replace(/야$/, '다').replace(/어$/, '다');
        case "밝고 긍정적인":
          return template + " 🌟";
        case "지혜롭고 깊이 있는":
          return template.replace(/야$/, '습니다').replace(/어$/, '습니다');
        default:
          return template;
      }
    });
  }

  // 배열 섞기
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 메인 화면용 확언 가져오기
  async getMainAffirmation(userId = null) {
    const user = userId ? this.users[userId] : this.currentUser;
    
    if (user && user.problems && user.problems.length > 0) {
      return await this.generateAffirmations(user.problems, user.tone);
    }

    // 기본 확언들
    const defaultAffirmations = [
      "나는 오늘도 최고야!",
      "어려워도 괜찮아, 나는 희망을 찾을 수 있을 거야!",
      "나는 사랑받을 자격이 있는 사람이야",
      "나는 매일 조금씩 더 나아지고 있어",
      "나는 내가 원하는 삶을 살 수 있어"
    ];

    const selected = this.shuffleArray(defaultAffirmations).slice(0, 3);
    return {
      affirmation1: selected[0],
      affirmation2: selected[1],
      affirmation3: selected[2]
    };
  }

  // 북마크 관리
  async addBookmark(sentence) {
    const bookmark = {
      id: Date.now(),
      sentence: sentence,
      createdAt: new Date().toISOString(),
      userId: this.currentUser?.id || 'anonymous'
    };
    
    this.bookmarks.push(bookmark);
    localStorage.setItem('echoBloom_bookmarks', JSON.stringify(this.bookmarks));
    return bookmark;
  }

  async getBookmarks(userId = null) {
    const targetUserId = userId || this.currentUser?.id || 'anonymous';
    return this.bookmarks.filter(b => b.userId === targetUserId);
  }

  // 커스텀 문장 관리
  async addCustomSentence(sentence) {
    const custom = {
      id: Date.now(),
      sentence: sentence,
      createdAt: new Date().toISOString(),
      userId: this.currentUser?.id || 'anonymous'
    };
    
    this.customSentences.push(custom);
    localStorage.setItem('echoBloom_custom', JSON.stringify(this.customSentences));
    return custom;
  }

  async getCustomSentences(userId = null) {
    const targetUserId = userId || this.currentUser?.id || 'anonymous';
    return this.customSentences.filter(c => c.userId === targetUserId);
  }

  // 음성 인식 시뮬레이션 (Web Speech API 사용)
  async recognizeSpeech(audioBlob, originalSentence) {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        // 음성 인식 미지원시 mock 응답
        const mockResult = this.generateMockSpeechResult(originalSentence);
        resolve(mockResult);
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const recognizedText = event.results[0][0].transcript;
        const similarity = this.calculateSimilarity(originalSentence, recognizedText);
        
        resolve({
          success: true,
          recognizedText: recognizedText,
          originalSentence: originalSentence,
          similarity: similarity,
          score: Math.round(similarity * 100),
          feedback: this.generateFeedback(similarity)
        });
      };

      recognition.onerror = (event) => {
        console.error('음성 인식 오류:', event.error);
        const mockResult = this.generateMockSpeechResult(originalSentence);
        resolve(mockResult);
      };

      recognition.start();
    });
  }

  // Mock 음성 인식 결과 생성
  generateMockSpeechResult(originalSentence) {
    const variations = [
      originalSentence, // 완벽
      originalSentence.slice(0, -1), // 마지막 글자 누락
      originalSentence.replace(/는/g, '은'), // 조사 변경
      originalSentence + " 어"  // 끝에 추가
    ];
    
    const mockRecognized = variations[Math.floor(Math.random() * variations.length)];
    const similarity = this.calculateSimilarity(originalSentence, mockRecognized);
    
    return {
      success: true,
      recognizedText: mockRecognized,
      originalSentence: originalSentence,
      similarity: similarity,
      score: Math.round(similarity * 100),
      feedback: this.generateFeedback(similarity),
      note: "음성 인식 기능이 지원되지 않아 시뮬레이션 결과입니다."
    };
  }

  // 문자열 유사도 계산 (간단한 레벤슈타인 거리)
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // 레벤슈타인 거리 계산
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // 피드백 생성
  generateFeedback(similarity) {
    if (similarity >= 0.9) {
      return "훌륭해요! 완벽한 발음이에요! 🎉";
    } else if (similarity >= 0.7) {
      return "잘했어요! 조금만 더 연습하면 완벽해질 거예요! 👍";
    } else if (similarity >= 0.5) {
      return "괜찮아요! 천천히 또박또박 말해보세요! 😊";
    } else {
      return "다시 한 번 도전해보세요! 할 수 있어요! 💪";
    }
  }

  // 사용자 데이터 저장
  saveUserData() {
    localStorage.setItem('echoBloom_users', JSON.stringify(this.users));
  }

  // 카테고리 가져오기
  getCategories(type) {
    return this.categories[type] || [];
  }

  // 사용자 설정 저장
  async saveUserPreferences(userId, problems, tone) {
    if (!this.users[userId]) {
      this.users[userId] = { id: userId };
    }
    
    this.users[userId].problems = problems;
    this.users[userId].tone = tone;
    this.users[userId].updatedAt = new Date().toISOString();
    
    this.saveUserData();
    return true;
  }
}

// 전역 인스턴스 생성
window.echoBloomBackend = new EchoBloomBackend();

// Clova AI Studio API 클라이언트
class ClovaAIClient {
  constructor() {
    // API 키는 실제 환경에서는 환경변수나 설정파일에서 가져와야 합니다
    // 현재는 테스트용으로 하드코딩 (실제 배포시에는 서버에서 처리해야 함)
    this.API_URL = 'https://clovastudio.stream.ntruss.com/v3/chat-completions/HCX-005';
    this.API_KEY = null; // 실제 API 키가 필요합니다
    
    // 요청 파라미터 (간단하게 설정)
    this.DEFAULT_CONFIG = {
      topP: 0.7,
      topK: 0,
      maxTokens: 100,
      temperature: 0.3,
      repetitionPenalty: 1.2,
      includeAiFilters: true
    };
    
    // 저장된 API 키 자동 로드
    this.loadSavedApiKey();
    
    console.log('🤖 Clova AI Client 초기화됨');
  }

  // 저장된 API 키 로드
  loadSavedApiKey() {
    try {
      // 사용자 제공 API 키 우선 설정
      const userApiKey = 'nv-81cca15968a740c295bdd009256e6111TYA4';
      if (userApiKey) {
        this.API_KEY = userApiKey;
        localStorage.setItem('clova_api_key', userApiKey);
        console.log('🔑 사용자 제공 Clova API 키 설정됨');
        return;
      }
      
      const savedKey = localStorage.getItem('clova_api_key');
      if (savedKey) {
        this.API_KEY = savedKey;
        console.log('🔑 저장된 Clova API 키 로드됨');
      }
    } catch (error) {
      console.warn('⚠️ API 키 로드 실패:', error);
    }
  }

  // API 키 설정
  setApiKey(apiKey) {
    this.API_KEY = apiKey;
    if (apiKey) {
      localStorage.setItem('clova_api_key', apiKey);
      console.log('🔑 Clova API 키 설정 및 저장됨');
    } else {
      localStorage.removeItem('clova_api_key');
      console.log('🗑️ Clova API 키 삭제됨');
    }
  }

  // UUID 생성기
  generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  }

  // 확언 문구 생성을 위한 메인 메소드
  async generateAffirmations(problemIds, toneId) {
    console.log('🎯 Clova AI로 확언 생성 시작:', { problemIds, toneId });
    
    if (!this.API_KEY) {
      console.warn('⚠️ Clova API 키가 없어서 Mock 데이터 사용');
      return this.generateMockAffirmations(problemIds, toneId);
    }

    try {
      // 문제 이름 가져오기
      const problemNames = this.getProblemNames(problemIds);
      const selectedProblem = problemNames[Math.floor(Math.random() * problemNames.length)];
      
      // 메인 확언 3개 생성
      const affirmations = [];
      for (let i = 0; i < 3; i++) {
        const prompt = this.createMainAffirmationPrompt(selectedProblem, toneId, i + 1);
        console.log(`🎯 확언 ${i+1}/3 생성 중...`);
        const affirmation = await this.callClovaAPI(prompt);
        console.log(`✅ 확언 ${i+1} 생성됨:`, affirmation);
        affirmations.push(affirmation);
      }
      
      const result = {
        affirmation1: affirmations[0],
        affirmation2: affirmations[1], 
        affirmation3: affirmations[2]
      };
      
      console.log('🎊 최종 Clova AI 확언 결과:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Clova AI 호출 실패:', error);
      console.log('📝 Mock 데이터로 폴백');
      return this.generateMockAffirmations(problemIds, toneId);
    }
  }

  // 톤 예시 생성
  async generateToneExamples(problemIds) {
    console.log('🎨 Clova AI로 톤 예시 생성:', problemIds);
    
    if (!this.API_KEY) {
      return this.generateMockToneExamples(problemIds);
    }

    try {
      const problemNames = this.getProblemNames(problemIds);
      const selectedProblem = problemNames[0]; // 첫 번째 문제 사용
      
      const prompt = this.createToneExamplesPrompt(selectedProblem);
      const response = await this.callClovaAPI(prompt);
      
      // Joy, Wednesday, Zelda 패턴으로 파싱
      const tones = this.parseTonesFromResponse(response);
      
      return {
        success: true,
        tone1: tones.Joy || "나는 충분히 가치 있는 사람이야!",
        tone2: tones.Wednesday || "나는 할 수 있다.",
        tone3: tones.Zelda || "저는 제 자신을 믿고 나아가겠습니다."
      };
      
    } catch (error) {
      console.error('❌ 톤 예시 생성 실패:', error);
      return this.generateMockToneExamples(problemIds);
    }
  }

  // Clova API 호출
  async callClovaAPI(prompt) {
    const requestId = this.generateRequestId();
    
    const requestBody = {
      messages: [{ role: "system", content: prompt }],
      ...this.DEFAULT_CONFIG
    };

    console.log('📤 Clova 프록시 요청:', { requestId, prompt: prompt.substring(0, 100) + '...' });

    try {
      // 프록시 서버로 요청
      const proxyUrl = 'http://127.0.0.1:3002/clova-proxy';
      const proxyData = {
        ...requestBody,
        apiKey: this.API_KEY,
        requestId: requestId
      };
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proxyData)
      });

      if (!response.ok) {
        throw new Error(`프록시 서버 오류: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      
      if (responseData.success) {
        console.log('✅ 프록시를 통한 Clova AI 응답 성공');
        console.log('📄 Clova AI 응답 내용:', responseData.content);
        
        // 빈 응답 체크
        if (!responseData.content || responseData.content.trim() === '') {
          console.warn('⚠️ Clova AI 응답이 비어있음');
          throw new Error('빈 응답');
        }
        
        return responseData.content;
      } else {
        throw new Error(`Clova API 오류: ${responseData.error}`);
      }
      
    } catch (error) {
      console.error('❌ Clova API 호출 오류:', error);
      throw error;
    }
  }

  // SSE 응답에서 컨텐츠 추출
  extractContentFromSSE(sseData) {
    const lines = sseData.split('\n');
    let content = '';
    
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = line.substring(5).trim();
        if (data && data !== '[DONE]') {
          try {
            const json = JSON.parse(data);
            if (json.message && json.message.content) {
              content += json.message.content;
            }
          } catch (e) {
            console.warn('JSON 파싱 실패:', data);
          }
        }
      }
    }
    
    return content.trim().replace(/\*\*|#/g, '').replace(/"/g, '');
  }

  // 메인 확언을 위한 프롬프트 생성
    createMainAffirmationPrompt(problemText, toneId, orderNumber) {
    const toneName = this.getToneName(toneId);

    return `${problemText} 문제를 가진 사용자를 위한 ${toneName} 톤의 확언 문구를 하나만 생성해주세요.

요구사항:
- 1인칭으로 작성 ("나는", "내가")
- ${toneName} 톤 반영
- 30-80자 길이
- 확언 문구만 출력

예시: "나는 매일 더 강해지고 있어"`;
  }

  // 톤 예시를 위한 프롬프트 생성 (원본 백엔드와 동일)
  createToneExamplesPrompt(problemText) {
    return `문제: "${problemText}"
이 문제에 대해 아래의 가이드를 반영해서 3가지 다른 톤의 짧은 확언 문장을 생성해.

[역할] 너는 아래 세 캐릭터의 말투와 세계관을 이미 학습한 변환기다. 하나의 '중립적인 자기 확언(Neutral)'이 주어지면, 각 캐릭터가 스스로에게 말하듯 1인칭 확언으로 동시에 변환해 출력한다.

[캐릭터 말투 규칙]
1) Joy (인사이드 아웃) - 밝고 낙관적, 경쾌한 리듬. 따뜻하고 에너지 넘침.
- 말투: 친근하고 다정한 구어체. 종결은 "~어", "~야", "~할 거야", "~고 있어" 위주. 자연스럽고 따뜻한 표현.

2) Wednesday (Wednesday Addams) - 담담한 설캐즘 + 긍정의 핵심 유지. 짧고 단호.
- 말투: 건조하지만 확신에 찬 문장. 종결 "~다", "~어", "~을 수 있어" 선호. 명령형("~자") 피하기.

3) Zelda (젤다의 전설) - 진중하고 차분한 존댓말. 품격 있는 단어 선택.
- 말투: 1인칭 자기 격려. 자연스러운 구어 존댓말 사용. 종결은 "~습니다", "~겠습니다", "~할 수 있습니다" 위주.

[출력 형식 — 정확히 아래 세 줄만 출력하고 절대 중복하지 말 것]
Joy: "<문장>"
Wednesday: "<문장>"
Zelda: "<문장>"

[중요: 위 3줄 이후 어떤 내용도 추가하지 말고 즉시 종료할 것]`;
  }

  // 톤 응답 파싱
  parseTonesFromResponse(response) {
    const tones = {};
    const lines = response.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('Joy:')) {
        tones.Joy = trimmedLine.substring(4).trim().replace(/^["']|["']$/g, '');
      } else if (trimmedLine.startsWith('Wednesday:')) {
        tones.Wednesday = trimmedLine.substring(10).trim().replace(/^["']|["']$/g, '');
      } else if (trimmedLine.startsWith('Zelda:')) {
        tones.Zelda = trimmedLine.substring(6).trim().replace(/^["']|["']$/g, '');
      }
    }
    
    return tones;
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
      3: '차분하고 안정적인',
      4: '밝고 긍정적인',
      5: '지혜롭고 깊이 있는',
      'tone1': '따뜻하고 부드러운',
      'tone2': '힘차고 강한',
      'tone3': '차분하고 안정적인'
    };
    
    return toneMap[toneId] || '따뜻하고 부드러운';
  }

  // Mock 확언 생성 (API 키가 없을 때 사용)
  generateMockAffirmations(problemIds, toneId) {
    console.log('🎭 Mock 확언 생성:', { problemIds, toneId });
    
    // 톤별 확언 스타일
    const toneStyles = {
      1: { // 따뜻하고 부드러운
        suffix: ["어", "야", "고 있어", "할 수 있어"],
        prefix: ["나는", "내가", "오늘의 나는"]
      },
      2: { // 힘차고 강한
        suffix: ["다!", "할 것이다!", "해낼 거야!", "할 수 있다!"],
        prefix: ["나는", "내가", "나는 반드시"]
      },
      3: { // 차분하고 안정적인
        suffix: ["습니다", "할 수 있습니다", "되어가고 있습니다", "것입니다"],
        prefix: ["나는", "저는", "나는 천천히"]
      }
    };
    
    const mockAffirmations = {
      1: { // 일상에 활력이 없어요
        1: ["나는 활력 넘치는 하루를 만들어가고 있어", "나는 에너지가 충만한 사람이야", "나는 삶의 즐거움을 발견해나가고 있어"],
        2: ["나는 강하게 일어나 새로운 활력을 찾아낼 것이다!", "나는 에너지 넘치는 삶을 만들어갈 것이다!", "나는 활력 가득한 하루를 만들어낼 거야!"],
        3: ["나는 점점 더 활기찬 삶을 살아가고 있습니다", "나는 매일 조금씩 더 에너지 넘치는 사람이 되어가고 있습니다", "나는 활력을 되찾아가고 있습니다"]
      },
      2: { // 계획을 끝내지 못하고 집중력이 떨어져요
        1: ["나는 집중력을 키워가고 있어", "나는 한 걸음씩 목표를 이뤄가고 있어", "나는 계획을 실행할 힘이 있어"],
        2: ["나는 집중력을 완전히 되찾을 것이다!", "나는 모든 계획을 끝까지 해낼 것이다!", "나는 강한 의지로 목표를 달성할 거야!"],
        3: ["나는 집중력이 점점 향상되고 있습니다", "나는 계획 실행 능력이 개선되고 있습니다", "나는 한 걸음씩 성장해나가고 있습니다"]
      },
      3: { // 걱정이 많고 불안해요
        1: ["나는 평온함을 선택해", "나는 걱정보다 희망에 집중해", "나는 마음의 안정을 찾아가고 있어"],
        2: ["나는 불안을 이겨내고 평온을 찾을 것이다!", "나는 강한 마음으로 걱정을 극복할 거야!", "나는 확신을 가지고 불안을 물리칠 것이다!"],
        3: ["나는 점점 더 평온해지고 있습니다", "나는 걱정이 줄어들고 있습니다", "나는 마음의 안정을 되찾아가고 있습니다"]
      },
      4: { // 과거를 후회해요
        1: ["나는 과거를 받아들이고 현재에 집중해", "나는 과거로부터 배우며 성장해", "나는 오늘에 집중할 수 있어"],
        2: ["나는 과거를 완전히 극복하고 앞으로 나아갈 것이다!", "나는 후회를 떨치고 새로운 미래를 만들어갈 거야!", "나는 과거에 얽매이지 않고 당당히 살아갈 것이다!"],
        3: ["나는 과거를 천천히 받아들여가고 있습니다", "나는 과거의 상처에서 회복되어가고 있습니다", "나는 현재에 더 집중할 수 있게 되어가고 있습니다"]
      },
      5: { // 스스로가 부족하게 느껴지고 자신감이 없어요
        1: ["나는 충분히 가치 있는 사람이야", "나는 내 자신을 믿고 있어", "나는 매일 더 자신감 있는 사람이 되고 있어"],
        2: ["나는 자신감을 완전히 되찾을 것이다!", "나는 당당하고 확신에 찬 사람이 될 거야!", "나는 자신감 넘치는 삶을 살아갈 것이다!"],
        3: ["나는 점점 더 자신감이 생기고 있습니다", "나는 자존감이 향상되어가고 있습니다", "나는 내 가치를 인정해가고 있습니다"]
      },
      6: { // 누군가를 용서하는 것이 어려워요
        1: ["나는 용서의 힘을 배워가고 있어", "나는 마음의 평화를 선택해", "나는 화를 내려놓고 있어"],
        2: ["나는 용서를 통해 자유로워질 것이다!", "나는 원한을 버리고 평온을 얻을 거야!", "나는 용서의 힘으로 성장할 것이다!"],
        3: ["나는 천천히 용서를 배워가고 있습니다", "나는 마음의 짐을 조금씩 내려놓고 있습니다", "나는 평화로운 마음을 만들어가고 있습니다"]
      },
      7: { // 외롭고 소속감을 느끼기 힘들어요
        1: ["나는 소중한 연결을 만들어가고 있어", "나는 혼자가 아니야", "나는 따뜻한 사람들을 만날 거야"],
        2: ["나는 진정한 소속감을 찾아낼 것이다!", "나는 의미 있는 관계를 만들어갈 거야!", "나는 외로움을 극복하고 연결될 것이다!"],
        3: ["나는 점점 더 많은 사람들과 연결되고 있습니다", "나는 소속감을 천천히 찾아가고 있습니다", "나는 따뜻한 관계를 만들어가고 있습니다"]
      },
      8: { // 뭘 위해 살아야 하는지 모르겠어요
        1: ["나는 내 삶의 의미를 찾아가고 있어", "나는 하루하루 목적을 발견해", "나는 작은 기쁨에서 의미를 찾아"],
        2: ["나는 반드시 내 삶의 목적을 찾아낼 것이다!", "나는 의미 있는 삶을 만들어갈 거야!", "나는 나만의 길을 개척해나갈 것이다!"],
        3: ["나는 천천히 삶의 방향을 찾아가고 있습니다", "나는 매일 작은 의미를 발견해가고 있습니다", "나는 나만의 목적을 찾아가고 있습니다"]
      },
      9: { // 내가 모든 걸 망친 것 같고 제자리를 느껴요
        1: ["나는 다시 시작할 수 있어", "나는 실수에서 배우고 있어", "나는 조금씩 앞으로 나아가고 있어"],
        2: ["나는 모든 것을 새롭게 시작할 것이다!", "나는 실패를 딛고 성공을 만들어낼 거야!", "나는 반드시 원하는 곳에 도달할 것이다!"],
        3: ["나는 천천히 회복해가고 있습니다", "나는 작은 진전을 만들어가고 있습니다", "나는 새로운 기회를 만들어가고 있습니다"]
      }
    };
    
    // 톤 ID 정규화 (tone1, tone2, tone3 -> 1, 2, 3)
    const normalizedToneId = typeof toneId === 'string' ? parseInt(toneId.replace('tone', '')) : toneId;
    const finalToneId = [1, 2, 3].includes(normalizedToneId) ? normalizedToneId : 2; // 기본값: 힘차고 강한
    
    console.log('🎨 사용할 톤 ID:', finalToneId, `(${this.getToneName(finalToneId)})`);
    
    // 선택된 문제들의 확언 수집
    let allAffirmations = [];
    
    problemIds.forEach(problemId => {
      const problemAffirmations = mockAffirmations[problemId];
      if (problemAffirmations && problemAffirmations[finalToneId]) {
        allAffirmations.push(...problemAffirmations[finalToneId]);
      }
    });
    
    // 부족한 경우 기본 확언 추가
    if (allAffirmations.length < 3) {
      const defaultByTone = {
        1: ["나는 소중한 사람이야", "나는 오늘도 좋은 하루를 만들어가고 있어", "나는 충분히 사랑받을 자격이 있어"],
        2: ["나는 무엇이든 해낼 수 있다!", "나는 오늘도 강하게 이겨낼 거야!", "나는 반드시 성공할 것이다!"],
        3: ["나는 차분하게 성장해나가고 있습니다", "나는 매일 조금씩 더 나아지고 있습니다", "나는 안정적으로 발전하고 있습니다"]
      };
      allAffirmations.push(...defaultByTone[finalToneId]);
    }
    
    // 중복 제거 후 3개 선택
    const uniqueAffirmations = [...new Set(allAffirmations)];
    const shuffled = uniqueAffirmations.sort(() => Math.random() - 0.5);
    
    return {
      affirmation1: shuffled[0] || "나는 충분히 가치 있는 사람이야",
      affirmation2: shuffled[1] || "나는 할 수 있어",
      affirmation3: shuffled[2] || "나는 사랑받을 자격이 있어"
    };
  }

  // Mock 톤 예시 생성
  generateMockToneExamples(problemIds) {
    return {
      success: true,
      tone1: "나는 오늘도 밝고 긍정적으로 살아갈 거야!",
      tone2: "나는 어떤 어려움도 이겨낼 수 있다.",
      tone3: "저는 제 자신을 믿고 꾸준히 나아가겠습니다."
    };
  }
}

// 전역 인스턴스 생성
window.clovaAIClient = new ClovaAIClient();

console.log('🤖 Clova AI Client 로드 완료');

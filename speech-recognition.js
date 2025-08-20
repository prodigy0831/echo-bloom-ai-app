// 음성 인식 기능
class SpeechRecognitionManager {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recognition = null;
    this.currentSentence = '';
    this.onResult = null;
    this.onError = null;
    
    this.initializeSpeechRecognition();
  }

  initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.lang = 'ko-KR';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        console.log('음성 인식 시작');
      };

      this.recognition.onresult = (event) => {
        const recognizedText = event.results[0][0].transcript;
        this.handleRecognitionResult(recognizedText);
      };

      this.recognition.onerror = (event) => {
        console.error('음성 인식 오류:', event.error);
        this.handleRecognitionError(event.error);
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        console.log('음성 인식 종료');
      };
    }
  }

  async startRecording(sentence, onResult, onError) {
    this.currentSentence = sentence;
    this.onResult = onResult;
    this.onError = onError;

    if (this.recognition) {
      try {
        this.isRecording = true;
        this.recognition.start();
      } catch (error) {
        console.error('음성 인식 시작 실패:', error);
        this.fallbackToMockRecognition();
      }
    } else {
      // Web Speech API 미지원시 폴백
      this.fallbackToMockRecognition();
    }
  }

  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
    this.isRecording = false;
  }

  handleRecognitionResult(recognizedText) {
    if (this.onResult) {
      const result = window.echoBloomBackend.generateMockSpeechResult(this.currentSentence);
      result.recognizedText = recognizedText;
      result.similarity = window.echoBloomBackend.calculateSimilarity(this.currentSentence, recognizedText);
      result.score = Math.round(result.similarity * 100);
      result.feedback = window.echoBloomBackend.generateFeedback(result.similarity);
      
      this.onResult(result);
    }
  }

  handleRecognitionError(error) {
    console.error('Recognition error:', error);
    if (this.onError) {
      this.onError(error);
    } else {
      // 에러시에도 mock 결과 제공
      this.fallbackToMockRecognition();
    }
  }

  fallbackToMockRecognition() {
    // 사용자에게 직접 입력받기
    setTimeout(() => {
      const userInput = prompt('음성 인식이 지원되지 않습니다. 문장을 직접 입력해주세요:\n\n원본: ' + this.currentSentence);
      
      if (userInput !== null) {
        this.handleRecognitionResult(userInput);
      } else {
        // 입력하지 않으면 mock 결과 생성
        const mockResult = window.echoBloomBackend.generateMockSpeechResult(this.currentSentence);
        if (this.onResult) {
          this.onResult(mockResult);
        }
      }
    }, 500);
  }

  // 마이크 권한 요청
  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // 스트림 정리
      return true;
    } catch (error) {
      console.error('마이크 권한 거부:', error);
      return false;
    }
  }
}

// 전역 인스턴스 생성
window.speechRecognitionManager = new SpeechRecognitionManager();

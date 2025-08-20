# 🌸 Echo Bloom - AI 기반 긍정 확언 앱

Echo Bloom은 사용자의 개인적인 문제와 선호하는 톤에 맞춰 AI가 생성하는 맞춤형 긍정 확언을 제공하는 웹 애플리케이션입니다.

## ✨ 주요 기능

- **🎯 맞춤형 확언**: 9가지 문제 유형과 3가지 톤 중 선택하여 개인화된 확언 생성
- **🤖 AI 생성**: Clova AI Studio를 활용한 자연스럽고 다양한 확언 문구
- **🎤 음성 인식**: Web Speech API를 통한 확언 읽기 및 정확도 측정
- **🔖 북마크**: 마음에 드는 확언을 저장하고 관리
- **⚙️ 설정 관리**: 언제든지 문제와 톤 변경 가능

## 🚀 빠른 시작

### 1. 프로젝트 클론

```bash
git clone https://github.com/YOUR_USERNAME/echo-bloom-front.git
cd echo-bloom-front
```

### 2. 로컬 서버 실행

```bash
# Python 3가 설치되어 있는 경우
python3 -m http.server 3001

# 또는 Node.js가 있는 경우
npx serve -s . -l 3001
```

### 3. Clova AI 프록시 서버 실행 (선택사항)

AI 기반 확언 생성을 위해서는 Clova AI 프록시가 필요합니다:

```bash
# Flask 설치
pip3 install flask flask-cors requests

# 프록시 서버 실행
python3 clova-proxy.py
```

### 4. 앱 접속

브라우저에서 `http://localhost:3001`에 접속하여 Echo Bloom을 사용하세요.

## 🛠️ 기술 스택

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI Integration**: Clova AI Studio API
- **Speech Recognition**: Web Speech API
- **Storage**: LocalStorage
- **Server**: Python Flask (프록시), Python HTTP Server

## 📁 프로젝트 구조

```
echo-bloom-front/
├── index.html              # 랜딩 페이지
├── main.html              # 메인 진입점
├── home.html              # 확언 메인 화면
├── views/                 # 화면별 HTML 파일들
│   ├── intro*.html       # 소개 페이지들
│   ├── search*.html      # 설문 조사 페이지들
│   ├── mypage.html       # 마이페이지
│   └── ...
├── js-backend.js          # JavaScript 백엔드 로직
├── mock-server.js         # API 모킹 서버
├── clova-ai-client.js     # Clova AI 연동 클라이언트
├── speech-recognition.js  # 음성 인식 기능
├── clova-proxy.py         # Clova AI CORS 우회 프록시
├── app_*.js              # 페이지별 JavaScript 파일들
└── img/                  # 이미지 리소스
```

## ⚙️ 설정

### Clova AI API 키 설정

1. [Clova AI Studio](https://clovastudio.stream.ntruss.com/)에서 API 키 발급
2. 앱 내에서 API 설정 페이지에서 키 입력
3. 또는 `clova-ai-client.js`에서 직접 설정

```javascript
// clova-ai-client.js
this.API_KEY = 'your-api-key-here';
```

## 🎯 사용 방법

### 1. 초기 설정
- 앱 첫 실행 시 소개 페이지를 통해 Echo Bloom에 대해 학습
- 설문을 통해 해결하고 싶은 문제 3개와 선호하는 톤 1개 선택

### 2. 확언 사용
- 메인 화면에서 개인화된 확언 확인
- "읽기 시작!" 버튼으로 음성 인식 모드 진입
- 확언을 소리내어 읽고 정확도 확인

### 3. 설정 관리
- 마이페이지에서 문제와 톤 변경 가능
- 북마크한 확언 관리
- 개인 설정은 LocalStorage에 자동 저장

## 🔧 개발 정보

### Mock Server API

프로젝트는 Mock Server를 통해 백엔드 API를 시뮬레이션합니다:

- `/api/v1/affirmations/main` - 메인 확언 생성
- `/api/v1/affirmations/tone-examples` - 톤 예시 생성
- `/api/v1/user/problems` - 사용자 문제 업데이트
- `/api/v1/user/tone` - 사용자 톤 업데이트
- `/api/users/me/categories` - 사용자 설정 조회

### 로컬 개발

```bash
# 프론트엔드 서버 (포트 3001)
python3 -m http.server 3001

# Clova AI 프록시 서버 (포트 3002)
python3 clova-proxy.py
```

## 📝 라이센스

이 프로젝트는 개인 프로젝트로 제작되었습니다.

## 🤝 기여

버그 리포트나 기능 제안은 Issues를 통해 제출해 주세요.

---

**Echo Bloom**으로 매일 긍정적인 에너지를 충전하세요! 🌸✨

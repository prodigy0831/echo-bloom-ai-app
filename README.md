# Clova AI Proxy for Vercel

GitHub Pages에서 Clova AI API를 사용하기 위한 CORS 우회 프록시 서버입니다.

## 기능

- ✅ **CORS 우회**: GitHub Pages에서 Clova AI 직접 호출 불가 문제 해결
- ✅ **보안**: 허용된 도메인에서만 접근 가능
- ✅ **SSE 처리**: Clova Studio의 Server-Sent Events 응답 처리
- ✅ **에러 핸들링**: 상세한 오류 메시지 및 로깅

## 배포 방법

### 1. Vercel에 배포

```bash
# Vercel CLI 설치 (글로벌)
npm install -g vercel

# 로그인
vercel login

# 배포
vercel --prod
```

### 2. 환경 설정

- **허용된 도메인**: `https://prodigy0831.github.io`
- **API 엔드포인트**: `/api/clova`
- **최대 실행 시간**: 30초

## API 사용법

### 요청

```javascript
const response = await fetch('https://your-proxy.vercel.app/api/clova', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    apiKey: 'your-clova-api-key',
    requestId: 'unique-request-id',
    messages: [
      {
        role: 'user',
        content: 'your-prompt'
      }
    ],
    maxTokens: 200,
    temperature: 0.7,
    repeatPenalty: 1.2
  })
});

const result = await response.json();
```

### 응답

```javascript
{
  "success": true,
  "content": "Clova AI의 응답 내용"
}
```

## 보안

- CORS 헤더로 허용된 도메인만 접근 가능
- API 키는 요청 시에만 사용되며 저장되지 않음
- 요청 로그에서 API 키는 일부만 표시

## 제한사항

- POST 요청만 허용
- 최대 30초 실행 시간
- Vercel의 Serverless Function 제한 적용

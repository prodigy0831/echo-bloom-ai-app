// Vercel Serverless Function for Clova AI Proxy
// GitHub Pages에서 Clova AI 사용을 위한 CORS 우회 프록시

export default async function handler(req, res) {
  // CORS 헤더 설정 - 모든 도메인 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    console.log('🔧 OPTIONS 요청 처리됨');
    return res.status(200).end();
  }
  
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Only POST is supported.' 
    });
  }
  
  try {
    const { apiKey, requestId, ...requestBody } = req.body;
    
    // API 키 검증
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }
    
    // Clova Studio API 호출
    const CLOVA_API_URL = 'https://clovastudio.stream.ntruss.com/v3/chat-completions/HCX-005';
    
    console.log('🚀 Vercel Proxy: Clova AI 요청 전달');
    console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
    console.log('📝 Request ID:', requestId);
    
    const response = await fetch(CLOVA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-NCP-CLOVASTUDIO-REQUEST-ID': requestId,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      console.error('❌ Clova API 오류:', response.status, response.statusText);
      return res.status(response.status).json({
        success: false,
        error: `Clova API error: ${response.status} ${response.statusText}`
      });
    }
    
    // SSE 응답 처리
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const jsonData = JSON.parse(line.substring(5));
              if (jsonData.messages && jsonData.messages.length > 0) {
                for (const msg of jsonData.messages) {
                  if (msg.role === 'assistant' && msg.content) {
                    fullContent += msg.content;
                  }
                }
              }
            } catch (parseError) {
              // JSON 파싱 에러 무시 (SSE의 빈 라인 등)
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    if (!fullContent.trim()) {
      console.warn('⚠️ Clova AI 빈 응답 반환');
      return res.status(500).json({
        success: false,
        error: 'Clova AI returned empty response'
      });
    }
    
    console.log('✅ Vercel Proxy: Clova AI 응답 성공');
    console.log('📄 응답 길이:', fullContent.length, 'chars');
    
    return res.status(200).json({
      success: true,
      content: fullContent.trim()
    });
    
  } catch (error) {
    console.error('❌ Vercel Proxy 오류:', error);
    return res.status(500).json({
      success: false,
      error: `Proxy error: ${error.message}`
    });
  }
}
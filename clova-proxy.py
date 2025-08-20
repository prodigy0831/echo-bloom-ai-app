#!/usr/bin/env python3
"""
Clova AI Proxy Server
브라우저 CORS 문제 해결을 위한 프록시 서버
"""

import json
import requests
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

class ClovaProxyHandler(BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        """CORS preflight 요청 처리"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_POST(self):
        """Clova AI API 프록시"""
        if self.path == '/clova-proxy':
            self.handle_clova_request()
        else:
            self.send_response(404)
            self.end_headers()
    
    def handle_clova_request(self):
        """Clova AI 요청 프록시"""
        try:
            # 요청 데이터 읽기
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            logger.info(f"📤 Clova 프록시 요청: {request_data.get('requestId', 'unknown')}")
            logger.info(f"🔑 API 키: {request_data['apiKey'][:10]}...")
            logger.info(f"📝 프롬프트: {str(request_data.get('messages', []))[:100]}...")
            
            # Clova AI API 호출
            clova_url = "https://clovastudio.stream.ntruss.com/v3/chat-completions/HCX-005"
            headers = {
                'Authorization': f"Bearer {request_data['apiKey']}",
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            }
            
            # API 키 제거 후 Clova에 전송
            clova_data = {k: v for k, v in request_data.items() if k != 'apiKey'}
            logger.info(f"📦 Clova로 전송할 데이터: {json.dumps(clova_data, ensure_ascii=False)[:200]}...")
            
            response = requests.post(
                clova_url, 
                headers=headers, 
                json=clova_data,
                stream=True,
                timeout=30
            )
            
            if response.status_code == 200:
                # SSE 응답 파싱
                content = ""
                for line in response.iter_lines(decode_unicode=True):
                    if line.startswith('data: '):
                        try:
                            data = json.loads(line[6:])
                            if 'message' in data and 'content' in data['message']:
                                content += data['message']['content']
                        except json.JSONDecodeError:
                            continue
                
                logger.info(f"✅ Clova 응답 성공: {len(content)} chars")
                
                # 성공 응답
                self.send_response(200)
                self.send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response_data = {
                    'success': True,
                    'content': content.strip(),
                    'requestId': request_data.get('requestId')
                }
                self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))
                
            else:
                logger.error(f"❌ Clova API 에러: {response.status_code}")
                self.send_error_response(f"Clova API returned {response.status_code}")
                
        except Exception as e:
            logger.error(f"❌ 프록시 에러: {str(e)}")
            self.send_error_response(str(e))
    
    def send_cors_headers(self):
        """CORS 헤더 전송"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    def send_error_response(self, error_message):
        """에러 응답 전송"""
        self.send_response(500)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        error_data = {
            'success': False,
            'error': error_message
        }
        self.wfile.write(json.dumps(error_data, ensure_ascii=False).encode('utf-8'))
    
    def log_message(self, format, *args):
        """로그 메시지 억제 (우리가 직접 로깅하므로)"""
        pass

def run_proxy_server(port=3002):
    """프록시 서버 실행"""
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, ClovaProxyHandler)
    
    logger.info(f"🚀 Clova 프록시 서버 시작: http://127.0.0.1:{port}")
    logger.info(f"📡 프록시 엔드포인트: http://127.0.0.1:{port}/clova-proxy")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("🛑 프록시 서버 종료")
        httpd.shutdown()

if __name__ == '__main__':
    run_proxy_server()

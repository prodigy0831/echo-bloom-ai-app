<?php
// /api/survey.php
// 임시 시험 구동용 백엔드 (세션 + 임시 파일 저장)

// ---- 옵션: CORS(필요하면 주석 해제) ----
// if (isset($_SERVER['HTTP_ORIGIN'])) {
//   header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
//   header('Vary: Origin');
//   header('Access-Control-Allow-Credentials: true');
// }
// if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
//   header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
//   header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
//   exit;
// }

header('Content-Type: application/json; charset=utf-8');
session_start();

$storeFile = sys_get_temp_dir() . '/survey_' . session_id() . '.json';

// 유틸: 현재 저장값 로드
function load_state($file) {
  $state = ['problems' => [], 'tone' => null];
  if (isset($_SESSION['__SURVEY__'])) {
    $state = array_merge($state, $_SESSION['__SURVEY__']);
  } elseif (is_file($file)) {
    $json = @file_get_contents($file);
    if ($json !== false) {
      $data = json_decode($json, true);
      if (is_array($data)) $state = array_merge($state, $data);
    }
  }
  return $state;
}

// 유틸: 저장
function save_state($file, $state) {
  $_SESSION['__SURVEY__'] = $state;
  @file_put_contents($file, json_encode($state, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT));
}

// 유틸: 에러 응답
function bad_request($msg, $code = 400) {
  http_response_code($code);
  echo json_encode(['ok' => false, 'message' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

// 본문 JSON 파서 (POST/DELETE만)
function read_json_body() {
  $raw = file_get_contents('php://input');
  if ($raw === '' || $raw === false) return [];
  $data = json_decode($raw, true);
  if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    bad_request('Invalid JSON body');
  }
  return $data ?: [];
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
  case 'GET': {
    $state = load_state($storeFile);
    echo json_encode(['ok' => true, 'data' => $state], JSON_UNESCAPED_UNICODE);
    break;
  }

  case 'POST': {
    $body = read_json_body();
    if (!array_key_exists('problems', $body) && !array_key_exists('tone', $body)) {
      bad_request('Nothing to update: provide "problems" (array) or "tone" (string).');
    }

    $state = load_state($storeFile);

    // problems 검증/적용 (옵션 필드)
    if (array_key_exists('problems', $body)) {
      if (!is_array($body['problems'])) bad_request('"problems" must be an array.');
      // 문자열 배열로 정규화
      $problems = array_values(array_map(function($v){ return (string)$v; }, $body['problems']));
      // 중복 제거
      $problems = array_values(array_unique($problems));
      // 최대 3개 제한
      if (count($problems) < 1 || count($problems) > 3) {
        bad_request('"problems" must contain between 1 and 3 items.');
      }
      $state['problems'] = $problems;
    }

    // tone 검증/적용 (옵션 필드)
    if (array_key_exists('tone', $body)) {
      $tone = (string)$body['tone'];
      if (trim($tone) === '') bad_request('"tone" must be a non-empty string.');
      $state['tone'] = $tone;
    }

    save_state($storeFile, $state);
    echo json_encode(['ok' => true, 'data' => $state], JSON_UNESCAPED_UNICODE);
    break;
  }

  case 'DELETE': {
    // 전체 초기화
    unset($_SESSION['__SURVEY__']);
    @unlink($storeFile);
    echo json_encode(['ok' => true, 'data' => ['problems' => [], 'tone' => null]], JSON_UNESCAPED_UNICODE);
    break;
  }

  default: {
    http_response_code(405);
    header('Allow: GET, POST, DELETE');
    echo json_encode(['ok' => false, 'message' => 'Method Not Allowed'], JSON_UNESCAPED_UNICODE);
  }
}

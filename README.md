# TheWarWithin

내전(팀 게임) 승률을 추적하고 관리하는 웹 기반 통계 관리 애플리케이션

## 개요

**TheWarWithin**은 League of Legends 스타일의 5대5 팀전 게임에 최적화된 팀 빌더 및 통계 관리 플랫폼입니다.
Google Sheets를 데이터베이스로 활용하여 클라우드 기반으로 플레이어 통계를 관리하고, ELO 레이팅 시스템을 통해 과학적인 승률 예측을 제공합니다.

## 주요 기능

### 1. 지능형 팀 빌더
- **랜덤 팀 생성**: Fisher-Yates 셔플 알고리즘으로 공정한 2팀 구성 (5:5)
- **포지션 배치**: 탑, 정글, 미드, 원딜, 서폿 5개 포지션 관리
- **드래그 앤 드롭**: 직관적인 UI로 팀 구성 조정
  - 대기석 ↔ 포지션: 플레이어 배치/교체
  - 포지션 ↔ 포지션: 같은 팀 내 위치 교환
  - 팀간 교환: 다른 팀 대기석 간 플레이어 교환
- **포지션 클릭**: 배치된 플레이어 클릭으로 빠른 대기석 이동

### 2. ELO 기반 승률 예측
- **포지션 가중치 적용**: 각 포지션의 게임 영향도를 고려한 승률 계산
  - 정글: 24%, 미드: 22%, 원딜: 20%, 탑: 18%, 서폿: 16%
- **실시간 승률 표시**: 팀 구성 시 즉시 승률 예측
- **ELO 레이팅 관리**: 게임 결과에 따른 자동 레이팅 업데이트

### 3. 상세 통계 분석
- **전체 현황**: 총 플레이어 수, 총 게임 수 집계
- **통계표**: 플레이어별 게임수, 승률, 포지션별 승률
- **시각화**: Chart.js 기반 막대그래프 차트
- **플레이어 비교**: 최대 2명 선택하여 상대전적 및 팀메이트 분석

### 4. Google Sheets 연동
- **클라우드 저장**: 모든 데이터를 Google Sheets에 저장
- **실시간 동기화**: CSV 내보내기 또는 Google Sheets API 활용
- **두 가지 시트 관리**:
  - 승률표 시트: 플레이어 통계 데이터
  - 기록 시트: 게임 결과 기록

## 프로젝트 구조

```
TheWarWithin/
├── index.html                          # 메인 HTML 파일
├── css/
│   └── player-list-styles.css         # 플레이어 목록 스타일
├── image/
│   └── icon/
│       └── page.png                   # 페이지 아이콘
├── js/
│   ├── simple_app.js                  # 메인 앱 진입점
│   └── modules/
│       ├── config.js                  # Google Sheets 설정
│       ├── gameManager.js             # 게임 데이터 로드/저장
│       ├── dataManager.js             # 데이터 파싱
│       ├── teamBuilder.js             # 팀 생성 및 드래그&드롭
│       ├── playerManager.js           # 플레이어 선택 및 비교
│       ├── uiManager.js               # UI 렌더링
│       ├── winRateDisplay.js          # 승률 표시
│       ├── eloSystem.js               # ELO 레이팅 시스템
│       ├── basicWinRateDisplay.js    # 기본 승률 표시
│       └── utils.js                   # 유틸리티 함수
└── README.md
```

## 설치 및 설정

### 1. Google Sheets 준비

1. [Google Sheets](https://sheets.google.com)에서 새 스프레드시트 생성
2. 두 개의 시트 생성:
   - **승률표** 시트: 플레이어 통계
   - **기록** 시트: 게임 결과

3. 스프레드시트 공개 설정:
   - 파일 > 공유 > "링크가 있는 모든 사용자" 권한 설정

### 2. Google Cloud API 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성
3. Google Sheets API 활성화
4. API 키 생성 (브라우저 키)

### 3. Google Apps Script 설정 (선택 사항)

Google Apps Script를 사용하면 더 안정적인 데이터 저장이 가능합니다:

1. 스프레드시트에서 확장 프로그램 > Apps Script 열기
2. 스크립트 작성 (POST 요청 처리)
3. 웹 앱으로 배포
4. 배포 URL 복사

### 4. 애플리케이션 설정

애플리케이션 설정 방법은 3가지가 있습니다:

#### 방법 1: URL 파라미터 사용
```
index.html?spreadsheetId=YOUR_SPREADSHEET_ID&apiKey=YOUR_API_KEY&scriptUrl=YOUR_SCRIPT_URL
```

#### 방법 2: 설정 폼 입력
- 애플리케이션 실행 시 자동으로 표시되는 설정 폼에 정보 입력
- 설정은 로컬 스토리지에 저장되어 재사용

#### 방법 3: config.js 직접 수정
```javascript
window.CONFIG = {
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
    SHEET_GID: '2129803798',              // 승률표 시트 GID
    RECORDS_SHEET_GID: '339777748',       // 기록 시트 GID
    API_KEY: 'YOUR_API_KEY',
    GOOGLE_APPS_SCRIPT_URL: 'YOUR_SCRIPT_URL'
}
```

## 사용 방법

### 1. 팀 생성

1. "10명 입력" 텍스트 영역에 플레이어 이름 입력 (한 줄에 한 명)
2. "랜덤 팀 생성" 버튼 클릭
3. 자동으로 2팀으로 분배되어 대기석에 표시

### 2. 포지션 배치

#### 드래그 앤 드롭 사용:
- 대기석의 플레이어를 포지션으로 드래그
- 포지션 간 플레이어 교환 (모든 포지션 배치 후)
- 팀간 대기석 교환 가능

#### 클릭 사용:
- 포지션에 배치된 플레이어 클릭 시 대기석으로 이동

### 3. 승률 확인

- ELO 기반 승률: 포지션 가중치를 고려한 예측 승률
- 기본 승률: 포지션을 고려하지 않은 기본 승률

### 4. 게임 결과 기록

- "팀 1 승리" 또는 "팀 2 승리" 버튼 클릭
- 자동으로 Google Sheets에 결과 저장
- ELO 레이팅 자동 업데이트

### 5. 통계 확인

- **전체 현황**: 페이지 상단에 요약 표시
- **통계표**: 5판 이상 플레이한 플레이어 순위
- **차트**: 플레이어별 승률 막대그래프
- **플레이어 목록**: 카드 형식으로 전체 플레이어 표시

### 6. 플레이어 비교

1. 플레이어 목록에서 1-2명 선택
2. 자동으로 비교 분석 차트 표시:
   - 1명 선택: 전체 플레이어와의 비교
   - 2명 선택: 두 플레이어 간 상세 비교

## 주요 모듈 설명

### teamBuilder.js
팀 생성 및 드래그 앤 드롭 기능을 담당하는 핵심 모듈입니다.

**주요 함수**:
- `generateRandomTeams()`: Fisher-Yates 셔플로 랜덤 팀 생성
- `setupDragAndDrop()`: 포지션 간 드래그 앤 드롭 설정
- `setupWaitingPlayerUnifiedDrop()`: 대기석 통합 드롭 핸들러
- `setupPositionPlayerClick()`: 포지션 클릭 이벤트 설정

### eloSystem.js
ELO 레이팅 시스템을 구현한 모듈입니다.

**상수**:
```javascript
DEFAULT_RATING: 1500
K_FACTOR: 32
포지션 가중치:
  - 정글: 24%
  - 미드: 22%
  - 원딜: 20%
  - 탑: 18%
  - 서폿: 16%
```

**주요 클래스**:
- `EloRatingManager`: ELO 레이팅 관리 및 승률 계산

### gameManager.js
Google Sheets 데이터 로드/저장을 담당하는 모듈입니다.

**주요 함수**:
- `loadData()`: CSV 또는 API 방식으로 데이터 로드
- `addToGoogleSheetsRecord()`: 게임 결과 기록 저장
- `handleTeamWin()`: 팀 승리 처리 및 데이터 업데이트

### uiManager.js
UI 렌더링을 담당하는 모듈입니다.

**주요 함수**:
- `renderOverviewStats()`: 전체 현황 렌더링
- `renderStatsTable()`: 통계표 렌더링
- `renderPlayersList()`: 플레이어 목록 렌더링
- `renderCharts()`: Chart.js 기반 차트 렌더링

## 데이터 구조

### 승률표 시트 (GID: 2129803798)
| 플레이어명 | 티어 | 게임수 | 승률 | 탑 승률 | 정글 승률 | 미드 승률 | 원딜 승률 | 서폿 승률 | ... |
|----------|------|--------|------|---------|----------|----------|----------|----------|-----|
| Player1  | 다이아 | 10   | 60%  | 50%     | 70%      | 60%      | 55%      | 65%      | ... |

### 기록 시트 (GID: 339777748)
| 날짜 | 팀1 | 팀2 | 승리팀 | ... |
|------|-----|-----|--------|-----|
| 2025-11-03 | Player1, Player2, ... | Player6, Player7, ... | 팀1 | ... |

## ELO 레이팅 시스템

### 승률 계산 공식

```javascript
// 기본 ELO 승률 공식
expectedScore = 1 / (1 + 10^((ratingB - ratingA) / 400))

// 포지션 가중치 적용
team1WinRate = 기본승률 × Σ(포지션별 가중치)
```

### 레이팅 업데이트

```javascript
newRating = oldRating + K_FACTOR × (actualScore - expectedScore)

// 레이팅 범위: 800 ~ 3000
```

## 브라우저 요구사항

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- JavaScript ES6+ 지원 필수

## 개발 환경

### 로컬 서버 실행

정적 파일 서버로 실행:
```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server
```

브라우저에서 `http://localhost:8000` 접속

### CORS 이슈 해결

Google Sheets CSV 내보내기는 CORS 정책에 따라 브라우저에서 직접 접근 시 제한될 수 있습니다.
- **해결 방법 1**: Google Apps Script 웹앱 사용
- **해결 방법 2**: CORS 프록시 사용 (개발 환경만 권장)

## 라이선스

이 프로젝트는 개인 프로젝트입니다.

## 기여

버그 리포트 및 기능 제안은 GitHub Issues를 통해 제출해주세요.

## 문의

프로젝트 관련 문의사항이 있으시면 GitHub Repository를 통해 연락주시기 바랍니다.

---

**TheWarWithin** - 내전을 더 재미있고 공정하게!

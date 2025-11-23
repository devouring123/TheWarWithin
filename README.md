# TheWarWithin

내전(팀 게임) 승률을 추적하고 관리하는 웹 기반 통계 관리 애플리케이션

## 개요

**TheWarWithin**은 5대5 팀전 게임의 팀 구성 및 통계 관리를 위한 웹 애플리케이션입니다. Google Sheets에 플레이어 데이터를 저장하고, 랜덤 팀을 생성한 뒤 포지션을 배치하여 게임을 진행합니다. 게임 결과는 자동으로 기록되며, ELO 레이팅 기반으로 승률을 예측하고 플레이어 통계를 분석할 수 있습니다.

## 설치 및 설정

### 1. Google Sheets 준비

1. [내전 기록용 스프레드 시트](https://docs.google.com/spreadsheets/d/1yKRXpuV0sxOYTijVeuKoH5xxgcgm-sPRD2Sf4eVIpcs/edit?usp=sharing) 사본 만들기
2. 스프레드시트 ID 기억하기 (URL의 `d/~~~~/edit` 사이에 있는 `~~~~`가 ID)
3. 스프레드시트 공개 설정: 파일 > 공유 > "링크가 있는 모든 사용자" 권한 설정

### 2. Google Apps Script 배포

1. [Google Apps Script](https://script.google.com/home) 접속
2. 새 프로젝트 생성
3. [googleAppScript.js](googleAppScript.js) 내용 붙여넣고 `YOUR_SPREADSHEET_ID` 부분을 내 시트 ID로 교체
4. 배포 > 새 배포 클릭
   - 유형 선택 = 웹 앱
   - 다음 사용자 인증 정보로 실행 = "나"
   - 액세스 권한이 있는 사용자 = "모든 사용자"
5. 액세스 승인 버튼 누르기
6. 계정 선택 -> Advanced -> Go to [YOUR PROJECT] (unsafe) -> Continue
7. 배포 완료 후 배포 ID 복사

### 3. 실행 방법

#### 로컬 서버 실행
저장소 클론 후 해당 폴더에서 cmd 실행
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server
```
브라우저에서 `http://localhost:8000` 접속

#### GitHub Pages로 배포
1. GitHub 저장소에 프로젝트 푸시
2. Settings > Pages > Source를 `main` 브랜치로 설정
3. `https://[username].github.io/[repository-name]` 접속
4. URL 파라미터로 설정 전달: `?spreadsheetId=...&scriptUrl=...`

### 4. 애플리케이션 설정

#### 방법 1: URL 파라미터 사용 (권장)
```
http://localhost:8000/?spreadsheetId=YOUR_SPREADSHEET_ID&scriptUrl=YOUR_SCRIPT_URL
```

#### 방법 2: 설정 폼 입력
- 애플리케이션 실행 시 자동으로 표시되는 설정 폼에 정보 입력
- 설정은 로컬 스토리지에 저장되어 재사용

## 주요 기능

- **지능형 팀 빌더**: 10명의 플레이어를 랜덤으로 2팀으로 나누고, 드래그 앤 드롭으로 포지션(탑/정글/미드/원딜/서폿) 배치
- **ELO 기반 승률 예측**: 포지션별 가중치(정글 24%, 미드 22%, 원딜 20%, 탑 18%, 서폿 16%)를 적용한 실시간 승률 계산
- **상세 통계 분석**: 플레이어별 게임수, 승률, 포지션별 승률을 표와 차트로 시각화하고 1-2명 선택 시 상대전적 비교
- **Google Sheets 연동**: 모든 플레이어 통계와 게임 결과를 클라우드에 자동 저장 및 동기화

## 사용 방법

### 팀 생성 및 게임 진행

1. "10명 입력" 텍스트 영역에 플레이어 이름 입력 (한 줄에 한 명) 또는 플레이어 버튼 클릭
2. "랜덤 팀 생성" 버튼 클릭하여 2팀으로 분배
3. 대기석의 플레이어를 드래그하여 포지션에 배치 (클릭으로 대기석 복귀 가능)
4. 승률 예측 확인 후 게임 진행
5. "팀 1 승리" 또는 "팀 2 승리" 버튼 클릭하여 결과 기록

### 통계 확인

- **전체 현황**: 페이지 상단에 총 플레이어 수, 총 게임 수 표시
- **통계표**: 5판 이상 플레이한 플레이어 순위
- **플레이어 목록**: 카드 형식으로 전체 플레이어 정보 표시
- **플레이어 비교**: 1-2명 선택 시 상대전적 및 팀메이트 분석 표시

## 브라우저 요구사항

- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- JavaScript ES6+ 지원 필수

## 라이선스

이 프로젝트는 개인 프로젝트입니다.

---

**TheWarWithin** - 내전을 더 재미있고 공정하게!

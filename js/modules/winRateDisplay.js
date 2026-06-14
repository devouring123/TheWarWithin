// 승률 표시 및 UI 업데이트 모듈
import { initializeEloSystem, calculateTeamWinRates, getEloSystemStatus } from './eloSystem.js?v=mmr-team-state-basic-winrate-v2';
import { getSelectedTeams } from './teamBuilder.js?v=mmr-team-state-basic-winrate-v2';
import { initializeBasicWinRateDisplay, triggerBasicWinRateUpdate } from './basicWinRateDisplay.js?v=mmr-team-state-basic-winrate-v2';

// 승률 표시 상태 관리
let isEloSystemReady = false;
let currentGameData = null;
let currentGameRecords = null;

// ELO 시스템 초기화
export function initializeWinRateSystem(gameData, gameRecords) {
    console.log('승률 시스템 초기화 시작...');
    
    currentGameData = gameData;
    currentGameRecords = gameRecords;
    
    // ELO 시스템 초기화
    initializeEloSystem(gameData, gameRecords);
    isEloSystemReady = true;
    
    // 시스템 상태 확인
    const status = getEloSystemStatus();
    console.log('ELO 시스템 상태:', status);
    
    // UI 초기화
    setupWinRateUI();
    
    // 기본 승률 표시 초기화
    initializeBasicWinRateDisplay();
    
    console.log('승률 시스템 초기화 완료');
}

// 승률 표시 UI 설정
function setupWinRateUI() {
    // 팀 생성 완료 후 승률 표시 영역 추가
    const teamContainer = document.getElementById('generatedTeams');
    if (teamContainer && !document.getElementById('winRateDisplay')) {
        const winRateDisplay = createWinRateDisplayElement();
        teamContainer.appendChild(winRateDisplay);
    }
    
    // 팀 구성 변경 감지를 위한 이벤트 리스너 설정
    setupTeamChangeListeners();
}

// 승률 표시 엘리먼트 생성
function createWinRateDisplayElement() {
    const displayElement = document.createElement('div');
    displayElement.id = 'winRateDisplay';
    displayElement.className = 'row mt-3';
    displayElement.innerHTML = `
        <div class="col-12">
            <div class="card bg-light border-primary shadow-sm">
                <div class="card-header bg-primary text-white py-2">
                    <h6 class="mb-0">
                        <i class="fas fa-chart-line me-2"></i>포지션 고려 승률 예측
                        <small class="text-light ms-2">(MMR + 가중치)</small>
                    </h6>
                </div>
                <div class="card-body p-3" id="winRateContent">
                    <div class="text-center text-muted">
                        <i class="fas fa-clock me-2"></i>
                        모든 포지션 배정 완료 시 표시됩니다
                    </div>
                </div>
            </div>
        </div>
    `;
    return displayElement;
}

// 팀 변경 감지 리스너 설정
function setupTeamChangeListeners() {
    // MutationObserver를 사용하여 팀 구성 변경 감지
    const targetNodes = [
        document.getElementById('team1Positions'),
        document.getElementById('team2Positions'),
        document.getElementById('team1Waiting'),
        document.getElementById('team2Waiting')
    ].filter(node => node !== null);
    
    if (targetNodes.length > 0) {
        const observer = new MutationObserver(() => {
            // 변경 감지 시 승률 업데이트 (디바운싱 적용)
            debounceUpdateWinRates();
            // 기본 승률도 업데이트
            triggerBasicWinRateUpdate();
        });
        
        targetNodes.forEach(node => {
            observer.observe(node, { 
                childList: true, 
                subtree: true, 
                characterData: true 
            });
        });
    }
}

// 디바운싱된 승률 업데이트
let updateTimeout;
function debounceUpdateWinRates() {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
        updateWinRateDisplay();
    }, 300); // 300ms 딜레이
}

// 승률 표시 업데이트
export function updateWinRateDisplay() {
    if (!isEloSystemReady) {
        console.warn('ELO 시스템이 준비되지 않았습니다.');
        return;
    }
    
    const winRateContent = document.getElementById('winRateContent');
    if (!winRateContent) return;
    
    try {
        // 현재 팀 구성 가져오기
        const teams = getSelectedTeams();
        const team1Players = teams.team1;
        const team2Players = teams.team2;
        
        // 팀이 구성되지 않은 경우
        if (team1Players.length === 0 && team2Players.length === 0) {
            winRateContent.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-clock me-2"></i>
                    모든 포지션 배정 완료 시 표시됩니다
                </div>
            `;
            return;
        }
        
        // 포지션 정보 가져오기
        const { hasPositions, team1Positions, team2Positions } = getTeamPositions();
        
        // 포지션이 모두 배정된 경우에만 포지션 고려 승률 표시
        if (hasPositions && team1Players.length === 5 && team2Players.length === 5) {
            const positionalWinRate = calculateTeamWinRates(
                team1Players, 
                team2Players, 
                true, 
                team1Positions, 
                team2Positions
            );
            
            // 포지션 고려 승률 UI 업데이트
            winRateContent.innerHTML = generatePositionalWinRateHTML(positionalWinRate);
        } else {
            // 포지션이 모두 배정되지 않은 경우
            winRateContent.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-clock me-2"></i>
                    모든 포지션 배정 완료 시 표시됩니다
                </div>
            `;
        }
        
    } catch (error) {
        console.error('승률 표시 업데이트 오류:', error);
        winRateContent.innerHTML = `
            <div class="text-center text-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                승률 계산 중 오류가 발생했습니다
            </div>
        `;
    }
}

// 팀 포지션 정보 추출
function getTeamPositions() {
    const team1Positions = [];
    const team2Positions = [];
    let hasPositions = true;
    
    // Team 1 포지션 확인
    const team1PositionElements = document.querySelectorAll('#team1Positions .position-slot');
    team1PositionElements.forEach(slot => {
        const playerName = slot.querySelector('.player-name')?.textContent;
        if (playerName && playerName !== '-') {
            team1Positions.push(playerName);
        } else {
            hasPositions = false;
        }
    });
    
    // Team 2 포지션 확인
    const team2PositionElements = document.querySelectorAll('#team2Positions .position-slot');
    team2PositionElements.forEach(slot => {
        const playerName = slot.querySelector('.player-name')?.textContent;
        if (playerName && playerName !== '-') {
            team2Positions.push(playerName);
        } else {
            hasPositions = false;
        }
    });
    
    return {
        hasPositions: hasPositions && team1Positions.length === 5 && team2Positions.length === 5,
        team1Positions,
        team2Positions
    };
}

// 포지션 고려 승률 HTML 생성
function generatePositionalWinRateHTML(positionalWinRate) {
    const team1WinRate = positionalWinRate.team1WinRate;
    const team2WinRate = positionalWinRate.team2WinRate;
    
    // 예측 신뢰도 계산
    const ratingDiff = Math.abs(positionalWinRate.ratingDifference);
    const confidence = Math.min(90, 50 + (ratingDiff / 10));
    
    return `
        <div class="text-center">
            <!-- 단일 양방향 막대 그래프 -->
            <div class="vs-bar-container mb-3">
                <div class="team-labels d-flex justify-content-between mb-2">
                    <span class="fw-bold text-primary">Team 1</span>
                    <span class="fw-bold text-danger">Team 2</span>
                </div>
                <div class="vs-progress-bar">
                    <div class="vs-progress-fill-left bg-primary" style="width: ${team1WinRate}%">
                        <span class="vs-percentage">${team1WinRate.toFixed(1)}%</span>
                    </div>
                    <div class="vs-progress-fill-right bg-danger" style="width: ${team2WinRate}%">
                        <span class="vs-percentage">${team2WinRate.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
            
            <!-- MMR 정보 -->
            <div class="row text-center mt-3">
                <div class="col-6">
                    <small class="text-muted">
                        <i class="fas fa-trophy me-1"></i>
                        가중 MMR: ${positionalWinRate.team1Rating.toFixed(0)}
                    </small>
                </div>
                <div class="col-6">
                    <small class="text-muted">
                        <i class="fas fa-trophy me-1"></i>
                        가중 MMR: ${positionalWinRate.team2Rating.toFixed(0)}
                    </small>
                </div>
            </div>
            
            <div class="mt-2">
                <small class="text-muted">
                    예측 신뢰도: ${confidence.toFixed(0)}%
                </small>
            </div>
        </div>
    `;
}

// 개별 승률 카드 생성
function generateWinRateCard(team1Name, team2Name, winRateData, cardType) {
    const team1WinRate = winRateData.team1WinRate;
    const team2WinRate = winRateData.team2WinRate;
    
    // 승률에 따른 색상 클래스
    const getWinRateColor = (rate) => {
        if (rate >= 70) return 'success';
        if (rate >= 55) return 'info';
        if (rate >= 45) return 'warning';
        return 'danger';
    };
    
    const team1Color = getWinRateColor(team1WinRate);
    const team2Color = getWinRateColor(team2WinRate);
    
    // 예측 신뢰도 계산 (레이팅 차이 기반)
    const ratingDiff = Math.abs(winRateData.ratingDifference);
    const confidence = Math.min(90, 50 + (ratingDiff / 10));
    
    return `
        <div class="win-rate-comparison">
            <!-- Team 1 -->
            <div class="team-win-rate mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold">${team1Name}</span>
                    <span class="badge bg-${team1Color} fs-6">${team1WinRate.toFixed(1)}%</span>
                </div>
                <div class="progress mt-1" style="height: 8px;">
                    <div class="progress-bar bg-${team1Color}" 
                         style="width: ${team1WinRate}%"></div>
                </div>
            </div>
            
            <!-- Team 2 -->
            <div class="team-win-rate mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold">${team2Name}</span>
                    <span class="badge bg-${team2Color} fs-6">${team2WinRate.toFixed(1)}%</span>
                </div>
                <div class="progress mt-1" style="height: 8px;">
                    <div class="progress-bar bg-${team2Color}" 
                         style="width: ${team2WinRate}%"></div>
                </div>
            </div>
            
            <!-- 예측 신뢰도 -->
            <div class="text-center">
                <small class="text-muted">
                    예측 신뢰도: ${confidence.toFixed(0)}%
                </small>
            </div>
        </div>
    `;
}

// 게임 결과 반영 시 ELO 업데이트
export async function updateEloAfterGame(winners, losers) {
    if (!isEloSystemReady) {
        console.warn('ELO 시스템이 준비되지 않았습니다.');
        return;
    }
    
    try {
        // ELO 레이팅 업데이트
        const { updateEloRatings } = await import('./eloSystem.js');
        updateEloRatings(winners, losers);
        
        console.log('게임 결과 반영 완료');
        
        // UI 승률 업데이트
        updateWinRateDisplay();
        
    } catch (error) {
        console.error('ELO 업데이트 오류:', error);
    }
}

// 시스템 상태 확인
export function getWinRateSystemStatus() {
    return {
        isReady: isEloSystemReady,
        hasGameData: currentGameData !== null,
        hasGameRecords: currentGameRecords !== null && currentGameRecords.length > 0,
        eloStatus: isEloSystemReady ? getEloSystemStatus() : null
    };
}

// 외부에서 승률 업데이트 트리거
export function triggerWinRateUpdate() {
    updateWinRateDisplay();
}

// 스타일 추가 - 다크/라이트 모드 지원
const additionalStyles = `
<style>
.win-rate-comparison {
    background: var(--bg-tertiary, rgba(255, 255, 255, 0.05));
    border-radius: 8px;
    padding: 15px;
    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
}

.team-win-rate {
    margin-bottom: 10px;
}

.progress {
    border-radius: 4px;
    background-color: var(--bg-tertiary, rgba(255, 255, 255, 0.1));
}

.progress-bar {
    transition: width 0.3s ease;
}

#winRateDisplay .card {
    background: var(--bg-secondary, #ffffff);
    border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.1));
    box-shadow: var(--shadow-md, 0 2px 4px rgba(0, 0, 0, 0.1));
}

#winRateDisplay .card-header {
    background: var(--bg-tertiary, #f8f9fa);
    border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.1));
    color: var(--text-primary, #212529);
}

#winRateDisplay .card-body {
    background: var(--bg-secondary, #ffffff);
    color: var(--text-primary, #212529);
}

#winRateDisplay .text-muted {
    color: var(--text-muted, #6c757d) !important;
}

.badge {
    min-width: 60px;
    text-align: center;
}

/* 양방향 VS 바 스타일 */
.vs-bar-container {
    max-width: 400px;
    margin: 0 auto;
}

.vs-progress-bar {
    position: relative;
    height: 40px;
    background: var(--bg-tertiary, #e9ecef);
    border-radius: 20px;
    overflow: hidden;
    display: flex;
}

.vs-progress-fill-left {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;
    color: white;
    font-weight: bold;
    font-size: 0.95rem;
    transition: width 0.5s ease;
    border-radius: 20px 0 0 20px;
}

.vs-progress-fill-right {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 10px;
    color: white;
    font-weight: bold;
    font-size: 0.95rem;
    transition: width 0.5s ease;
    border-radius: 0 20px 20px 0;
    margin-left: auto;
}

.team-labels {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #212529);
}

.team-labels .text-primary {
    color: #3b82f6 !important;
}

.team-labels .text-danger {
    color: #ef4444 !important;
}
</style>
`;

// 스타일 동적 추가
if (!document.getElementById('winRateDisplayStyles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'winRateDisplayStyles';
    styleElement.innerHTML = additionalStyles;
    document.head.appendChild(styleElement);
}

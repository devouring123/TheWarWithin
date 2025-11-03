// 대기석 아래에 표시되는 기본 승률 표시 모듈
import { calculateTeamWinRates } from './eloSystem.js';

// 기본 승률 표시 초기화
export function initializeBasicWinRateDisplay() {
    // 대기석 섹션에 승률 표시 영역 추가
    addBasicWinRateElements();
}

// 기본 승률 표시 엘리먼트 추가
function addBasicWinRateElements() {
    // Team 1 대기석 아래에 승률 표시 영역 추가
    const team1WaitingSection = document.getElementById('team1WaitingSection');
    if (team1WaitingSection && !document.getElementById('team1BasicWinRate')) {
        const team1WinRateEl = createBasicWinRateElement('team1BasicWinRate');
        team1WaitingSection.appendChild(team1WinRateEl);
    }

    // Team 2 대기석 아래에 승률 표시 영역 추가
    const team2WaitingSection = document.getElementById('team2WaitingSection');
    if (team2WaitingSection && !document.getElementById('team2BasicWinRate')) {
        const team2WinRateEl = createBasicWinRateElement('team2BasicWinRate');
        team2WaitingSection.appendChild(team2WinRateEl);
    }
}

// 기본 승률 표시 엘리먼트 생성
function createBasicWinRateElement(id) {
    const element = document.createElement('div');
    element.id = id;
    element.className = 'basic-win-rate-display mt-2 p-2 bg-light rounded border';
    element.style.display = 'none';
    element.innerHTML = `
        <div class="text-center">
            <div class="text-muted mb-1">승률 예측</div>
            <div class="win-rate-value fw-bold text-primary">-</div>
        </div>
    `;
    return element;
}

// 기본 승률 업데이트
export function updateBasicWinRateDisplay(team1Players, team2Players) {
    if (!team1Players || !team2Players || team1Players.length === 0 || team2Players.length === 0) {
        // 팀이 구성되지 않은 경우 숨기기
        hideBasicWinRateDisplays();
        return;
    }

    try {
        // 기본 승률 계산
        const basicWinRate = calculateTeamWinRates(team1Players, team2Players, false);
        
        // Team 1 승률 표시
        const team1Element = document.getElementById('team1BasicWinRate');
        if (team1Element) {
            team1Element.style.display = 'block';
            const team1ValueElement = team1Element.querySelector('.win-rate-value');
            if (team1ValueElement) {
                team1ValueElement.textContent = `${basicWinRate.team1WinRate.toFixed(1)}%`;
                team1ValueElement.className = `win-rate-value fw-bold ${getWinRateColorClass(basicWinRate.team1WinRate)}`;
            }
        }

        // Team 2 승률 표시
        const team2Element = document.getElementById('team2BasicWinRate');
        if (team2Element) {
            team2Element.style.display = 'block';
            const team2ValueElement = team2Element.querySelector('.win-rate-value');
            if (team2ValueElement) {
                team2ValueElement.textContent = `${basicWinRate.team2WinRate.toFixed(1)}%`;
                team2ValueElement.className = `win-rate-value fw-bold ${getWinRateColorClass(basicWinRate.team2WinRate)}`;
            }
        }

    } catch (error) {
        console.error('기본 승률 표시 업데이트 오류:', error);
        hideBasicWinRateDisplays();
    }
}

// 기본 승률 표시 숨기기
function hideBasicWinRateDisplays() {
    const team1Element = document.getElementById('team1BasicWinRate');
    const team2Element = document.getElementById('team2BasicWinRate');
    
    if (team1Element) {
        team1Element.style.display = 'none';
    }
    if (team2Element) {
        team2Element.style.display = 'none';
    }
}

// 승률에 따른 색상 클래스 반환
function getWinRateColorClass(winRate) {
    if (winRate >= 70) return 'text-success';
    if (winRate >= 55) return 'text-info';
    if (winRate >= 45) return 'text-warning';
    return 'text-danger';
}

// 팀 구성 변경 시 기본 승률 업데이트 트리거
export function triggerBasicWinRateUpdate() {
    // 전체 팀 구성 가져오기 (대기석 + 포지션 배치 플레이어 모두)
    const team1Players = getAllTeamPlayers('team1');
    const team2Players = getAllTeamPlayers('team2');
    
    updateBasicWinRateDisplay(team1Players, team2Players);
}

// 대기석 플레이어 목록 가져오기
function getWaitingPlayers(teamId) {
    const waitingArea = document.getElementById(`${teamId}Waiting`);
    if (!waitingArea) return [];
    
    const playerButtons = waitingArea.querySelectorAll('.waiting-player-btn');
    return Array.from(playerButtons).map(btn => btn.textContent.trim()).filter(name => name.length > 0);
}

// 포지션 배치된 플레이어 목록 가져오기
function getPositionPlayers(teamId) {
    const positionsContainer = document.getElementById(`${teamId}Positions`);
    if (!positionsContainer) return [];
    
    const positionSlots = positionsContainer.querySelectorAll('.position-slot .player-name');
    return Array.from(positionSlots)
        .map(slot => slot.textContent.trim())
        .filter(name => name.length > 0 && name !== '-');
}

// 전체 팀 플레이어 가져오기 (대기석 + 포지션 배치)
function getAllTeamPlayers(teamId) {
    const waitingPlayers = getWaitingPlayers(teamId);
    const positionPlayers = getPositionPlayers(teamId);
    
    // 두 배열을 합쳐서 전체 팀 구성 반환
    return [...waitingPlayers, ...positionPlayers];
}

// 추가 스타일
const basicWinRateStyles = `
<style>
.basic-win-rate-display {
    border: 1px solid #dee2e6;
    background-color: #f8f9fa;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.basic-win-rate-display:hover {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.basic-win-rate-display .win-rate-value {
    font-size: 1.1rem;
    margin-top: 2px;
}

.basic-win-rate-display .text-muted {
    font-size: 0.85rem;
    color: #6c757d;
}
</style>
`;

// 스타일 동적 추가
if (!document.getElementById('basicWinRateStyles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'basicWinRateStyles';
    styleElement.innerHTML = basicWinRateStyles;
    document.head.appendChild(styleElement);
}
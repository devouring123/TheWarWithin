// 팀 생성 및 관리 모듈 (대기석 + 순차적 포지션 배정)

// 포지션 정보
const POSITIONS = ['탑', '정글', '미드', '원딜', '서폿'];

// 현재 팀 상태
let currentTeams = {
    team1: [], // 대기석 플레이어들
    team2: []  // 대기석 플레이어들
};

// 포지션별 배치된 플레이어들
let positionPlayers = {
    team1: Array(5).fill(null), // [탑, 정글, 미드, 원딜, 서폿]
    team2: Array(5).fill(null)
};

// 현재 배정할 포지션 (0=탑, 1=정글, 2=미드, 3=원딜, 4=서폿)
let currentPositionToAssign = {
    team1: 0,
    team2: 0
};

// 게임 데이터 및 기록 저장 (플레이어 피커용)
let gameDataForPicker = null;
let gameRecordsForPicker = [];

// 플레이어 선택 UI 초기화
export function initializePlayerPicker(gameData, gameRecords) {
    gameDataForPicker = gameData;
    gameRecordsForPicker = gameRecords || [];

    renderPlayerPicker();

    // 전역 함수로 노출
    window.addPlayerToInput = addPlayerToInput;
}

// 최근 20판 중 10판 이상 참여한 플레이어 필터링
function getFrequentPlayers() {
    if (!gameRecordsForPicker || gameRecordsForPicker.length === 0) {
        return [];
    }

    // 최근 20판 가져오기
    const recentGames = gameRecordsForPicker.slice(-20);

    // 플레이어별 참여 횟수 계산
    const playerCounts = {};
    recentGames.forEach(record => {
        const allPlayers = [...(record.winners || []), ...(record.losers || [])];
        allPlayers.forEach(player => {
            const playerName = player.toLowerCase();
            playerCounts[playerName] = (playerCounts[playerName] || 0) + 1;
        });
    });

    // 10판 이상 참여한 플레이어 필터링
    const frequentPlayers = Object.keys(playerCounts)
        .filter(player => playerCounts[player] >= 10)
        .sort((a, b) => a.localeCompare(b, 'ko-KR'));

    return frequentPlayers;
}

// 플레이어 선택 UI 렌더링
function renderPlayerPicker() {
    if (!gameDataForPicker) return;

    // 전체 플레이어 목록 (가나다순)
    const allPlayers = gameDataForPicker.players
        .map(p => p.name)
        .sort((a, b) => a.localeCompare(b, 'ko-KR'));

    // 자주함 플레이어 목록
    const frequentPlayers = getFrequentPlayers();

    // 자주함 탭 렌더링
    const frequentListEl = document.getElementById('frequentPlayersList');
    if (frequentListEl) {
        frequentListEl.innerHTML = frequentPlayers.map(player =>
            `<button type="button" class="btn btn-sm player-select-btn" onclick="window.addPlayerToInput('${player}')">${player}</button>`
        ).join('');
    }

    // 전체 탭 렌더링
    const allListEl = document.getElementById('allPlayersList');
    if (allListEl) {
        allListEl.innerHTML = allPlayers.map(player =>
            `<button type="button" class="btn btn-sm player-select-btn" onclick="window.addPlayerToInput('${player}')">${player}</button>`
        ).join('');
    }
}

// 플레이어 이름을 입력창에 추가
function addPlayerToInput(playerName) {
    const playersInput = document.getElementById('playersInput');
    if (!playersInput) return;

    const currentValue = playersInput.value.trim();
    const currentPlayers = currentValue.split('\n').filter(p => p.trim());

    // 이미 입력된 플레이어인지 확인
    if (currentPlayers.includes(playerName)) {
        return;
    }

    // 10명 이상이면 추가하지 않음
    if (currentPlayers.length >= 10) {
        alert('최대 10명까지만 선택할 수 있습니다.');
        return;
    }

    // 플레이어 추가
    currentPlayers.push(playerName);
    playersInput.value = currentPlayers.join('\n');
}

// 나머지 원본 코드는 그대로 유지됩니다...

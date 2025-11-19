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

    // 초기화 시 리스너 설정
    setupInputChangeListener();
    // 초기 렌더링 후 선택 상태 업데이트
    setTimeout(() => updatePlayerSelectionState(), 100);
}

// 최근 20판 중 5판 이상 참여한 플레이어 필터링
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

    // 5판 이상 참여한 플레이어 필터링
    const frequentPlayers = Object.keys(playerCounts)
        .filter(player => playerCounts[player] >= 5)
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

// 플레이어 이름을 입력창에 추가/제거 (토글)
function addPlayerToInput(playerName) {
    const playersInput = document.getElementById('playersInput');
    if (!playersInput) return;

    const currentValue = playersInput.value.trim();
    const currentPlayers = currentValue.split('\n').filter(p => p.trim());

    // 이미 입력된 플레이어인지 확인
    const playerIndex = currentPlayers.indexOf(playerName);

    if (playerIndex !== -1) {
        // 이미 있으면 제거
        currentPlayers.splice(playerIndex, 1);
        playersInput.value = currentPlayers.join('\n');
    } else {
        // 없으면 추가
        // 10명 이상이면 추가하지 않음
        if (currentPlayers.length >= 10) {
            alert('최대 10명까지만 선택할 수 있습니다.');
            return;
        }

        currentPlayers.push(playerName);
        playersInput.value = currentPlayers.join('\n');
    }

    // 선택 상태 업데이트
    updatePlayerSelectionState();
}

// 선택된 플레이어 상태 업데이트
function updatePlayerSelectionState() {
    const playersInput = document.getElementById('playersInput');
    if (!playersInput) return;

    const currentValue = playersInput.value.trim();
    const selectedPlayers = currentValue.split('\n')
        .filter(p => p.trim())
        .map(p => p.toLowerCase());

    // 모든 플레이어 버튼 업데이트
    document.querySelectorAll('.player-select-btn').forEach(btn => {
        const playerName = btn.textContent.toLowerCase();
        if (selectedPlayers.includes(playerName)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// 입력창 변경 감지하여 선택 상태 업데이트
function setupInputChangeListener() {
    const playersInput = document.getElementById('playersInput');
    if (playersInput) {
        playersInput.addEventListener('input', updatePlayerSelectionState);
    }
}

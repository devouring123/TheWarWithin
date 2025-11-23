// 팀 생성 및 관리 모듈 (대기석 + 순차적 포지션 배정)

// 게임 데이터 저장
let gameDataForTeamBuilder = null;

// 게임 데이터 설정
export function setGameDataForTeamBuilder(data) {
    gameDataForTeamBuilder = data;
}

// 포지션 정보
const POSITIONS = ['탑', '정글', '미드', '원딜', '서폿'];
const POSITION_KEYS = ['top', 'jungle', 'mid', 'adc', 'support'];

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

// 10명을 랜덤으로 2팀으로 나누는 함수
export function generateRandomTeams(players) {
    if (players.length !== 10) {
        throw new Error('정확히 10명의 플레이어가 필요합니다.');
    }
    
    // 플레이어 배열 복사하여 원본 보존
    const shuffled = [...players];
    
    // Fisher-Yates 셔플 알고리즘
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // 첫 5명은 팀1, 나머지 5명은 팀2
    const team1 = shuffled.slice(0, 5);
    const team2 = shuffled.slice(5, 10);
    
    return { team1, team2 };
}

// 팀 생성 버튼 이벤트
export function setupTeamBuilder() {
    const generateBtn = document.getElementById('generateTeamsBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateTeams);
    }

    const resetBtn = document.getElementById('resetTeamBuilderBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetTeamBuilder);
    }
}

// 전체 취소 처리 함수
function handleResetTeamBuilder() {
    // 입력창 초기화
    const playersInput = document.getElementById('playersInput');
    if (playersInput) {
        playersInput.value = '';
    }

    // 팀 상태 초기화
    currentTeams = { team1: [], team2: [] };
    positionPlayers = {
        team1: Array(5).fill(null),
        team2: Array(5).fill(null)
    };
    currentPositionToAssign = { team1: 0, team2: 0 };

    // 생성된 팀 결과 숨기기
    const generatedTeams = document.getElementById('generatedTeams');
    if (generatedTeams) {
        generatedTeams.style.display = 'none';
    }

    // 캡처 버튼 숨기기
    const captureBtn = document.getElementById('captureTeamBtn');
    if (captureBtn) {
        captureBtn.style.display = 'none';
    }

    // 복사 상태 메시지 제거
    const copyStatus = document.getElementById('copyStatus');
    if (copyStatus) {
        copyStatus.remove();
    }

    // 선택된 플레이어 버튼 초기화
    document.querySelectorAll('.player-select-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

// 팀 생성 처리 함수
function handleGenerateTeams() {
    const playersInput = document.getElementById('playersInput');
    const inputText = playersInput.value.trim();
    
    if (!inputText) {
        alert('참가자 이름을 입력해주세요.');
        return;
    }
    
    // 줄바꿈으로 분리하여 플레이어 이름 추출
    const players = inputText.split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);
    
    if (players.length !== 10) {
        alert(`정확히 10명의 플레이어가 필요합니다. 현재 ${players.length}명이 입력되었습니다.`);
        return;
    }
    
    try {
        // 랜덤 팀 생성
        const teams = generateRandomTeams(players);
        currentTeams = teams;
        
        // 포지션 배치 초기화
        positionPlayers = {
            team1: Array(5).fill(null),
            team2: Array(5).fill(null)
        };
        
        // 현재 배정할 포지션 초기화
        currentPositionToAssign = {
            team1: 0,
            team2: 0
        };
        
        // UI 업데이트
        renderTeamsInWaitingArea(teams);
        renderPositionSlots();
        updateNextPositionHighlight();
        
        // 팀 결과 섹션 표시
        const generatedTeams = document.getElementById('generatedTeams');
        if (generatedTeams) {
            generatedTeams.style.display = 'flex';
        }

        // 캡처 버튼 표시
        const captureBtn = document.getElementById('captureTeamBtn');
        if (captureBtn) {
            captureBtn.style.display = 'block';
        }

        console.log('팀 생성 완료:', teams);
        
    } catch (error) {
        console.error('팀 생성 오류:', error);
        alert('팀 생성 중 오류가 발생했습니다: ' + error.message);
    }
}

// 대기석에 팀 플레이어들 렌더링
function renderTeamsInWaitingArea(teams) {
    // 가나다 순으로 정렬
    const sortedTeam1 = [...teams.team1].sort((a, b) => a.localeCompare(b, 'ko-KR'));
    const sortedTeam2 = [...teams.team2].sort((a, b) => a.localeCompare(b, 'ko-KR'));
    
    renderWaitingPlayers('team1', sortedTeam1);
    renderWaitingPlayers('team2', sortedTeam2);
}

// 특정 팀의 대기석 플레이어들 렌더링
function renderWaitingPlayers(teamId, players) {
    const waitingArea = document.getElementById(`${teamId}Waiting`);
    const waitingSection = document.getElementById(`${teamId}WaitingSection`);
    if (!waitingArea || !waitingSection) return;
    
    waitingArea.innerHTML = '';
    
    // 모든 포지션이 배치되었는지 확인
    const allPositionsFilled = positionPlayers[teamId].every(player => player !== null);
    
    // 대기석 섹션은 항상 보이도록 설정 (포지션에서 플레이어를 빼낼 수 있도록)
    waitingSection.style.display = 'block';
    
    // 대기석 영역에 드롭 기능 설정 (포지션에서 돌아오는 플레이어용) - 항상 설정
    setupWaitingAreaDrop(waitingArea, teamId);
    
    // 모든 포지션이 채워져서 대기석에 플레이어가 없는 경우
    if (allPositionsFilled && players.length === 0) {
        // 플레이어 버튼은 생성하지 않지만 드롭 기능은 유지
        console.log(`${teamId} 모든 포지션 채워짐, 대기석 드롭 기능 유지`);
        return; 
    }
    
    players.forEach(player => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'waiting-player-btn btn btn-sm';
        button.textContent = player;
        button.dataset.team = teamId;
        button.dataset.player = player;
        button.title = player; // 툴팁으로 전체 이름 표시
        
        // 현재 배정 차례인 팀의 플레이어만 클릭 가능
        const nextPosition = currentPositionToAssign[teamId];
        if (nextPosition < 5) {
            button.classList.add('clickable');
            button.addEventListener('click', () => handleWaitingPlayerClick(teamId, player, button));
        }
        
        // 드래그 기능 설정
        setupWaitingPlayerDrag(button, teamId, player);
        
        // 통합 드롭 기능 설정 (팀간 교환 + 포지션 교체)
        setupWaitingPlayerUnifiedDrop(button, teamId, player);
        
        waitingArea.appendChild(button);
    });
}

// 플레이어의 해당 포지션 태그 가져오기
function getPositionTagForPlayer(playerName, positionIndex) {
    if (!gameDataForTeamBuilder || !gameDataForTeamBuilder.players) return '';

    const player = gameDataForTeamBuilder.players.find(p =>
        p.name.toLowerCase() === playerName.toLowerCase()
    );
    if (!player || !player.positions) return '';

    const positionKey = POSITION_KEYS[positionIndex];
    const posData = player.positions[positionKey];
    if (!posData) return '';

    const games = (posData.wins || 0) + (posData.losses || 0);
    if (games < 5) return '';

    const winRate = games > 0 ? (posData.wins / games) * 100 : 0;

    const positionTags = {
        top: { high: '제우스', low: '망나니' },
        jungle: { high: '오너', low: 'ㅈㄱㅊㅇ' },
        mid: { high: '페이커', low: '미드 오픈' },
        adc: { high: '구마유시', low: '숟가락' },
        support: { high: '케리아', low: '"도구"' }
    };

    const tag = positionTags[positionKey];
    const positionName = POSITIONS[positionIndex];

    const tooltips = {
        top: { high: '탑 승률 65% 이상', low: '탑 승률 35% 이하' },
        jungle: { high: '정글 승률 65% 이상', low: '정글 승률 35% 이하' },
        mid: { high: '미드 승률 65% 이상', low: '미드 승률 35% 이하' },
        adc: { high: '원딜 승률 65% 이상', low: '원딜 승률 35% 이하' },
        support: { high: '서폿 승률 65% 이상', low: '서폿 승률 35% 이하' }
    };

    if (tag && winRate >= 65) {
        const tooltip = tooltips[positionKey].high;
        return `<span class="synergy-badge position-high position-tag-mini" title="${tooltip}">${tag.high}</span>`;
    } else if (tag && winRate <= 35) {
        const tooltip = tooltips[positionKey].low;
        return `<span class="synergy-badge position-low position-tag-mini" title="${tooltip}">${tag.low}</span>`;
    }

    return '';
}

// 포지션 슬롯들 렌더링
function renderPositionSlots() {
    renderTeamPositions('team1');
    renderTeamPositions('team2');
}

// 특정 팀의 포지션 슬롯들 업데이트
function renderTeamPositions(teamId) {
    const positionsContainer = document.getElementById(`${teamId}Positions`);
    if (!positionsContainer) return;
    
    // 모든 위치가 채워졌는지 확인
    const allPositionsFilled = positionPlayers[teamId].every(player => player !== null);
    
    const slots = positionsContainer.querySelectorAll('.position-slot');
    slots.forEach((slot, index) => {
        const playerNameSpan = slot.querySelector('.player-name');
        const assignedPlayer = positionPlayers[teamId][index];
        
        // 모든 드래그 관련 클래스 제거 (기울어짐 방지)
        slot.classList.remove('dragging', 'drag-over');
        
        if (assignedPlayer) {
            // 포지션 태그 계산
            const positionTag = getPositionTagForPlayer(assignedPlayer, index);

            // 팀에 따라 태그 위치 결정 (팀1은 왼쪽, 팀2는 오른쪽)
            if (teamId === 'team1') {
                playerNameSpan.innerHTML = positionTag ? `<span class="position-tag-mini">${positionTag}</span>${assignedPlayer}` : assignedPlayer;
            } else {
                playerNameSpan.innerHTML = positionTag ? `${assignedPlayer}<span class="position-tag-mini">${positionTag}</span>` : assignedPlayer;
            }

            slot.classList.add('filled');
            slot.classList.remove('next-to-fill');
        } else {
            playerNameSpan.textContent = '-';
            slot.classList.remove('filled');
        }
        
        // 드래그 앤 드롭 설정 (빈 슬롯도 드롭 가능하도록)
        setupPositionSlotDrop(slot, teamId, index);
        
        // 플레이어가 배치된 포지션은 항상 드래그 가능 (대기석으로 이동용)
        if (assignedPlayer) {
            setupPositionPlayerDrag(slot, teamId, index);
            
            // 포지션 클릭으로 대기석 이동 기능 추가
            setupPositionPlayerClick(slot, teamId, index);
            
            // 모든 위치가 채워진 경우에만 추가로 포지션간 이동도 활성화
            if (allPositionsFilled) {
                setupDragAndDrop(slot, teamId, index);
            }
        } else {
            // 빈 슬롯은 드래그 비활성화
            slot.draggable = false;
            slot.ondragstart = null;
            slot.ondragend = null;
            slot.onclick = null; // 클릭 이벤트도 제거
        }
    });
}

// 다음에 배정할 포지션 하이라이트
function updateNextPositionHighlight() {
    // 모든 next-to-fill 클래스 제거
    const allSlots = document.querySelectorAll('.position-slot');
    allSlots.forEach(slot => slot.classList.remove('next-to-fill'));
    
    // 각 팀의 다음 포지션에 하이라이트 추가
    ['team1', 'team2'].forEach(teamId => {
        const nextPos = currentPositionToAssign[teamId];
        if (nextPos < 5) {
            const positionsContainer = document.getElementById(`${teamId}Positions`);
            if (positionsContainer) {
                const nextSlot = positionsContainer.querySelector(`[data-position="${nextPos}"]`);
                if (nextSlot) {
                    nextSlot.classList.add('next-to-fill');
                }
            }
        }
    });
}

// 대기석 플레이어 클릭 처리
function handleWaitingPlayerClick(teamId, playerName, buttonElement) {
    // 실제로 비어있는 첫 번째 포지션 찾기 (드래그로 중간이 채워졌을 수 있음)
    let nextPosition = -1;
    for (let i = 0; i < 5; i++) {
        if (positionPlayers[teamId][i] === null) {
            nextPosition = i;
            break;
        }
    }
    
    if (nextPosition === -1) {
        alert('이미 모든 포지션이 배정되었습니다.');
        return;
    }
    
    // 포지션에 플레이어 배정
    positionPlayers[teamId][nextPosition] = playerName;
    
    // 대기석에서 플레이어 제거
    const playerIndex = currentTeams[teamId].indexOf(playerName);
    if (playerIndex > -1) {
        currentTeams[teamId].splice(playerIndex, 1);
    }
    
    // 현재 배정할 포지션 업데이트
    updateCurrentPositionToAssign(teamId);
    
    // UI 업데이트 (대기석 재정렬)
    const sortedWaitingPlayers = [...currentTeams[teamId]].sort((a, b) => a.localeCompare(b, 'ko-KR'));
    renderWaitingPlayers(teamId, sortedWaitingPlayers);
    renderTeamPositions(teamId);
    updateNextPositionHighlight();
    updateWinButtonState(teamId);
    
    console.log(`${teamId} ${POSITIONS[nextPosition]}에 ${playerName} 배정 (클릭)`);
    console.log('현재 포지션 상태:', positionPlayers);
}

// 승리 버튼 상태 업데이트 (5명 모두 배정되었을 때만 활성화)
function updateWinButtonState(teamId) {
    const winButton = document.getElementById(`${teamId}WinBtnNew`);
    if (!winButton) return;
    
    const teamPositions = positionPlayers[teamId];
    const allPositionsFilled = teamPositions.every(player => player !== null);
    
    if (allPositionsFilled) {
        winButton.style.display = 'block';
    } else {
        winButton.style.display = 'none';
    }
}


// 현재 배정된 팀 정보 반환
export function getSelectedTeams() {
    return {
        team1: positionPlayers.team1.filter(p => p !== null),
        team2: positionPlayers.team2.filter(p => p !== null)
    };
}

// 드래그 앤 드롭 이벤트 설정 함수
function setupDragAndDrop(slot, teamId, index) {
    // 모든 위치가 채워졌는지 확인
    const allPositionsFilled = positionPlayers[teamId].every(player => player !== null);
    if (!allPositionsFilled) {
        return; // 모든 위치가 채워지지 않았으면 드래그 비활성화
    }
    
    // 드래그 가능하도록 설정
    slot.draggable = true;
    
    // 드래그 시작
    slot.ondragstart = function(e) {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            sourceTeamId: teamId,
            sourceIndex: index,
            playerName: positionPlayers[teamId][index]
        }));
        slot.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    };
    
    // 드래그 종료
    slot.ondragend = function(e) {
        slot.classList.remove('dragging');
        // 모든 슬롯에서 drag-over 클래스 제거
        const allSlots = document.querySelectorAll('.position-slot');
        allSlots.forEach(s => s.classList.remove('drag-over'));
    };
    
    // 드래그 오버
    slot.ondragover = function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // 채워진 슬롯에만 드롭 허용 표시
        if (positionPlayers[teamId][index] !== null) {
            slot.classList.add('drag-over');
        }
    };
    
    // 드래그 리브
    slot.ondragleave = function(e) {
        slot.classList.remove('drag-over');
    };
    
    // 드롭
    slot.ondrop = function(e) {
        e.preventDefault();
        slot.classList.remove('drag-over');
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            const sourceTeamId = dragData.sourceTeamId;
            const sourceIndex = dragData.sourceIndex;
            const targetTeamId = teamId;
            const targetIndex = index;
            
            // 같은 팀 내에서만 스왑 허용
            if (sourceTeamId !== targetTeamId) {
                return;
            }
            
            // 같은 위치면 무시
            if (sourceIndex === targetIndex) {
                return;
            }
            
            // 두 위치가 모두 채워져 있어야 스왑 가능
            if (positionPlayers[sourceTeamId][sourceIndex] === null || 
                positionPlayers[targetTeamId][targetIndex] === null) {
                return;
            }
            
            // 플레이어 위치 교환
            const sourcePlayer = positionPlayers[sourceTeamId][sourceIndex];
            const targetPlayer = positionPlayers[targetTeamId][targetIndex];
            
            positionPlayers[sourceTeamId][sourceIndex] = targetPlayer;
            positionPlayers[targetTeamId][targetIndex] = sourcePlayer;
            
            // UI 업데이트
            renderTeamPositions(teamId);
            
            console.log(`${POSITIONS[sourceIndex]}과 ${POSITIONS[targetIndex]} 위치 교환: ${sourcePlayer} ↔ ${targetPlayer}`);
            
        } catch (error) {
            console.error('드래그 앤 드롭 처리 중 오류:', error);
        }
    };
}

// 현재 팀 정보 반환
export function getCurrentTeams() {
    return currentTeams;
}

// 팀 구성을 유지하면서 대기석으로 복원 (승리 후 같은 팀으로 다시 플레이)
export function resetToWaitingAreaWithTeams() {
    // 현재 배정된 플레이어들을 대기석으로 복원 (팀 구성 유지)
    currentTeams = {
        team1: [...positionPlayers.team1.filter(p => p !== null)],
        team2: [...positionPlayers.team2.filter(p => p !== null)]
    };
    
    // 포지션 배치 초기화
    positionPlayers = {
        team1: Array(5).fill(null),
        team2: Array(5).fill(null)
    };
    
    // 현재 배정할 포지션 초기화
    currentPositionToAssign = {
        team1: 0,
        team2: 0
    };
    
    // UI 업데이트 (대기석 정렬 적용)
    renderTeamsInWaitingArea(currentTeams);
    renderPositionSlots();
    updateNextPositionHighlight();
    
    // 승리 버튼 숨기기
    const winButtons = document.querySelectorAll('[id$="WinBtnNew"]');
    winButtons.forEach(btn => btn.style.display = 'none');
    
    // 대기석 섹션 다시 보이기
    const waitingSections = document.querySelectorAll('[id$="WaitingSection"]');
    waitingSections.forEach(section => section.style.display = 'block');
    
    console.log('팀 구성을 유지하며 대기석으로 복원 완료');
}

// 선택 초기화
export function clearTeamSelection() {
    // 대기석으로 모든 플레이어 복원
    const allTeam1Players = [...positionPlayers.team1.filter(p => p !== null), ...currentTeams.team1];
    const allTeam2Players = [...positionPlayers.team2.filter(p => p !== null), ...currentTeams.team2];
    
    currentTeams = {
        team1: allTeam1Players,
        team2: allTeam2Players
    };
    
    // 포지션 배치 초기화
    positionPlayers = {
        team1: Array(5).fill(null),
        team2: Array(5).fill(null)
    };
    
    // 현재 배정할 포지션 초기화
    currentPositionToAssign = {
        team1: 0,
        team2: 0
    };
    
    // UI 업데이트 (대기석 정렬 적용)
    renderTeamsInWaitingArea(currentTeams);
    renderPositionSlots();
    updateNextPositionHighlight();
    
    // 승리 버튼 숨기기
    const winButtons = document.querySelectorAll('[id$="WinBtnNew"]');
    winButtons.forEach(btn => btn.style.display = 'none');
    
    // 대기석 섹션 다시 보이기
    const waitingSections = document.querySelectorAll('[id$="WaitingSection"]');
    waitingSections.forEach(section => section.style.display = 'block');
    
    console.log('팀 선택 초기화 완료');
}

// 대기석 플레이어 드래그 설정
function setupWaitingPlayerDrag(button, teamId, playerName) {
    button.draggable = true;
    
    button.ondragstart = function(e) {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            sourceType: 'waiting',
            teamId: teamId,
            playerName: playerName
        }));
        button.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    };
    
    button.ondragend = function(e) {
        button.classList.remove('dragging');
        // 모든 대기석 플레이어에서 drag-over 클래스 제거
        const allWaitingButtons = document.querySelectorAll('.waiting-player-btn');
        allWaitingButtons.forEach(btn => btn.classList.remove('drag-over'));
    };
}

// 통합 대기석 플레이어 드롭 설정 (팀간 교환 + 포지션 교체)
function setupWaitingPlayerUnifiedDrop(button, teamId, playerName) {
    console.log(`setupWaitingPlayerUnifiedDrop 설정: ${playerName} (${teamId})`);
    
    button.ondragover = function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            
            // 다른 팀 대기석에서 오는 드래그 (팀간 교환)
            if (dragData.sourceType === 'waiting' && dragData.teamId !== teamId) {
                console.log(`팀간 교환 드래그 오버: ${dragData.playerName} -> ${playerName}`);
                button.classList.add('drag-over');
            }
            // 같은 팀 포지션에서 오는 드래그 (포지션-대기석 교체)
            else if (dragData.sourceType === 'position' && dragData.teamId === teamId) {
                console.log(`포지션-대기석 교체 드래그 오버: ${dragData.playerName} -> ${playerName}`);
                button.classList.add('drag-over');
            }
        } catch (error) {
            console.log('통합 드롭 드래그 데이터 파싱 실패:', error);
        }
    };
    
    button.ondragleave = function(e) {
        button.classList.remove('drag-over');
    };
    
    button.ondrop = function(e) {
        e.preventDefault();
        e.stopPropagation();
        button.classList.remove('drag-over');
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            console.log(`통합 드롭 시도:`, dragData);
            
            // 다른 팀 대기석에서 오는 드래그 (팀간 교환)
            if (dragData.sourceType === 'waiting' && dragData.teamId !== teamId) {
                const sourceTeamId = dragData.teamId;
                const sourcePlayerName = dragData.playerName;
                const targetTeamId = teamId;
                const targetPlayerName = playerName;
                
                console.log(`팀간 교환 실행: ${sourcePlayerName}(${sourceTeamId}) ↔ ${targetPlayerName}(${targetTeamId})`);
                
                // 소스 팀에서 드래그된 플레이어 제거하고 타겟 플레이어 추가
                const sourcePlayerIndex = currentTeams[sourceTeamId].indexOf(sourcePlayerName);
                if (sourcePlayerIndex > -1) {
                    currentTeams[sourceTeamId].splice(sourcePlayerIndex, 1);
                    currentTeams[sourceTeamId].push(targetPlayerName);
                }
                
                // 타겟 팀에서 타겟 플레이어 제거하고 소스 플레이어 추가
                const targetPlayerIndex = currentTeams[targetTeamId].indexOf(targetPlayerName);
                if (targetPlayerIndex > -1) {
                    currentTeams[targetTeamId].splice(targetPlayerIndex, 1);
                    currentTeams[targetTeamId].push(sourcePlayerName);
                }
                
                // UI 업데이트 (정렬 적용)
                const sortedTeam1 = [...currentTeams.team1].sort((a, b) => a.localeCompare(b, 'ko-KR'));
                const sortedTeam2 = [...currentTeams.team2].sort((a, b) => a.localeCompare(b, 'ko-KR'));
                
                renderWaitingPlayers('team1', sortedTeam1);
                renderWaitingPlayers('team2', sortedTeam2);
                
                console.log(`팀간 교환 완료: ${sourcePlayerName}(${sourceTeamId}) ↔ ${targetPlayerName}(${targetTeamId})`);
            }
            // 같은 팀 포지션에서 오는 드래그 (포지션-대기석 교체)
            else if (dragData.sourceType === 'position' && dragData.teamId === teamId) {
                const positionIndex = dragData.positionIndex;
                const positionPlayerName = dragData.playerName;
                const waitingPlayerName = playerName;
                
                console.log(`포지션-대기석 교체 실행: 포지션 ${positionPlayerName} <-> 대기석 ${waitingPlayerName}`);
                
                // 교체 실행: 포지션에는 대기석 플레이어, 대기석에는 포지션 플레이어
                positionPlayers[teamId][positionIndex] = waitingPlayerName;
                
                // 대기석에서 기존 플레이어 제거하고 포지션에서 온 플레이어로 교체
                const waitingPlayerIndex = currentTeams[teamId].indexOf(waitingPlayerName);
                if (waitingPlayerIndex > -1) {
                    currentTeams[teamId][waitingPlayerIndex] = positionPlayerName;
                }
                
                // 현재 배정할 포지션 업데이트
                updateCurrentPositionToAssign(teamId);
                
                // UI 업데이트 (정렬 적용)
                const sortedWaitingPlayers = [...currentTeams[teamId]].sort((a, b) => a.localeCompare(b, 'ko-KR'));
                renderWaitingPlayers(teamId, sortedWaitingPlayers);
                renderTeamPositions(teamId);
                updateNextPositionHighlight();
                updateWinButtonState(teamId);
                
                console.log(`포지션-대기석 교체 완료: ${POSITIONS[positionIndex]}의 ${positionPlayerName}과(와) 대기석의 ${waitingPlayerName}`);
            }
        } catch (error) {
            console.error('통합 드롭 처리 오류:', error);
        }
    };
}

// 포지션 슬롯 드롭 설정 (대기석에서 오는 드래그 처리)
function setupPositionSlotDrop(slot, teamId, index) {
    slot.ondragover = function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            
            // 대기석에서 오는 드래그인 경우 드롭 허용 (빈 슬롯이든 채워진 슬롯이든)
            if (dragData.sourceType === 'waiting' && dragData.teamId === teamId) {
                slot.classList.add('drag-over');
            }
        } catch (error) {
            // 드래그 데이터를 읽을 수 없는 경우 무시
        }
    };
    
    slot.ondragleave = function(e) {
        slot.classList.remove('drag-over');
    };
    
    slot.ondrop = function(e) {
        e.preventDefault();
        slot.classList.remove('drag-over');
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            
            // 대기석에서 포지션으로 드롭하는 경우
            if (dragData.sourceType === 'waiting' && dragData.teamId === teamId) {
                const waitingPlayerName = dragData.playerName;
                const currentPositionPlayer = positionPlayers[teamId][index];
                
                if (currentPositionPlayer === null) {
                    // 빈 슬롯에 배정
                    console.log(`빈 포지션에 배정: ${waitingPlayerName} -> ${POSITIONS[index]}`);
                    
                    positionPlayers[teamId][index] = waitingPlayerName;
                    
                    // 대기석에서 플레이어 제거
                    const playerIndex = currentTeams[teamId].indexOf(waitingPlayerName);
                    if (playerIndex > -1) {
                        currentTeams[teamId].splice(playerIndex, 1);
                    }
                } else {
                    // 채워진 슬롯과 교체
                    console.log(`포지션 교체: 대기석 ${waitingPlayerName} <-> 포지션 ${currentPositionPlayer}`);
                    
                    positionPlayers[teamId][index] = waitingPlayerName;
                    
                    // 대기석에서 플레이어 제거하고 기존 포지션 플레이어 추가
                    const playerIndex = currentTeams[teamId].indexOf(waitingPlayerName);
                    if (playerIndex > -1) {
                        currentTeams[teamId][playerIndex] = currentPositionPlayer; // 교체
                    } else {
                        // 안전장치
                        currentTeams[teamId].push(currentPositionPlayer);
                    }
                }
                
                // 현재 배정 위치 업데이트
                updateCurrentPositionToAssign(teamId);
                
                // UI 업데이트
                const sortedWaitingPlayers = [...currentTeams[teamId]].sort((a, b) => a.localeCompare(b, 'ko-KR'));
                renderWaitingPlayers(teamId, sortedWaitingPlayers);
                renderTeamPositions(teamId);
                updateNextPositionHighlight();
                updateWinButtonState(teamId);
                
                console.log(`${POSITIONS[index]} 포지션 업데이트 완료`);
            }
        } catch (error) {
            console.error('드롭 처리 오류:', error);
        }
    };
}

// 포지션 플레이어 드래그 설정 (대기석으로 돌려보내기용)
function setupPositionPlayerDrag(slot, teamId, index) {
    slot.draggable = true;
    
    slot.ondragstart = function(e) {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            sourceType: 'position',
            teamId: teamId,
            positionIndex: index,
            playerName: positionPlayers[teamId][index]
        }));
        slot.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    };
    
    slot.ondragend = function(e) {
        slot.classList.remove('dragging');
        // 대기석 영역에서 drag-over 클래스 제거
        const waitingAreas = document.querySelectorAll('.waiting-area-vertical');
        waitingAreas.forEach(area => area.classList.remove('drag-over'));
    };
}

// 포지션 플레이어 클릭으로 대기석 이동 설정
function setupPositionPlayerClick(slot, teamId, index) {
    slot.onclick = function(e) {
        // 드래그 이벤트와 구분하기 위해 짧은 지연 후 실행
        setTimeout(() => {
            if (!slot.classList.contains('dragging')) {
                const playerName = positionPlayers[teamId][index];
                if (playerName) {
                    console.log(`포지션 클릭: ${playerName} (${POSITIONS[index]} -> 대기석)`);
                    
                    // 포지션에서 플레이어 제거
                    positionPlayers[teamId][index] = null;
                    
                    // 대기석에 플레이어 추가
                    currentTeams[teamId].push(playerName);
                    
                    // 현재 배정할 포지션 업데이트
                    updateCurrentPositionToAssign(teamId);
                    
                    // UI 업데이트 (정렬 적용)
                    const sortedWaitingPlayers = [...currentTeams[teamId]].sort((a, b) => a.localeCompare(b, 'ko-KR'));
                    renderWaitingPlayers(teamId, sortedWaitingPlayers);
                    renderTeamPositions(teamId);
                    updateNextPositionHighlight();
                    updateWinButtonState(teamId);
                    
                    console.log(`${POSITIONS[index]}에서 ${playerName}을(를) 클릭으로 대기석 이동 완료`);
                }
            }
        }, 50);
    };
}

// 현재 배정할 포지션 업데이트 (빈 곳이 생겼을 때)
function updateCurrentPositionToAssign(teamId) {
    // 첫 번째 빈 포지션을 찾아서 currentPositionToAssign 업데이트
    for (let i = 0; i < 5; i++) {
        if (positionPlayers[teamId][i] === null) {
            currentPositionToAssign[teamId] = i;
            return;
        }
    }
    // 모든 포지션이 채워진 경우
    currentPositionToAssign[teamId] = 5;
}

// 대기석 영역 드롭 설정 (포지션에서 돌아오는 플레이어용)
function setupWaitingAreaDrop(waitingArea, teamId) {
    console.log(`setupWaitingAreaDrop 설정: ${teamId}`);
    
    waitingArea.ondragover = function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            
            // 두 가지 드래그 데이터 형식을 모두 처리
            const isPositionDrag = (
                (dragData.sourceType === 'position' && dragData.teamId === teamId) ||
                (dragData.sourceTeamId === teamId && dragData.sourceIndex !== undefined)
            );
            
            if (isPositionDrag) {
                const playerName = dragData.playerName;
                console.log(`대기석 드래그 오버: ${playerName}`);
                if (!e.target || !e.target.classList.contains('waiting-player-btn')) {
                    waitingArea.classList.add('drag-over');
                }
            }
        } catch (error) {
            // 드래그 데이터를 읽을 수 없는 경우 무시
            console.log('드래그 데이터 파싱 실패:', error);
        }
    };
    
    waitingArea.ondragleave = function(e) {
        // 자식 요소로 이동하는 경우가 아닐 때만 drag-over 제거
        if (!waitingArea.contains(e.relatedTarget)) {
            waitingArea.classList.remove('drag-over');
        }
    };
    
    waitingArea.ondrop = function(e) {
        console.log(`대기석 드롭 시도: 타겟=${e.target?.tagName}, 클래스=${e.target?.className}`);
        
        // 대기석 플레이어 버튼이 타겟인 경우 처리하지 않음 (교체 기능 우선)
        if (e.target && e.target.classList.contains('waiting-player-btn')) {
            console.log('대기석 플레이어 버튼 위로 드롭 - 교체 핸들러로 넘김');
            return; // 대기석 플레이어 버튼의 드롭 핸들러가 처리하도록 함
        }
        
        e.preventDefault();
        waitingArea.classList.remove('drag-over');
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            console.log(`대기석 드롭 데이터:`, dragData);
            
            // 두 가지 드래그 데이터 형식을 모두 처리
            let positionIndex, playerName;
            let isValidDrop = false;
            
            if (dragData.sourceType === 'position' && dragData.teamId === teamId) {
                // setupPositionPlayerDrag에서 온 데이터
                positionIndex = dragData.positionIndex;
                playerName = dragData.playerName;
                isValidDrop = true;
                console.log(`타입1 드롭: setupPositionPlayerDrag에서 온 데이터`);
            } else if (dragData.sourceTeamId === teamId && dragData.sourceIndex !== undefined) {
                // setupDragAndDrop에서 온 데이터 (포지션간 교체용이지만 대기석으로도 허용)
                positionIndex = dragData.sourceIndex;
                playerName = dragData.playerName;
                isValidDrop = true;
                console.log(`타입2 드롭: setupDragAndDrop에서 온 데이터`);
            }
            
            if (isValidDrop) {
                console.log(`대기석 빈 공간으로 이동: ${playerName} (${POSITIONS[positionIndex]} -> 대기석)`);
                
                // 포지션에서 플레이어 제거
                positionPlayers[teamId][positionIndex] = null;
                
                // 대기석에 플레이어 추가
                currentTeams[teamId].push(playerName);
                
                // 현재 배정할 포지션 업데이트
                updateCurrentPositionToAssign(teamId);
                
                // UI 업데이트 (정렬 적용)
                const sortedWaitingPlayers = [...currentTeams[teamId]].sort((a, b) => a.localeCompare(b, 'ko-KR'));
                renderWaitingPlayers(teamId, sortedWaitingPlayers);
                renderTeamPositions(teamId);
                updateNextPositionHighlight();
                updateWinButtonState(teamId);
                
                console.log(`${POSITIONS[positionIndex]}에서 ${playerName}을(를) 대기석으로 이동 완료`);
            } else {
                console.log(`드롭 조건 불만족:`, dragData);
            }
        } catch (error) {
            console.error('대기석 드롭 처리 오류:', error);
        }
    };
}

// 대기석 플레이어에 포지션 플레이어 드롭 설정 (교체용)
function setupWaitingPlayerDropFromPosition(button, teamId, playerName) {
    button.ondragover = function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            
            // 같은 팀의 포지션에서 오는 드래그인 경우에만 교체 허용
            if (dragData.sourceType === 'position' && dragData.teamId === teamId) {
                button.classList.add('drag-over');
            }
        } catch (error) {
            // 드래그 데이터를 읽을 수 없는 경우 무시
        }
    };
    
    button.ondragleave = function(e) {
        button.classList.remove('drag-over');
    };
    
    button.ondrop = function(e) {
        e.preventDefault();
        e.stopPropagation(); // 이벤트 버블링 방지
        button.classList.remove('drag-over');
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            
            // 같은 팀의 포지션에서 대기석 플레이어로 드롭하는 경우 (교체)
            if (dragData.sourceType === 'position' && dragData.teamId === teamId) {
                const positionIndex = dragData.positionIndex;
                const positionPlayerName = dragData.playerName;
                const waitingPlayerName = playerName;
                
                console.log(`교체 시도: 포지션 ${positionPlayerName} <-> 대기석 ${waitingPlayerName}`);
                
                // 교체 실행: 포지션에는 대기석 플레이어, 대기석에는 포지션 플레이어
                positionPlayers[teamId][positionIndex] = waitingPlayerName;
                
                // 대기석에서 기존 플레이어 제거하고 포지션에서 온 플레이어로 교체
                const waitingPlayerIndex = currentTeams[teamId].indexOf(waitingPlayerName);
                if (waitingPlayerIndex > -1) {
                    currentTeams[teamId][waitingPlayerIndex] = positionPlayerName; // 교체
                    console.log(`교체 성공: currentTeams[${teamId}] 업데이트됨`);
                } else {
                    // 안전장치: 인덱스를 찾지 못한 경우
                    console.error(`대기석에서 ${waitingPlayerName}을 찾을 수 없습니다.`);
                    currentTeams[teamId].push(positionPlayerName);
                }
                
                // 현재 배정할 포지션 업데이트
                updateCurrentPositionToAssign(teamId);
                
                // UI 업데이트 (정렬 적용)
                const sortedWaitingPlayers = [...currentTeams[teamId]].sort((a, b) => a.localeCompare(b, 'ko-KR'));
                renderWaitingPlayers(teamId, sortedWaitingPlayers);
                renderTeamPositions(teamId);
                updateNextPositionHighlight();
                updateWinButtonState(teamId);
                
                console.log(`${POSITIONS[positionIndex]}의 ${positionPlayerName}과(와) 대기석의 ${waitingPlayerName} 교체 완료`);
            }
        } catch (error) {
            console.error('포지션-대기석 플레이어 교체 오류:', error);
        }
    };
}
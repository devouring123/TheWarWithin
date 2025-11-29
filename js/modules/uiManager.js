import { getWinrateClass, getPositionName } from './utils.js';
import { handleTeamWin as handleTeamWinGame, addToGoogleSheetsRecord } from './gameManager.js';
import { clearPlayerSelection, getRecentFormHtml, getSelectedPlayers, getPlayerTagsHtml, renderTagGlossary } from './playerManager.js';
import { setupTeamBuilder, clearTeamSelection, getSelectedTeams, resetToWaitingAreaWithTeams } from './teamBuilder.js';
import { ToastManager } from './toast.js';

// MVP/ACE 선택 관련 전역 변수
let selectedMvp = null;
let selectedAce = null;
let pendingGameResult = null;
let pendingWinningTeam = null;

// Confetti 애니메이션 (승리 축하)
function triggerVictoryConfetti() {
    // canvas-confetti 라이브러리가 로드되었는지 확인
    if (typeof confetti !== 'function') {
        console.warn('canvas-confetti 라이브러리가 로드되지 않았습니다.');
        return;
    }

    // 기본 confetti 발사
    const count = 200;
    const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999
    };

    function fire(particleRatio, opts) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
        });
    }

    // 여러 번 다양한 설정으로 발사
    fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ['#8b5cf6', '#3b82f6', '#06b6d4'] // 보라, 파랑, 청록
    });
    fire(0.2, {
        spread: 60,
        colors: ['#10b981', '#f59e0b'] // 녹색, 주황
    });
    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        colors: ['#ec4899', '#ef4444'] // 분홍, 빨강
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
        colors: ['#fafafa', '#fbbf24'] // 흰색, 금색
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
        colors: ['#8b5cf6', '#06b6d4', '#10b981']
    });
}

// 로딩 스피너 관리 (HTML의 #loading 요소 사용)
export const SpinnerManager = {
    getOverlay: function() {
        return document.getElementById('loading');
    },
    show: function(message = '처리 중...') {
        const overlay = this.getOverlay();
        if (!overlay) return;

        // 메시지 업데이트
        const messageEl = overlay.querySelector('.loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }

        overlay.style.display = 'flex';
    },
    hide: function() {
        const overlay = this.getOverlay();
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
};

// 컴팩트 모드 설정
let isCompactMode = localStorage.getItem('playerCardCompact') === 'true';

// 컴팩트 모드 토글 함수
export function toggleCompactMode(gameData) {
    isCompactMode = !isCompactMode;
    localStorage.setItem('playerCardCompact', isCompactMode.toString());
    updateCompactModeButton();

    // 기존 카드들의 클래스 토글 (애니메이션)
    const cardCols = document.querySelectorAll('.player-card-col');
    const playerCards = document.querySelectorAll('.player-card');

    cardCols.forEach(col => {
        if (isCompactMode) {
            col.classList.remove('detailed-mode');
            col.classList.add('compact-mode');
        } else {
            col.classList.remove('compact-mode');
            col.classList.add('detailed-mode');
        }
    });

    playerCards.forEach(card => {
        if (isCompactMode) {
            card.classList.add('player-card-compact');
        } else {
            card.classList.remove('player-card-compact');
        }
    });

    // 상세 모드로 전환 시 차트 렌더링
    if (!isCompactMode && gameData?.players) {
        const sortedPlayers = [...gameData.players].sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
        setTimeout(() => {
            sortedPlayers.forEach((player, index) => {
                renderPlayerPositionChart(player, `playerChart${index}`);
            });
        }, 100);
    }

    return isCompactMode;
}

// 컴팩트 모드 상태 반환
export function getCompactMode() {
    return isCompactMode;
}

// 컴팩트 모드 버튼 UI 업데이트
function updateCompactModeButton() {
    const btn = document.getElementById('toggleCardMode');
    if (btn) {
        if (isCompactMode) {
            btn.innerHTML = '<i class="fas fa-expand-alt"></i> 카드 상세';
            btn.classList.remove('btn-outline-secondary');
            btn.classList.add('btn-secondary');
        } else {
            btn.innerHTML = '<i class="fas fa-compress-alt"></i> 카드 요약';
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-outline-secondary');
        }
    }
}

// 티어별 색상과 첫 글자 매핑 함수
function getTierInfo(tier) {
    const tierName = tier.toLowerCase().replace(/\s/g, '');
    
    // 티어별 정보 매핑 (첫 글자, 색상, 텍스트 색상)
    const tierMappings = {
        '언랭': { char: '-', bgColor: '#808080', textColor: '#FFFFFF' }, // 회색
        '아이언': { char: '아', bgColor: '#6C7B7F', textColor: '#FFFFFF' }, // 철색
        'iron': { char: 'I', bgColor: '#6C7B7F', textColor: '#FFFFFF' },
        '브론즈': { char: '브', bgColor: '#CD7F32', textColor: '#FFFFFF' }, // 청동색
        'bronze': { char: 'B', bgColor: '#CD7F32', textColor: '#FFFFFF' },
        '실버': { char: '실', bgColor: '#C0C0C0', textColor: '#000000' }, // 은색
        'silver': { char: 'S', bgColor: '#C0C0C0', textColor: '#000000' },
        '골드': { char: '골', bgColor: '#FFD700', textColor: '#000000' }, // 금색
        'gold': { char: 'G', bgColor: '#FFD700', textColor: '#000000' },
        '플래티넘': { char: '플', bgColor: '#20B2AA', textColor: '#FFFFFF' }, // 청록색
        'platinum': { char: 'P', bgColor: '#20B2AA', textColor: '#FFFFFF' },
        '에메랄드': { char: '에', bgColor: '#50C878', textColor: '#FFFFFF' }, // 에메랄드색
        'emerald': { char: 'E', bgColor: '#50C878', textColor: '#FFFFFF' },
        '다이아몬드': { char: '다', bgColor: '#B9F2FF', textColor: '#000000' }, // 다이아몬드 색상 (하늘색)
        'diamond': { char: 'D', bgColor: '#B9F2FF', textColor: '#000000' },
        '마스터': { char: '마', bgColor: '#9932CC', textColor: '#FFFFFF' }, // 보라색
        'master': { char: 'M', bgColor: '#9932CC', textColor: '#FFFFFF' },
        '그랜드마스터': { char: '그마', bgColor: '#FF4500', textColor: '#FFFFFF' }, // 주황빨강
        'grandmaster': { char: 'GM', bgColor: '#FF4500', textColor: '#FFFFFF' },
        '챌린저': { char: '챌', bgColor: '#87CEEB', textColor: '#000000' }, // 하늘 파랑색
        'challenger': { char: 'C', bgColor: '#87CEEB', textColor: '#000000' }
    };
    
    return tierMappings[tierName] || tierMappings['언랭']; // 기본값은 언랭
}

// 티어 배지 HTML 생성 함수
export function getTierBadgeHtml(tier) {
    const tierInfo = getTierInfo(tier);
    const tierClass = tier.toLowerCase().replace(/\s/g, '');

    return `<span class="tier-badge tier-${tierClass}" title="${tier}">${tierInfo.char}</span>`;
}

// 전체 현황 렌더링 (평균 게임/플레이어 제거)
export function renderOverviewStats(gameData) {
    const stats = gameData.statistics;
    const overviewEl = document.getElementById('overviewStats');
    
    overviewEl.innerHTML = `
        <div class="col-md-6 mb-3">
            <div class="stat-card">
                <h3><i class="fas fa-users me-2"></i>${gameData.total_players}</h3>
                <p class="mb-0">총 플레이어</p>
            </div>
        </div>
        <div class="col-md-6 mb-3">
            <div class="stat-card">
                <h3><i class="fas fa-gamepad me-2"></i>${stats.total_games}</h3>
                <p class="mb-0">총 게임 수</p>
            </div>
        </div>
    `;
}

// 통계표 정렬/필터 상태
let statsTableState = {
    sortColumn: 'winrate',  // 기본 정렬: 승률
    sortDirection: 'desc',  // 내림차순
    minGames: 10,           // 최소 게임 수
    tierFilter: 'all'       // 티어 필터
};

// 통계표 상태 저장 (외부에서 접근용)
export function getStatsTableState() {
    return statsTableState;
}

// 통계표 정렬 변경
export function setStatsTableSort(column, gameData) {
    if (statsTableState.sortColumn === column) {
        // 같은 컬럼 클릭 시 방향 토글
        statsTableState.sortDirection = statsTableState.sortDirection === 'desc' ? 'asc' : 'desc';
    } else {
        statsTableState.sortColumn = column;
        statsTableState.sortDirection = 'desc';
    }
    renderStatsTable(gameData);
}

// 통계표 필터 변경
export function setStatsTableFilter(filterType, value, gameData) {
    if (filterType === 'minGames') {
        statsTableState.minGames = parseInt(value) || 0;
    } else if (filterType === 'tier') {
        statsTableState.tierFilter = value;
    }
    renderStatsTable(gameData);
}

// 통계표 렌더링 (스프레드시트 스타일)
export function renderStatsTable(gameData) {
    const statsTableEl = document.getElementById('statsTable');
    const { sortColumn, sortDirection, minGames, tierFilter } = statsTableState;

    // 필터링
    let filteredPlayers = [...gameData.players]
        .filter(player => player.total_wins + player.total_losses >= minGames);

    if (tierFilter !== 'all') {
        filteredPlayers = filteredPlayers.filter(player => player.tier === tierFilter);
    }

    // LOL 티어 순서 (높은 티어 = 높은 숫자)
    const getTierRank = (tier) => {
        const tierOrder = {
            '챌린저': 11, '챌': 11,
            '그랜드마스터': 10, '그마': 10,
            '마스터': 9, '마': 9,
            '다이아몬드': 8, '다이아': 8, '다': 8,
            '에메랄드': 7, '에': 7,
            '플래티넘': 6, '플레': 6, '플': 6,
            '골드': 5, '골': 5,
            '실버': 4, '실': 4,
            '브론즈': 3, '브': 3,
            '아이언': 2, '아': 2,
            '언랭크': 1, '언랭': 1, '언': 1
        };
        return tierOrder[tier] || 0;
    };

    // 정렬
    const getSortValue = (player, column) => {
        switch (column) {
            case 'name': return player.name;
            case 'tier': return getTierRank(player.tier);
            case 'games': return player.total_games;
            case 'winrate': return player.overall_winrate;
            case 'top': return player.positions.top.games > 0 ? player.positions.top.wins / player.positions.top.games : -1;
            case 'jungle': return player.positions.jungle.games > 0 ? player.positions.jungle.wins / player.positions.jungle.games : -1;
            case 'mid': return player.positions.mid.games > 0 ? player.positions.mid.wins / player.positions.mid.games : -1;
            case 'adc': return player.positions.adc.games > 0 ? player.positions.adc.wins / player.positions.adc.games : -1;
            case 'support': return player.positions.support.games > 0 ? player.positions.support.wins / player.positions.support.games : -1;
            case 'wins': return player.total_wins;
            case 'losses': return player.total_losses;
            default: return player.overall_winrate;
        }
    };

    const sortedPlayers = filteredPlayers.sort((a, b) => {
        const aVal = getSortValue(a, sortColumn);
        const bVal = getSortValue(b, sortColumn);

        if (typeof aVal === 'string') {
            return sortDirection === 'asc'
                ? aVal.localeCompare(bVal, 'ko-KR')
                : bVal.localeCompare(aVal, 'ko-KR');
        }
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // 정렬 아이콘 생성
    const getSortIcon = (column) => {
        if (sortColumn !== column) return '<i class="fas fa-sort text-muted ms-1" style="opacity: 0.3;"></i>';
        return sortDirection === 'desc'
            ? '<i class="fas fa-sort-down ms-1"></i>'
            : '<i class="fas fa-sort-up ms-1"></i>';
    };

    const headerRow = `
        <thead>
            <tr>
                <th class="text-center">순위</th>
                <th class="text-center sortable-header" data-sort="name">이름${getSortIcon('name')}</th>
                <th class="text-center sortable-header" data-sort="tier">티어${getSortIcon('tier')}</th>
                <th class="text-center sortable-header" data-sort="games">게임${getSortIcon('games')}</th>
                <th class="text-center sortable-header" data-sort="winrate">승률${getSortIcon('winrate')}</th>
                <th class="text-center sortable-header" data-sort="top"><img src="img/positions/Top.svg" alt="TOP" class="position-header-icon" title="TOP">${getSortIcon('top')}</th>
                <th class="text-center sortable-header" data-sort="jungle"><img src="img/positions/Jug.svg" alt="JGL" class="position-header-icon" title="JGL">${getSortIcon('jungle')}</th>
                <th class="text-center sortable-header" data-sort="mid"><img src="img/positions/Mid.svg" alt="MID" class="position-header-icon" title="MID">${getSortIcon('mid')}</th>
                <th class="text-center sortable-header" data-sort="adc"><img src="img/positions/Bot.svg" alt="ADC" class="position-header-icon" title="ADC">${getSortIcon('adc')}</th>
                <th class="text-center sortable-header" data-sort="support"><img src="img/positions/Sup.svg" alt="SUP" class="position-header-icon" title="SUP">${getSortIcon('support')}</th>
                <th class="text-center sortable-header" data-sort="wins">승${getSortIcon('wins')}</th>
                <th class="text-center sortable-header" data-sort="losses">패${getSortIcon('losses')}</th>
            </tr>
        </thead>
    `;
    
    const bodyRows = sortedPlayers.map((player, index) => {
        const winrateClass = getWinrateClass(player.overall_winrate);
        const winrateColor = winrateClass === 'winrate-high' ? '#28a745' : 
                            winrateClass === 'winrate-medium' ? '#ffc107' : '#dc3545';
        
        // 순위별 특별 표시 (1-3등)
        const rank = index + 1;
        let rankDisplay = '';
        let rankClass = '';
        
        if (rank === 1) {
            rankDisplay = '🥇';
            rankClass = 'text-warning fw-bold'; // 금색
        } else if (rank === 2) {
            rankDisplay = '🥈';
            rankClass = 'text-secondary fw-bold'; // 은색
        } else if (rank === 3) {
            rankDisplay = '🥉';
            rankClass = 'text-warning fw-bold'; // 동색
        } else {
            rankDisplay = rank;
            rankClass = 'fw-bold';
        }
        
        const positions = ['top', 'jungle', 'mid', 'adc', 'support'];
        const positionCells = positions.map(pos => {
            const posData = player.positions[pos];
            if (posData.games === 0) {
                return '<td class="position-cell text-muted text-center">-</td>';
            }
            const winrate = ((posData.wins / posData.games) * 100).toFixed(0);
            const games = posData.games;
            const winrateNum = parseFloat(winrate);
            
            // 포지션별 승률 색상
            let winrateColor = '';
            if (winrateNum >= 60) {
                winrateColor = '#28a745'; // 초록색
            } else if (winrateNum >= 40) {
                winrateColor = '#ffc107'; // 노란색
            } else {
                winrateColor = '#dc3545'; // 빨간색
            }
            
            return `<td class="position-cell text-center"><span style="color: ${winrateColor}; font-weight: 600;">${winrate}%</span> <small class="text-muted">(${games})</small></td>`;
        }).join('');
        
        // 상위 3등 배경 클래스
        let rowClass = '';
        if (rank === 1) {
            rowClass = 'rank-1';
        } else if (rank === 2) {
            rowClass = 'rank-2';
        } else if (rank === 3) {
            rowClass = 'rank-3';
        }
        
        return `
            <tr class="${rowClass}">
                <td class="text-center ${rankClass}">${rankDisplay}</td>
                <td class="player-name text-center">${player.name}</td>
                <td class="tier-col text-center">${getTierBadgeHtml(player.tier)}</td>
                <td class="games-cell text-center">${player.total_games}</td>
                <td class="winrate-cell text-center" style="color: ${winrateColor}">
                    ${(player.overall_winrate * 100).toFixed(1)}%
                </td>
                ${positionCells}
                <td class="text-success fw-bold text-center">${player.total_wins}</td>
                <td class="text-danger fw-bold text-center">${player.total_losses}</td>
            </tr>
        `;
    }).join('');
    
    statsTableEl.innerHTML = `
        ${headerRow}
        <tbody>
            ${bodyRows}
        </tbody>
    `;

    // 정렬 헤더 클릭 이벤트
    statsTableEl.querySelectorAll('.sortable-header').forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            setStatsTableSort(column, gameData);
        });
    });
}

// 플레이어 목록 렌더링
export function renderPlayersList(gameData, selectedPlayers, handlePlayerClick) {
    const playersEl = document.getElementById('playersList');

    // 가나다 순으로 정렬
    const sortedPlayers = [...gameData.players].sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));

    // 컴팩트 모드 버튼 업데이트
    updateCompactModeButton();

    playersEl.innerHTML = sortedPlayers.map((player, index) => {
        const winrateClass = getWinrateClass(player.overall_winrate);
        const positions = getPlayerPositions(player);
        const chartId = `playerChart${index}`;
        const recentForm = getRecentFormHtml(player.name);
        const playerTags = getPlayerTagsHtml(player.name, 2);

        // 통합 카드 - 컴팩트/상세 모드 모두 포함
        return `
            <div class="col-xl-2 col-lg-3 col-md-4 col-sm-6 player-card-col ${isCompactMode ? 'compact-mode' : 'detailed-mode'}">
                <div class="card player-card ${isCompactMode ? 'player-card-compact' : ''}" id="player-card-${player.name}" onclick="handlePlayerClick('${player.name}')" oncontextmenu="event.preventDefault(); if(this.classList.contains('selected')) { handlePlayerClick('${player.name}'); }">
                    <div class="card-body p-2 d-flex flex-column">
                        <!-- 공통 헤더 -->
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <div class="d-flex align-items-center gap-1">
                                <span class="fw-bold card-title mb-0">${player.name}</span>
                                ${getTierBadgeHtml(player.tier)}
                            </div>
                            <span class="winrate-badge ${winrateClass}" style="font-size: 0.85rem;">
                                ${(player.overall_winrate * 100).toFixed(1)}%
                            </span>
                        </div>

                        <!-- 공통 폼/게임수 -->
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center gap-2">
                                ${recentForm}
                            </div>
                            <small class="text-muted">${player.total_games}게임</small>
                        </div>

                        <!-- 태그 -->
                        <div class="compact-tags">
                            ${playerTags}
                        </div>

                        <!-- 상세 정보 (확장 영역) -->
                        <div class="card-detail-content">
                            <div class="positions">
                                <small class="text-muted d-block mb-1">주요 포지션</small>
                                <div>
                                    ${positions}
                                </div>
                            </div>

                            <div class="mb-2">
                                <div class="row text-center">
                                    <div class="col">
                                        <small class="text-muted d-block">승</small>
                                        <strong class="text-success">${player.total_wins}</strong>
                                    </div>
                                    <div class="col">
                                        <small class="text-muted d-block">패</small>
                                        <strong class="text-danger">${player.total_losses}</strong>
                                    </div>
                                </div>
                            </div>

                            <!-- 개인 포지션별 승률 차트 -->
                            <div class="position-chart">
                                <small class="text-muted d-block mb-1">포지션별 승률</small>
                                <div style="height: 100px; position: relative;">
                                    <canvas id="${chartId}"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // 상세 모드일 때만 차트 렌더링
    if (!isCompactMode) {
        setTimeout(() => {
            sortedPlayers.forEach((player, index) => {
                renderPlayerPositionChart(player, `playerChart${index}`);
            });
        }, 100);
    }

    // 태그 용어집 렌더링
    const tagGlossaryContainer = document.getElementById('tagGlossaryContainer');
    if (tagGlossaryContainer) {
        tagGlossaryContainer.innerHTML = renderTagGlossary();
    }
}

// 플레이어의 주요 포지션 반환 (상위 3개)
function getPlayerPositions(player) {
    const positionInfo = {
        top: { name: 'TOP', class: 'pos-top', img: 'img/positions/Top.svg' },
        jungle: { name: 'JGL', class: 'pos-jungle', img: 'img/positions/Jug.svg' },
        mid: { name: 'MID', class: 'pos-mid', img: 'img/positions/Mid.svg' },
        adc: { name: 'ADC', class: 'pos-adc', img: 'img/positions/Bot.svg' },
        support: { name: 'SUP', class: 'pos-support', img: 'img/positions/Sup.svg' }
    };

    return Object.entries(player.positions)
        .filter(([pos, data]) => data.games > 0)
        .sort((a, b) => b[1].games - a[1].games)
        .slice(0, 3) // 상위 3개
        .map(([pos, data]) => {
            const info = positionInfo[pos];
            const winrate = data.games > 0 ? (data.wins / data.games * 100).toFixed(0) : 0;
            return `<span class="position-badge ${info.class}" title="${info.name}: ${data.games}게임 (${winrate}%)"><img src="${info.img}" alt="${info.name}"></span>`;
        }).join('');
}

// 개인별 포지션 승률 차트 렌더링
export function renderPlayerPositionChart(player, canvasId) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    // 기존 차트가 있다면 제거
    Chart.getChart(canvasId)?.destroy();

    const positions = ['top', 'jungle', 'mid', 'adc', 'support'];
    const positionNames = ['TOP', 'JGL', 'MID', 'ADC', 'SUP'];
    const colors = [
        'rgba(23, 162, 184, 0.8)',  // TOP - 청색
        'rgba(40, 167, 69, 0.8)',   // JGL - 녹색
        'rgba(255, 193, 7, 0.8)',   // MID - 노란색
        'rgba(220, 53, 69, 0.8)',   // ADC - 빨간색
        'rgba(111, 66, 193, 0.8)'   // SUP - 보라색
    ];

    // 게임 수가 있는 포지션만 필터링
    const playedPositionsData = positions.map((pos, index) => ({
        pos: pos,
        name: positionNames[index],
        color: colors[index],
        games: player.positions[pos].games,
        winrate: player.positions[pos].winrate
    })).filter(p => p.games > 0);

    if (playedPositionsData.length === 0) {
        ctx.canvas.parentElement.innerHTML = '<div class="text-center text-muted" style="line-height: 100px;">플레이 기록 없음</div>';
        return;
    }

    // 0% 승률 값을 시각적으로 표시하기 위한 데이터 전처리
    const originalWinrateData = playedPositionsData.map(p => (p.winrate * 100).toFixed(1));
    const processedWinrateData = originalWinrateData.map(value => {
        const numValue = parseFloat(value);
        return numValue;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: playedPositionsData.map(p => p.name),
            datasets: [{
                label: '승률 (%)',
                data: processedWinrateData, // 전처리된 데이터 사용
                backgroundColor: playedPositionsData.map((p, index) => {
                    // 0% 승률인 경우 다른 색상으로 표시
                    const originalValue = parseFloat(originalWinrateData[index]);
                    if (originalValue === 0) {
                        return 'rgba(255, 99, 132, 0.2)'; // 빨간색 계열로 표시
                    }
                    return p.color;
                }),
                borderColor: playedPositionsData.map(p => p.color.replace('0.8', '1')),
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'nearest',
              axis: 'y',
              intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const posData = playedPositionsData[index];
                            const games = posData.games;
                            const wins = Math.round(games * posData.winrate);
                            const losses = games - wins;
                            
                            // 툴팁에는 원래 값 표시
                            const originalValue = originalWinrateData[index];
                            return `승률: ${originalValue}% (${wins}승 ${losses}패)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            size: 10
                        },
                        color: '#e4e4e7'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: 10
                        },
                        color: '#e4e4e7'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            // 호버 이벤트 추가
            onHover: function(event, elements) {
                const chart = this;
                const canvas = chart.ctx.canvas;
                const rect = canvas.getBoundingClientRect();
                
                // 마우스 위치 계산
                const x = event.x;
                const y = event.y;
                
                // Y축 레이블 영역 확인 (왼쪽 30px 이내)
                if (x <= 30) {
                    // Y축 인덱스 계산
                    const yAxis = chart.scales.y;
                    const step = yAxis.height / playedPositionsData.length;
                    const index = Math.floor((yAxis.top + yAxis.height - y) / step);
                    
                    if (index >= 0 && index < playedPositionsData.length) {
                        const posData = playedPositionsData[index];
                        const games = posData.games;
                        const wins = Math.round(games * posData.winrate);
                        const losses = games - wins;
                        
                        // 툴팁 표시
                        const tooltip = chart.tooltip;
                        tooltip.setActiveElements([{
                            datasetIndex: 0,
                            index: index
                        }], {
                            x: 50,
                            y: yAxis.top + (index * step) + (step / 2)
                        });
                        tooltip.update(true);
                    }
                } else {
                    // 차트 영역을 벗어나면 툴팁 숨기기
                    const tooltip = chart.tooltip;
                    tooltip.setActiveElements([], { x: 0, y: 0 });
                    tooltip.update(true);
                }
            }
        }
    });
}

// 차트 렌더링
export function renderCharts(gameData) {
    // 기존 차트가 있다면 제거
    Chart.getChart('winrateChart')?.destroy();
    
    renderWinrateChart(gameData);
}

// 승률 차트
function renderWinrateChart(gameData) {
    const ctx = document.getElementById('winrateChart').getContext('2d');
    
    const sortedPlayers = [...gameData.players]
        .filter(player => player.total_wins + player.total_losses >= 10)
        .sort((a, b) => b.overall_winrate - a.overall_winrate);

    const originalWinrateData = sortedPlayers.map(p => (p.overall_winrate * 100).toFixed(1));
    const processedWinrateData = originalWinrateData.map(value => {
        const numValue = parseFloat(value);
        return numValue;
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedPlayers.map(p => p.name),
            datasets: [{
                label: '승률 (%)',
                data: processedWinrateData, // 전처리된 데이터 사용
                backgroundColor: sortedPlayers.map((p, index) => {
                    // 0% 승률인 경우 다른 색상으로 표시
                    const originalValue = parseFloat(originalWinrateData[index]);
                    if (originalValue === 0) {
                        return 'rgba(255, 99, 132, 0.2)'; // 빨간색 계열로 표시
                    }
                    if (p.overall_winrate >= 0.6) return 'rgba(40, 167, 69, 0.8)';
                    if (p.overall_winrate >= 0.4) return 'rgba(255, 193, 7, 0.8)';
                    return 'rgba(220, 53, 69, 0.8)';
                }),
                borderColor: sortedPlayers.map(p => {
                    if (p.overall_winrate >= 0.6) return 'rgba(40, 167, 69, 1)';
                    if (p.overall_winrate >= 0.4) return 'rgba(255, 193, 7, 1)';
                    return 'rgba(220, 53, 69, 1)';
                }),
                borderWidth: 1,
                barThickness: 12
            }]
        },
        options: {
            indexAxis: 'y', // 수평 막대 차트로 변경
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    position: 'top',
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            },
            interaction: {
              mode: 'nearest',
              axis: 'y',
              intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            // 툴팁에는 원래 값 표시
                            const originalValue = originalWinrateData[context.dataIndex];
                            return `승률: ${originalValue}%`;
                        }
                    }
                }
            }
        }
    });
}

// 마지막 업데이트 시간 표시
export function updateLastUpdated(gameData) {
    const lastUpdatedEl = document.getElementById('lastUpdated');
    const updateTime = new Date(gameData.last_updated);
    const formatted = updateTime.toLocaleString('ko-KR');
    const source = gameData.source === 'google_sheets' ? 'Google Sheets' : 'Unknown';
    
    lastUpdatedEl.innerHTML = `
        <i class="fas fa-sync me-1"></i>
        데이터 로드 완료: ${formatted}
        <small class="ms-2 text-muted">(${source}에서 불러옴)</small>
    `;
}

// 이벤트 리스너 설정
export function setupEventListeners() {
    console.log("setupEventListeners called.");
    
    // 팀 빌더 설정
    setupTeamBuilder();
    
    // 새로운 팀1 승리 버튼 (팀짜기에서)
    const team1WinBtnNew = document.getElementById('team1WinBtnNew');
    if (team1WinBtnNew) {
        team1WinBtnNew.addEventListener('click', function() {
            const selectedTeams = getSelectedTeams();
            const team1Players = selectedTeams.team1;
            const team2Players = selectedTeams.team2;

            if (team1Players.length === 5 && team2Players.length === 5) {
                const gameResult = handleTeamWinGame(1, team1Players.join('\n'), team2Players.join('\n'));

                if (gameResult) {
                    // MVP 모달 열기
                    openMvpModal(gameResult.winners, gameResult, 1);
                }
            } else {
                ToastManager.warning('각 팀의 5명 플레이어를 모두 선택해주세요.');
            }
        });
    }

    // 새로운 팀2 승리 버튼 (팀짜기에서)
    const team2WinBtnNew = document.getElementById('team2WinBtnNew');
    if (team2WinBtnNew) {
        team2WinBtnNew.addEventListener('click', function() {
            const selectedTeams = getSelectedTeams();
            const team1Players = selectedTeams.team1;
            const team2Players = selectedTeams.team2;

            if (team1Players.length === 5 && team2Players.length === 5) {
                const gameResult = handleTeamWinGame(2, team1Players.join('\n'), team2Players.join('\n'));

                if (gameResult) {
                    // MVP 모달 열기
                    openMvpModal(gameResult.winners, gameResult, 2);
                }
            } else {
                ToastManager.warning('각 팀의 5명 플레이어를 모두 선택해주세요.');
            }
        });
    }

    // MVP 확정 버튼
    const confirmMvpBtn = document.getElementById('confirmMvpBtn');
    if (confirmMvpBtn) {
        confirmMvpBtn.addEventListener('click', confirmWinAndSave);
    }

    // 이미지 캡처 버튼
    const captureTeamBtn = document.getElementById('captureTeamBtn');
    if (captureTeamBtn) {
        captureTeamBtn.addEventListener('click', captureTeamRoster);
    }


    // 선택 초기화 버튼
    const clearBtn = document.getElementById('clearSelectionBtn');
    if (clearBtn) {
        console.log("clearSelectionBtn found.");
        clearBtn.addEventListener('click', function() {
            console.log("Clear selection button clicked.");
            clearPlayerSelection();
        });
    } else {
        console.log("clearSelectionBtn not found!");
    }

    // ESC 키로 플레이어 선택 초기화
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const selectedPlayers = getSelectedPlayers();
            if (selectedPlayers.length > 0) {
                clearPlayerSelection();
            }
        }
    });
}

// MVP/ACE 모달 열기
function openMvpModal(winners, gameResult, winningTeam) {
    selectedMvp = null;
    selectedAce = null;
    pendingGameResult = gameResult;
    pendingWinningTeam = winningTeam;

    const mvpPlayerList = document.getElementById('mvpPlayerList');
    const acePlayerList = document.getElementById('acePlayerList');
    const confirmMvpBtn = document.getElementById('confirmMvpBtn');

    // MVP 선택 버튼 생성 (승리팀)
    mvpPlayerList.innerHTML = winners.map(player => `
        <button type="button" class="mvp-player-btn" data-player="${player}">
            <i class="fas fa-crown me-1"></i>${player}
        </button>
    `).join('');

    // ACE 선택 버튼 생성 (패배팀)
    acePlayerList.innerHTML = gameResult.losers.map(player => `
        <button type="button" class="ace-player-btn" data-player="${player}">
            <i class="fas fa-medal me-1"></i>${player}
        </button>
    `).join('');

    // 확정 버튼 활성화 체크 함수
    const checkConfirmButton = () => {
        confirmMvpBtn.disabled = !(selectedMvp && selectedAce);
    };

    // MVP 선택 이벤트
    mvpPlayerList.querySelectorAll('.mvp-player-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            mvpPlayerList.querySelectorAll('.mvp-player-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedMvp = this.dataset.player;
            checkConfirmButton();
        });
    });

    // ACE 선택 이벤트
    acePlayerList.querySelectorAll('.ace-player-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            acePlayerList.querySelectorAll('.ace-player-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedAce = this.dataset.player;
            checkConfirmButton();
        });
    });

    // 확정 버튼 비활성화
    confirmMvpBtn.disabled = true;

    // 모달 열기
    const mvpModal = new bootstrap.Modal(document.getElementById('mvpModal'));
    mvpModal.show();
}

// MVP/ACE 선택 후 저장
async function confirmWinAndSave() {
    if (!selectedMvp || !selectedAce || !pendingGameResult) {
        ToastManager.warning('MVP와 ACE를 모두 선택해주세요.');
        return;
    }

    // 모달 닫기 (로딩 오버레이 표시 전에)
    const mvpModal = bootstrap.Modal.getInstance(document.getElementById('mvpModal'));
    mvpModal.hide();

    // 로딩 오버레이 표시
    SpinnerManager.show('경기 결과를 저장하는 중...');

    try {
        // Google Sheets에 기록 (MVP/ACE 포함)
        await addToGoogleSheetsRecord(
            pendingGameResult.winners,
            pendingGameResult.losers,
            selectedMvp,
            selectedAce
        );

        // localStorage에 매치 데이터 저장 (MVP/ACE 포함)
        const matchData = {
            date: new Date().toISOString(),
            winners: pendingGameResult.winners,
            losers: pendingGameResult.losers,
            mvp: selectedMvp,
            ace: selectedAce,
            winningTeam: pendingWinningTeam
        };

        saveMatchToLocalStorage(matchData);

        // 로딩 오버레이 숨기기
        SpinnerManager.hide();

        // 승리 confetti 애니메이션
        triggerVictoryConfetti();

        ToastManager.success(`팀 ${pendingWinningTeam} 승리! MVP: ${selectedMvp}, ACE: ${selectedAce}`);
        resetToWaitingAreaWithTeams();

        // 데이터 새로고침 (renderMatchHistory는 refreshData 내에서 호출됨)
        window.refreshData();

    } catch (error) {
        console.error('저장 실패:', error);
        SpinnerManager.hide();
        ToastManager.error('기록 저장에 실패했습니다: ' + error.message);
    }
}

// localStorage에 매치 데이터 저장
function saveMatchToLocalStorage(matchData) {
    try {
        const matches = JSON.parse(localStorage.getItem('matchHistory') || '[]');
        matches.unshift(matchData); // 최신 기록을 앞에 추가

        // 최대 100개까지만 저장
        if (matches.length > 100) {
            matches.pop();
        }

        localStorage.setItem('matchHistory', JSON.stringify(matches));
        console.log('매치 데이터 저장 완료:', matchData);
    } catch (error) {
        console.error('localStorage 저장 오류:', error);
    }
}

// 매치 히스토리 렌더링 (서버 데이터 사용) - 그룹핑 기반 카드 UI
export function renderMatchHistory(gameRecords = []) {
    const matchHistoryList = document.getElementById('matchHistoryList');
    if (!matchHistoryList) return;

    // 서버 데이터에서 최근 15경기만 표시 (역순으로 최신순)
    const recentMatches = gameRecords.slice(-15).reverse();

    if (recentMatches.length === 0) {
        matchHistoryList.innerHTML = `
            <div class="text-center text-muted p-4">
                <i class="fas fa-info-circle me-2"></i>아직 기록된 경기가 없습니다.
            </div>
        `;
        return;
    }

    // 멤버 구성으로 그룹핑 (최근 3개 그룹만)
    const allGroups = groupMatchesByMembers(recentMatches);
    const groups = allGroups.slice(0, 3);

    // 그룹별 렌더링
    matchHistoryList.innerHTML = groups.map((group, groupIndex) => {
        const matchesHtml = group.matches.map((match, matchIndex) => {
            // 서버 데이터에서 MVP/ACE 가져오기
            const mvpName = match.mvp || '';
            const aceName = match.ace || '';

            // 팀 이름 포맷팅 (첫글자 대문자)
            const formatName = (name) => name.charAt(0).toUpperCase() + name.slice(1);

            // 구분자를 가운뎃점으로 변경
            const winnersStr = match.winners.map(formatName).join(' · ');
            const losersStr = match.losers.map(formatName).join(' · ');

            // 날짜 포맷팅 (월/일만)
            let dateStr = '-';
            if (match.date) {
                let parsedDate = new Date(match.date);
                if (isNaN(parsedDate.getTime())) {
                    const dateMatch = match.date.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
                    if (dateMatch) {
                        parsedDate = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
                    }
                }
                if (!isNaN(parsedDate.getTime())) {
                    const month = parsedDate.getMonth() + 1;
                    const day = parsedDate.getDate();
                    dateStr = `${month}/${day}`;
                } else {
                    dateStr = match.date.length > 10 ? match.date.substring(5, 10) : match.date;
                }
            }

            return `
                <div class="match-row" data-match-index="${matchIndex}">
                    <div class="match-round">
                        <span class="match-date">${dateStr}</span>
                    </div>
                    <div class="match-team win-team left-team">
                        <span class="team-badge win">W</span>
                        <span class="team-players">${highlightPlayer(winnersStr, mvpName, 'mvp')}</span>
                    </div>
                    <div class="match-vs">VS</div>
                    <div class="match-team lose-team right-team">
                        <span class="team-players">${highlightPlayer(losersStr, aceName, 'ace')}</span>
                        <span class="team-badge lose">L</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="match-group" data-group-index="${groupIndex}">
                <div class="group-timeline"></div>
                ${matchesHtml}
            </div>
        `;
    }).join('');
}

// 멤버 구성으로 매치 그룹핑
function groupMatchesByMembers(matches) {
    if (matches.length === 0) return [];

    const groups = [];
    let currentGroup = null;

    matches.forEach((match, index) => {
        // 멤버 시그니처 생성 (팀 순서 무관하게 동일한 키 생성)
        const signature = createMemberSignature(match.winners, match.losers);

        if (!currentGroup || currentGroup.signature !== signature) {
            // 새 그룹 시작
            currentGroup = {
                signature: signature,
                matches: [match]
            };
            groups.push(currentGroup);
        } else {
            // 기존 그룹에 추가
            currentGroup.matches.push(match);
        }
    });

    return groups;
}

// 멤버 시그니처 생성 (팀 순서 무관)
function createMemberSignature(team1, team2) {
    // 각 팀을 정렬하여 배열로 만들기
    const sorted1 = [...team1].map(n => n.toLowerCase()).sort();
    const sorted2 = [...team2].map(n => n.toLowerCase()).sort();

    // 두 팀을 합쳐서 전체 정렬 (팀 순서 무관하게 동일한 시그니처)
    const allMembers = [...sorted1, ...sorted2].sort();

    return allMembers.join('|');
}

// 플레이어 이름에서 MVP/ACE 하이라이트
function highlightPlayer(playersStr, highlightName, type) {
    if (!highlightName || highlightName === '-') return playersStr;

    const color = type === 'mvp' ? '#9333EA' : '#10B981';
    const icon = type === 'mvp' ? 'fa-crown' : 'fa-medal';

    return playersStr.replace(
        new RegExp(`(${highlightName})`, 'gi'),
        `<span style="color: ${color};" class="fw-bold"><i class="fas ${icon} me-1"></i>$1</span>`
    );
}

// 팀 편성 이미지 캡처
async function captureTeamRoster() {
    const generatedTeams = document.getElementById('generatedTeams');
    if (!generatedTeams) return;

    try {
        // 캡처 버튼 숨기기
        const captureBtn = document.getElementById('captureTeamBtn');
        if (captureBtn) captureBtn.style.visibility = 'hidden';

        const canvas = await html2canvas(generatedTeams, {
            backgroundColor: '#f8f9fc',
            scale: 2,
            useCORS: true
        });

        // 캡처 버튼 다시 표시
        if (captureBtn) captureBtn.style.visibility = 'visible';

        // 클립보드에 복사
        canvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    showCopyStatus('복사 완료!', 'success');
                } catch (clipboardError) {
                    console.warn('클립보드 복사 실패:', clipboardError);
                    showCopyStatus('복사 실패', 'error');
                }
            }
        });

    } catch (error) {
        console.error('이미지 캡처 실패:', error);
        showCopyStatus('캡처 실패', 'error');
    }
}

// 복사 상태 표시
function showCopyStatus(message, type) {
    // 기존 상태 메시지 제거
    const existingStatus = document.getElementById('copyStatus');
    if (existingStatus) existingStatus.remove();

    // 새 상태 메시지 생성
    const statusEl = document.createElement('div');
    statusEl.id = 'copyStatus';
    statusEl.style.cssText = `
        padding: 6px 12px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.8rem;
        white-space: nowrap;
        ${type === 'success'
            ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;'
            : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
    `;
    statusEl.textContent = message;

    // team-roster-container에 추가
    const container = document.querySelector('.team-roster-container');
    if (container) {
        container.appendChild(statusEl);
    }

    // 3초 후 자동 제거
    setTimeout(() => {
        if (statusEl.parentNode) statusEl.remove();
    }, 3000);
}

// 캡처 버튼 표시/숨기기
export function showCaptureButton(show) {
    const captureBtn = document.getElementById('captureTeamBtn');
    if (captureBtn) {
        captureBtn.style.display = show ? 'block' : 'none';
    }
}
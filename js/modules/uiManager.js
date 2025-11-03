import { getWinrateClass, getPositionName } from './utils.js';
import { handleTeamWin as handleTeamWinGame, addToGoogleSheetsRecord } from './gameManager.js';
import { clearPlayerSelection } from './playerManager.js';
import { setupTeamBuilder, clearTeamSelection, getSelectedTeams, resetToWaitingAreaWithTeams } from './teamBuilder.js';

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
    
    return `<span class="tier-color-badge" style="background-color: ${tierInfo.bgColor}; color: ${tierInfo.textColor};" title="${tier}">${tierInfo.char}</span>`;
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

// 통계표 렌더링 (스프레드시트 스타일)
export function renderStatsTable(gameData) {
    const statsTableEl = document.getElementById('statsTable');
    
    // 5판 이상 플레이한 플레이어만 필터링하고 승률 기준으로 정렬
    const sortedPlayers = [...gameData.players]
        .filter(player => player.total_wins + player.total_losses >= 5)
        .sort((a, b) => b.overall_winrate - a.overall_winrate);
    
    const headerRow = `
        <thead>
            <tr>
                <th style="min-width: 40px;" class="text-center">순위</th>
                <th style="min-width: 100px;">이름</th>
                <th style="min-width: 50px;" class="text-center">티어</th>
                <th style="min-width: 60px;" class="text-center">게임수</th>
                <th style="min-width: 70px;" class="text-center">승률</th>
                <th style="min-width: 70px;" class="text-center">TOP</th>
                <th style="min-width: 70px;" class="text-center">JGL</th>
                <th style="min-width: 70px;" class="text-center">MID</th>
                <th style="min-width: 70px;" class="text-center">ADC</th>
                <th style="min-width: 70px;" class="text-center">SUP</th>
                <th style="min-width: 50px;" class="text-center">승</th>
                <th style="min-width: 50px;" class="text-center">패</th>
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
                <td class="player-name">${player.name}</td>
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
}

// 플레이어 목록 렌더링
export function renderPlayersList(gameData, selectedPlayers, handlePlayerClick) {
    const playersEl = document.getElementById('playersList');
    
    // 가나다 순으로 정렬
    const sortedPlayers = [...gameData.players].sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
    
    playersEl.innerHTML = sortedPlayers.map((player, index) => {
        const winrateClass = getWinrateClass(player.overall_winrate);
        const positions = getPlayerPositions(player);
        const chartId = `playerChart${index}`;
        
        return `
            <div class="col-xl-2 col-lg-3 col-md-4 col-sm-6 mb-3" onclick="handlePlayerClick('${player.name}')">
                <div class="card player-card h-100" id="player-card-${player.name}">
                    <div class="card-body p-2 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h6 class="card-title mb-0 fw-bold">
                                    ${player.name}
                                    <span class="ms-1">${getTierBadgeHtml(player.tier)}</span>
                                </h6>
                                <small class="text-muted">${player.total_games}게임</small>
                            </div>
                            <span class="winrate-badge ${winrateClass} fs-6">
                                ${(player.overall_winrate * 100).toFixed(1)}%
                            </span>
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
                        
                        <div class="positions mb-2 flex-grow-1">
                            <small class="text-muted d-block mb-1">주요 포지션</small>
                            <div>
                                ${positions}
                            </div>
                        </div>
                        
                        <!-- 개인 포지션별 승률 차트 -->
                        <div class="position-chart mt-auto">
                            <small class="text-muted d-block mb-1">포지션별 승률</small>
                            <div style="height: 100px; position: relative;">
                                <canvas id="${chartId}"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // 각 플레이어의 차트 렌더링
    setTimeout(() => {
        sortedPlayers.forEach((player, index) => {
            renderPlayerPositionChart(player, `playerChart${index}`);
        });
    }, 100);
}

// 플레이어의 주요 포지션 반환
function getPlayerPositions(player) {
    const positionNames = {
        top: { name: 'TOP', class: 'pos-top' },
        jungle: { name: 'JGL', class: 'pos-jungle' },
        mid: { name: 'MID', class: 'pos-mid' },
        adc: { name: 'ADC', class: 'pos-adc' },
        support: { name: 'SUP', class: 'pos-support' }
    };
    
    return Object.entries(player.positions)
        .filter(([pos, data]) => data.games > 0)
        .sort((a, b) => b[1].games - a[1].games)
        .map(([pos, data]) => {
            const posInfo = positionNames[pos];
            const winrate = data.games > 0 ? (data.wins / data.games * 100).toFixed(0) : 0;
            return `<span class="position-badge ${posInfo.class}" title="${posInfo.name}: ${data.games}게임 (${winrate}%)">${posInfo.name}</span>`;
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
                        }
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: 10
                        }
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
        .filter(player => player.total_wins + player.total_losses >= 5)
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
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            interaction: {
              mode: 'nearest',
              axis: 'x',
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
                    addToGoogleSheetsRecord(gameResult.winners, gameResult.losers)
                        .then(() => {
                            alert(`팀 1 승리가 기록되었습니다!`);
                            window.refreshData();
                            resetToWaitingAreaWithTeams(); // 팀 구성 유지하며 대기석으로 복원
                        })
                        .catch((error) => {
                            console.error('Google Sheets 기록 실패:', error);
                            alert('Google Sheets 기록에 실패했습니다.');
                        });
                }
            } else {
                alert('각 팀의 5명 플레이어를 모두 선택해주세요.');
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
                    addToGoogleSheetsRecord(gameResult.winners, gameResult.losers)
                        .then(() => {
                            alert(`팀 2 승리가 기록되었습니다!`);
                            window.refreshData();
                            resetToWaitingAreaWithTeams(); // 팀 구성 유지하며 대기석으로 복원
                        })
                        .catch((error) => {
                            console.error('Google Sheets 기록 실패:', error);
                            alert('Google Sheets 기록에 실패했습니다.');
                        });
                }
            } else {
                alert('각 팀의 5명 플레이어를 모두 선택해주세요.');
            }
        });
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
}
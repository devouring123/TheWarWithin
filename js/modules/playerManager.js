import { getPositionName, getPositionIndex } from './utils.js';
import { getTierBadgeHtml } from './uiManager.js';

let selectedPlayers = []; // 선택된 플레이어를 저장할 배열
let gameRecords = []; // 게임 기록 데이터를 저장할 배열
let gameData = null; // 게임 데이터

export function setGameRecords(records) {
    gameRecords = records;
}

export function setGameData(data) {
    gameData = data;
}

export function getSelectedPlayers() {
    return selectedPlayers;
}

export function handlePlayerClick(playerName) {
    console.log("handlePlayerClick called with:", playerName);
    const card = document.getElementById(`player-card-${playerName}`);
    const playerIndex = selectedPlayers.indexOf(playerName);
    const playerDetailsDisplayArea = document.getElementById('playerDetailsDisplayArea');
    const playerDetailsContent = document.getElementById('playerDetailsContent');

    if (playerIndex > -1) {
        // 이미 선택된 플레이어 -> 선택 해제
        console.log("Player already selected, removing from selection");
        selectedPlayers.splice(playerIndex, 1);
        card.classList.remove('selected', 'selected-first', 'selected-second');

        // 남은 플레이어 재정렬 (두번째가 첫번째로)
        updateSelectedPlayerStyles();
    } else {
        // 새 플레이어 선택
        console.log("Adding player to selection");
        if (selectedPlayers.length < 2) {
            selectedPlayers.push(playerName);

            // 선택 순서에 따라 클래스 적용
            if (selectedPlayers.length === 1) {
                card.classList.add('selected', 'selected-first');
            } else {
                card.classList.add('selected', 'selected-second');
            }
        } else {
            alert('최대 2명의 플레이어만 선택할 수 있습니다.');
            return; // 3명 이상 선택 시 함수 종료
        }
    }

    // 선택된 플레이어 스타일 업데이트 함수
    function updateSelectedPlayerStyles() {
        // 모든 선택 클래스 제거 후 재적용
        selectedPlayers.forEach((name, idx) => {
            const playerCard = document.getElementById(`player-card-${name}`);
            if (playerCard) {
                playerCard.classList.remove('selected-first', 'selected-second');
                if (idx === 0) {
                    playerCard.classList.add('selected-first');
                } else if (idx === 1) {
                    playerCard.classList.add('selected-second');
                }
            }
        });
    }

    console.log("Selected players:", selectedPlayers);
    // 선택된 플레이어 수에 따라 표시 영역 업데이트
    if (selectedPlayers.length === 0) {
        console.log("No players selected, hiding details");
        playerDetailsDisplayArea.style.display = 'none';
        playerDetailsContent.innerHTML = '';
    } else if (selectedPlayers.length === 1) {
        console.log("One player selected, showing all player comparison");
        playerDetailsDisplayArea.style.display = 'block';
        playerDetailsContent.innerHTML = renderAllPlayerComparison(selectedPlayers[0]);
    } else if (selectedPlayers.length === 2) {
        console.log("Two players selected, showing comparison");
        playerDetailsDisplayArea.style.display = 'block';
        playerDetailsContent.innerHTML = renderComparePlayerDetails(selectedPlayers[0], selectedPlayers[1]);
    }
}

export function clearPlayerSelection() {
    console.log("clearPlayerSelection called.");
    selectedPlayers.forEach(playerName => {
        const card = document.getElementById(`player-card-${playerName}`);
        if (card) {
            card.classList.remove('selected');
        }
    });
    selectedPlayers = [];
    document.getElementById('playerDetailsDisplayArea').style.display = 'none';
    document.getElementById('playerDetailsContent').innerHTML = '';
}

// 상대 전적 차트 렌더링
export function renderRivalChart(topRivals, bottomRivals) {
    console.log("renderRivalChart called with:", topRivals, bottomRivals);
    const rivalCtx = document.getElementById('rivalChart')?.getContext('2d');
    if (rivalCtx) {
        console.log("Found rivalChart canvas context");
        // 기존 차트가 있다면 제거
        Chart.getChart('rivalChart')?.destroy();
        
        const rivalData = [
            ...topRivals,
            ...bottomRivals
        ];
        
        console.log("Rival data for chart:", rivalData);
        
        new Chart(rivalCtx, {
            type: 'bar',
            data: {
                labels: rivalData.map(p => p.playerName),
                datasets: [{
                    label: '승률 (%)',
                    data: rivalData.map(p => p.winrate),
                    backgroundColor: [
                        ...topRivals.map(() => 'rgba(40, 167, 69, 0.8)'),
                        ...bottomRivals.map(() => 'rgba(220, 53, 69, 0.8)')
                    ],
                    borderColor: [
                        ...topRivals.map(() => 'rgba(40, 167, 69, 1)'),
                        ...bottomRivals.map(() => 'rgba(220, 53, 69, 1)')
                    ],
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
                                const player = rivalData[index];
                                return '승률: ' + player.winrate.toFixed(1) + '% (' + player.wins + '승 ' + player.losses + '패)';
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
                            }
                        }
                    }
                }
            }
        });
        console.log("Rival chart rendered successfully");
    } else {
        console.log("Could not find rivalChart canvas context");
    }
}

// 팀 전적 차트 렌더링
export function renderTeammateChart(topTeammates, bottomTeammates) {
    console.log("renderTeammateChart called with:", topTeammates, bottomTeammates);
    const teammateCtx = document.getElementById('teammateChart')?.getContext('2d');
    if (teammateCtx) {
        console.log("Found teammateChart canvas context");
        // 기존 차트가 있다면 제거
        Chart.getChart('teammateChart')?.destroy();
        
        const teammateData = [
            ...topTeammates,
            ...bottomTeammates
        ];
        
        console.log("Teammate data for chart:", teammateData);
        
        new Chart(teammateCtx, {
            type: 'bar',
            data: {
                labels: teammateData.map(p => p.playerName),
                datasets: [{
                    label: '승률 (%)',
                    data: teammateData.map(p => p.winrate),
                    backgroundColor: [
                        ...topTeammates.map(() => 'rgba(40, 167, 69, 0.8)'),
                        ...bottomTeammates.map(() => 'rgba(220, 53, 69, 0.8)')
                    ],
                    borderColor: [
                        ...topTeammates.map(() => 'rgba(40, 167, 69, 1)'),
                        ...bottomTeammates.map(() => 'rgba(220, 53, 69, 1)')
                    ],
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
                                const player = teammateData[index];
                                return '승률: ' + player.winrate.toFixed(1) + '% (' + player.wins + '승 ' + player.losses + '패)';
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
                            }
                        }
                    }
                }
            }
        });
        console.log("Teammate chart rendered successfully");
    } else {
        console.log("Could not find teammateChart canvas context");
    }
}

function renderAllPlayerComparison(selectedPlayerName) {
    console.log("renderAllPlayerComparison called with:", selectedPlayerName);
    const selectedPlayer = gameData.players.find(p => p.name === selectedPlayerName);
    if (!selectedPlayer) {
        console.log("Selected player not found");
        return '<p>선택된 플레이어 정보를 찾을 수 없습니다.</p>';
    }

    console.log("Selected player data:", selectedPlayer);

    // 자기 자신의 기본 통계는 항상 표시하지만, 5판 미만인 경우 상대전적/시너지는 표시 안함
    const totalGamesPlayed = selectedPlayer.total_wins + selectedPlayer.total_losses;
    const showDetailedStats = totalGamesPlayed >= 5;

    // 플레이어의 최근 5경기 가져오기
    const recentGames = getPlayerRecentGames(selectedPlayerName, 5);

    // MVP/ACE 카운트 계산
    const mvpAceCounts = getPlayerMvpAceCounts(selectedPlayerName);

    // 모든 다른 플레이어와의 전적 계산
    const playerComparisons = [];
    const teammateComparisons = [];

    gameData.players.forEach(player => {
        if (player.name === selectedPlayerName) return; // 자기 자신은 제외

        // 상대 전적 계산 (적대적 만남)
        let wins = 0;
        let losses = 0;
        let totalGames = 0;

        if (gameRecords && Array.isArray(gameRecords)) {
            gameRecords.forEach(record => {
                if (!record || !record.winners || !record.losers) return;
                
                const selectedInWinners = record.winners.includes(selectedPlayerName.toLowerCase());
                const selectedInLosers = record.losers.includes(selectedPlayerName.toLowerCase());
                const playerInWinners = record.winners.includes(player.name.toLowerCase());
                const playerInLosers = record.losers.includes(player.name.toLowerCase());

                // 서로 다른 팀에 있었을 때 (적대적 만남)
                if ((selectedInWinners && playerInLosers) || (selectedInLosers && playerInWinners)) {
                    totalGames++;
                    if (selectedInWinners) {
                        wins++;
                    } else {
                        losses++;
                    }
                }
            });
        }

        // 선택된 플레이어가 5판 이상이고, 3판 이상 같은 게임을 한 경우만 고려
        if (showDetailedStats && totalGames >= 3) {
            const winrate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
            playerComparisons.push({
                playerName: player.name,
                wins,
                losses,
                totalGames,
                winrate
            });
        }

        // 팀 전적 계산 (협력적 만남)
        let teamedWins = 0;
        let teamedGames = 0;

        if (gameRecords && Array.isArray(gameRecords)) {
            gameRecords.forEach(record => {
                if (!record || !record.winners || !record.losers) return;
                
                const selectedInWinners = record.winners.includes(selectedPlayerName.toLowerCase());
                const selectedInLosers = record.losers.includes(selectedPlayerName.toLowerCase());
                const playerInWinners = record.winners.includes(player.name.toLowerCase());
                const playerInLosers = record.losers.includes(player.name.toLowerCase());

                // 같은 팀에 있었을 때 (협력적 만남)
                if ((selectedInWinners && playerInWinners) || (selectedInLosers && playerInLosers)) {
                    teamedGames++;
                    if (selectedInWinners && playerInWinners) {
                        teamedWins++;
                    }
                }
            });
        }

        // 선택된 플레이어가 5판 이상이고, 3판 이상 같은 게임을 한 경우만 고려
        if (showDetailedStats && teamedGames >= 3) {
            const winrate = teamedGames > 0 ? (teamedWins / teamedGames) * 100 : 0;
            teammateComparisons.push({
                playerName: player.name,
                wins: teamedWins,
                losses: teamedGames - teamedWins,
                totalGames: teamedGames,
                winrate
            });
        }
    });

    console.log("Player comparisons:", playerComparisons);
    console.log("Teammate comparisons:", teammateComparisons);

    // 상위/하위 3명씩 정렬
    // 정렬 기준: 승률이 같으면 게임 수가 많은 순서대로
    playerComparisons.sort((a, b) => {
        if (b.winrate === a.winrate) {
            return b.totalGames - a.totalGames; // 승률이 같으면 게임 수가 많은 순
        }
        return b.winrate - a.winrate; // 기본적으로는 승률이 높은 순
    });
    
    teammateComparisons.sort((a, b) => {
        if (b.winrate === a.winrate) {
            return b.totalGames - a.totalGames; // 승률이 같으면 게임 수가 많은 순
        }
        return b.winrate - a.winrate; // 기본적으로는 승률이 높은 순
    });

    const topRivals = playerComparisons.slice(0, 3);
    const bottomRivals = playerComparisons.length > 3 ? playerComparisons.slice(-3).reverse() : [];
    const topTeammates = teammateComparisons.slice(0, 3);
    const bottomTeammates = teammateComparisons.length > 3 ? teammateComparisons.slice(-3).reverse() : [];

    console.log("Top rivals:", topRivals);
    console.log("Bottom rivals:", bottomRivals);
    console.log("Top teammates:", topTeammates);
    console.log("Bottom teammates:", bottomTeammates);

    // HTML 생성
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="mb-0">${selectedPlayer.name} ${getTierBadgeHtml(selectedPlayer.tier)} - 전적 분석</h4>
            <span>
                전체 전적: ${selectedPlayer.total_wins}승 ${selectedPlayer.total_losses}패 (${(selectedPlayer.overall_winrate * 100).toFixed(1)}%)
                <span class="ms-3">
                    <span style="color: #9333EA;"><i class="fas fa-crown me-1"></i>MVP ${mvpAceCounts.mvpCount}회</span>
                    <span class="ms-2" style="color: #10B981;"><i class="fas fa-medal me-1"></i>ACE ${mvpAceCounts.aceCount}회</span>
                </span>
            </span>
        </div>
    `;

    // 최근 5경기 표시
    if (recentGames.length > 0) {
        // 최근 5경기에서 MVP/ACE 카운트
        const recentMvpCount = recentGames.filter(g => g.mvp && g.mvp.toLowerCase() === selectedPlayerName.toLowerCase()).length;
        const recentAceCount = recentGames.filter(g => g.ace && g.ace.toLowerCase() === selectedPlayerName.toLowerCase()).length;

        html += `
            <div class="recent-matches-section mb-4">
                <h5>
                    <i class="fas fa-history me-2"></i>최근 ${recentGames.length}경기
                    <span class="ms-2" style="font-size: 0.85rem;">
                        <span style="color: #9333EA;"><i class="fas fa-crown me-1"></i>${recentMvpCount}</span>
                        <span class="ms-1" style="color: #10B981;"><i class="fas fa-medal me-1"></i>${recentAceCount}</span>
                    </span>
                </h5>
                <div class="match-group" style="margin-bottom: 0;">
                    ${recentGames.map((game, index) => {
                        // 날짜 포맷팅 (월/일만)
                        let dateStr = '-';
                        if (game.date) {
                            let parsedDate = new Date(game.date);
                            if (isNaN(parsedDate.getTime())) {
                                const dateMatch = game.date.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
                                if (dateMatch) {
                                    parsedDate = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
                                }
                            }
                            if (!isNaN(parsedDate.getTime())) {
                                const month = parsedDate.getMonth() + 1;
                                const day = parsedDate.getDate();
                                dateStr = `${month}/${day}`;
                            } else {
                                dateStr = game.date.length > 10 ? game.date.substring(5, 10) : game.date;
                            }
                        }

                        // 팀 이름 포맷팅 (첫글자 대문자, 가운뎃점 구분)
                        const formatName = (name) => name.charAt(0).toUpperCase() + name.slice(1);

                        // 본인이 승리팀에 있는지 확인
                        const isPlayerInWinners = game.winners.some(name =>
                            name.toLowerCase() === selectedPlayerName.toLowerCase()
                        );

                        // 본인 팀을 왼쪽에 배치
                        const leftTeam = isPlayerInWinners ? game.winners : game.losers;
                        const rightTeam = isPlayerInWinners ? game.losers : game.winners;
                        const leftIsWinner = isPlayerInWinners;

                        const leftTeamStr = leftTeam.map(formatName).join(' · ');
                        const rightTeamStr = rightTeam.map(formatName).join(' · ');

                        // 플레이어 하이라이트 (본인, MVP, ACE)
                        const highlightPlayers = (str, isWinnerSide) => {
                            let result = str;

                            // 본인 하이라이트 (박스)
                            const selfRegex = new RegExp(`(${selectedPlayerName})`, 'gi');
                            result = result.replace(selfRegex, `<span style="background: #e3f2fd; padding: 2px 6px; border-radius: 4px; border: 1px solid #90caf9; font-weight: 600;">$1</span>`);

                            // MVP 하이라이트 (승리팀에서)
                            if (game.mvp && isWinnerSide) {
                                const mvpRegex = new RegExp(`(${game.mvp})`, 'gi');
                                result = result.replace(mvpRegex, `<span style="color: #9333EA;" class="fw-bold"><i class="fas fa-crown me-1"></i>$1</span>`);
                            }
                            // ACE 하이라이트 (패배팀에서)
                            if (game.ace && !isWinnerSide) {
                                const aceRegex = new RegExp(`(${game.ace})`, 'gi');
                                result = result.replace(aceRegex, `<span style="color: #10B981;" class="fw-bold"><i class="fas fa-medal me-1"></i>$1</span>`);
                            }
                            return result;
                        };

                        return `
                            <div class="match-row" data-match-index="${index}">
                                <div class="match-round">
                                    <span class="match-date">${dateStr}</span>
                                </div>
                                <div class="match-team ${leftIsWinner ? 'win-team' : 'lose-team'} left-team">
                                    <span class="team-badge ${leftIsWinner ? 'win' : 'lose'}">${leftIsWinner ? 'W' : 'L'}</span>
                                    <span class="team-players">${highlightPlayers(leftTeamStr, leftIsWinner)}</span>
                                </div>
                                <div class="match-vs">VS</div>
                                <div class="match-team ${leftIsWinner ? 'lose-team' : 'win-team'} right-team">
                                    <span class="team-players">${highlightPlayers(rightTeamStr, !leftIsWinner)}</span>
                                    <span class="team-badge ${leftIsWinner ? 'lose' : 'win'}">${leftIsWinner ? 'L' : 'W'}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="alert alert-info mb-4">
                <i class="fas fa-info-circle me-2"></i>최근 경기 기록이 없습니다.
            </div>
        `;
    }

    // 상대 전적과 시너지 차트 생성 (한 줄에 같이 표시)
    if ((topRivals.length > 0 || bottomRivals.length > 0) || (topTeammates.length > 0 || bottomTeammates.length > 0)) {
        console.log("Adding rival and teammate charts to HTML");
        html += `
            <div class="row">
                <!-- 상대 전적 차트 -->
                <div class="col-md-6">
                    <h5>상대 전적 (3판 이상 만난 경우)</h5>
                    <div style="height: 200px; position: relative;">
                        <canvas id="rivalChart"></canvas>
                    </div>
                </div>
                
                <!-- 시너지 차트 -->
                <div class="col-md-6">
                    <h5>시너지 (3판 이상 만난 경우)</h5>
                    <div style="height: 200px; position: relative;">
                        <canvas id="teammateChart"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    // 5판 미만인 경우 안내 메시지
    if (!showDetailedStats) {
        html += `
            <div class="alert alert-warning mt-3">
                <i class="fas fa-info-circle me-2"></i>
                <strong>5판 이상 플레이해야 상대 전적 및 시너지 통계를 볼 수 있습니다.</strong><br>
                <small class="text-muted">현재 ${totalGamesPlayed}판 플레이 (${5 - totalGamesPlayed}판 더 필요)</small>
            </div>
        `;
    }
    // 5판 이상이지만 데이터가 없을 경우 안내 메시지
    else if (playerComparisons.length === 0 && teammateComparisons.length === 0) {
        console.log("No comparison data available");
        html += '<div class="alert alert-info mt-3"><i class="fas fa-info-circle me-2"></i>다른 플레이어와 3판 이상의 전적 데이터가 없습니다.</div>';
    } else {
        // 차트 렌더링을 위한 스크립트 추가
        console.log("Adding chart rendering script to HTML");
        // 동적으로 생성된 스크립트 대신, 직접 함수를 호출
        setTimeout(() => {
            console.log("Directly calling renderRivalChart with:", topRivals.reverse(), bottomRivals);
            console.log("Directly calling renderTeammateChart with:", topTeammates.reverse(), bottomTeammates);
            renderRivalChart(topRivals.reverse(), bottomRivals);
            renderTeammateChart(topTeammates.reverse(), bottomTeammates);
        }, 100);
    }

    console.log("Generated HTML:", html);
    return html;
}

function renderComparePlayerDetails(player1Name, player2Name) {
    const player1 = gameData.players.find(p => p.name === player1Name);
    const player2 = gameData.players.find(p => p.name === player2Name);

    if (!player1 || !player2) return '<p>플레이어 정보를 찾을 수 없습니다.</p>';

    // 두 플레이어 모두 5판 이상 플레이해야 상대전적/시너지 표시
    const player1TotalGames = player1.total_wins + player1.total_losses;
    const player2TotalGames = player2.total_wins + player2.total_losses;
    const showDetailedStats = player1TotalGames >= 5 && player2TotalGames >= 5;

    console.log("Comparing players:", player1Name, player2Name);
    const headToHead = calculateHeadToHead(player1Name, player2Name);
    const teamedUp = calculateTeamedUpWinrate(player1Name, player2Name);

    // 포지션별 상대 전적 계산
    const positionHeadToHead = calculatePositionHeadToHead(player1Name, player2Name);

    // 상성 배지 계산
    const synergyBadges = getSynergyBadgeHtml(player1Name, player2Name);

    // 포지션별 상대 전적 테이블 HTML 생성 (뱃지 형식)
    let positionTableHTML = '';
    if (positionHeadToHead && Object.keys(positionHeadToHead).length > 0) {
        positionTableHTML = `
            <h5 class="mt-4">포지션별 상대 전적</h5>
            <table class="table table-striped table-sm">
                <thead>
                    <tr>
                        <th>포지션</th>
                        <th>${player1Name}</th>
                        <th>${player2Name}</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // 포지션별 색상 클래스 매핑
        const positionClassMap = {
            'top': 'pos-top',
            'jungle': 'pos-jungle',
            'mid': 'pos-mid',
            'adc': 'pos-adc',
            'support': 'pos-support'
        };
        
        Object.entries(positionHeadToHead).forEach(([position, data]) => {
            const posName = getPositionName(position);
            const posClass = positionClassMap[position] || '';
            
            // 승률에 따라 색상 클래스 결정 (winrate는 0-100 범위의 퍼센트 값)
            const getPlayerWinrateClass = (winrate) => {
                // Ensure winrate is a number
                const numericWinrate = Number(winrate);
                if (isNaN(numericWinrate)) return 'text-muted';
                if (numericWinrate >= 60) return 'text-success';
                if (numericWinrate >= 40) return 'text-warning';
                return 'text-danger';
            };
            
            const player1WinrateClass = getPlayerWinrateClass(data.player1.winrate);
            const player2WinrateClass = getPlayerWinrateClass(data.player2.winrate);
            
            positionTableHTML += `
                <tr>
                    <td><span class="position-badge ${posClass}">${posName}</span></td>
                    <td>
                        <span class="${player1WinrateClass}">${data.player1.wins}승 ${data.player1.losses}패</span>
                        <span class="badge bg-secondary ms-1">${Number(data.player1.winrate).toFixed(1)}%</span>
                    </td>
                    <td>
                        <span class="${player2WinrateClass}">${data.player2.wins}승 ${data.player2.losses}패</span>
                        <span class="badge bg-secondary ms-1">${Number(data.player2.winrate).toFixed(1)}%</span>
                    </td>
                </tr>
            `;
        });
        
        positionTableHTML += `
                </tbody>
            </table>
        `;
    }

    return `
        <div class="row">
            <div class="col-md-6">
                <h4>${player1.name}</h4>
                <p>${player1.total_wins}승 ${player1.total_losses}패 (${(player1.overall_winrate * 100).toFixed(1)}%)</p>
            </div>
            <div class="col-md-6">
                <h4>${player2.name}</h4>
                <p>${player2.total_wins}승 ${player2.total_losses}패 (${(player2.overall_winrate * 100).toFixed(1)}%)</p>
            </div>
        </div>
        ${synergyBadges ? `<div class="text-center mb-3">${synergyBadges}</div>` : ''}
        ${showDetailedStats ? `
        <hr>
        <h5>상대 전적 (적으로 만났을 때):</h5>
        ${headToHead.totalGames >= 3 ?
            `<p>${player1Name} 기준: <strong>${headToHead.player1Wins}승 ${headToHead.player2Wins}패</strong> (총 ${headToHead.totalGames}게임)</p>` :
            `<p class="text-muted">상대 전적을 보려면 최소 3판 이상의 경기가 필요합니다. (현재 ${headToHead.totalGames}게임)</p>`
        }
        <hr>
        <h5>팀 전적 (같은 팀으로 만났을 때):</h5>
        ${teamedUp.teamedUpGames >= 3 ?
            `<p><strong>${teamedUp.teamedUpWins}승 ${teamedUp.teamedUpGames - teamedUp.teamedUpWins}패</strong> (총 ${teamedUp.teamedUpGames}게임)</p>
             <p>승률: <strong>${teamedUp.winrate.toFixed(1)}%</strong></p>` :
            `<p class="text-muted">팀 전적을 보려면 최소 3판 이상의 경기가 필요합니다. (현재 ${teamedUp.teamedUpGames}게임)</p>`
        }
        ` : `
        <div class="alert alert-warning mt-3">
            <i class="fas fa-info-circle me-2"></i>
            <strong>모든 플레이어가 5판 이상 플레이해야 상대 전적 및 시너지 통계를 볼 수 있습니다.</strong><br>
            <small class="text-muted">
                ${player1TotalGames < 5 ? `${player1.name}: ${player1TotalGames}판 (${5 - player1TotalGames}판 더 필요)` : ''}
                ${player1TotalGames < 5 && player2TotalGames < 5 ? ', ' : ''}
                ${player2TotalGames < 5 ? `${player2.name}: ${player2TotalGames}판 (${5 - player2TotalGames}판 더 필요)` : ''}
            </small>
        </div>
        `}
        ${positionTableHTML}
    `;
}

function calculateHeadToHead(player1Name, player2Name) {
    console.log(`calculateHeadToHead called: ${player1Name} vs ${player2Name}`);
    console.log('gameRecords available:', gameRecords.length);
    
    let player1Wins = 0;
    let player2Wins = 0;
    let totalGames = 0;

    // 대소문자 구분 없이 비교하기 위해 소문자로 변환
    const p1Name = player1Name.toLowerCase();
    const p2Name = player2Name.toLowerCase();

    if (gameRecords && Array.isArray(gameRecords)) {
        gameRecords.forEach((record, index) => {
            if (!record || !record.winners || !record.losers) return;
            
            // 대소문자 구분 없이 포함 여부 확인
            const p1InWinners = record.winners.some(name => name.toLowerCase() === p1Name);
            const p2InWinners = record.winners.some(name => name.toLowerCase() === p2Name);
            const p1InLosers = record.losers.some(name => name.toLowerCase() === p1Name);
            const p2InLosers = record.losers.some(name => name.toLowerCase() === p2Name);

            console.log(`Record ${index}: winners=${JSON.stringify(record.winners)}, losers=${JSON.stringify(record.losers)}`);
            console.log(`P1 in winners: ${p1InWinners}, P1 in losers: ${p1InLosers}`);
            console.log(`P2 in winners: ${p2InWinners}, P2 in losers: ${p2InLosers}`);

            // 두 플레이어가 서로 다른 팀에 있을 때
            if ((p1InWinners && p2InLosers) || (p1InLosers && p2InWinners)) {
                totalGames++;
                if (p1InWinners) {
                    player1Wins++;
                } else {
                    player2Wins++;
                }
                console.log(`Head-to-head game found! Total games now: ${totalGames}`);
            }
        });
    }

    console.log(`Head-to-head result: ${player1Name} ${player1Wins}승, ${player2Name} ${player2Wins}승 (총 ${totalGames}게임)`);
    return { player1Wins, player2Wins, totalGames };
}

function calculateTeamedUpWinrate(player1Name, player2Name) {
    console.log(`calculateTeamedUpWinrate called: ${player1Name} + ${player2Name}`);
    console.log('gameRecords available:', gameRecords.length);
    
    let teamedUpWins = 0;
    let teamedUpGames = 0;

    // 대소문자 구분 없이 비교하기 위해 소문자로 변환
    const p1Name = player1Name.toLowerCase();
    const p2Name = player2Name.toLowerCase();

    if (gameRecords && Array.isArray(gameRecords)) {
        gameRecords.forEach((record, index) => {
            if (!record || !record.winners || !record.losers) return;
            
            // 대소문자 구분 없이 포함 여부 확인
            const p1InWinners = record.winners.some(name => name.toLowerCase() === p1Name);
            const p2InWinners = record.winners.some(name => name.toLowerCase() === p2Name);
            const p1InLosers = record.losers.some(name => name.toLowerCase() === p1Name);
            const p2InLosers = record.losers.some(name => name.toLowerCase() === p2Name);

            console.log(`Record ${index}: P1 in winners: ${p1InWinners}, P2 in winners: ${p2InWinners}`);
            console.log(`Record ${index}: P1 in losers: ${p1InLosers}, P2 in losers: ${p2InLosers}`);

            // 두 플레이어가 같은 팀에 있을 때
            if ((p1InWinners && p2InWinners) || (p1InLosers && p2InLosers)) {
                teamedUpGames++;
                if (p1InWinners && p2InWinners) {
                    teamedUpWins++;
                }
                console.log(`Teamed-up game found! Wins: ${teamedUpWins}, Games: ${teamedUpGames}`);
            }
        });
    }

    const winrate = teamedUpGames > 0 ? (teamedUpWins / teamedUpGames) * 100 : 0;
    console.log(`Teamed-up result: ${teamedUpWins}승 ${teamedUpGames - teamedUpWins}패, 승률: ${winrate.toFixed(1)}%`);
    return { teamedUpWins, teamedUpGames, winrate };
}

// 포지션별 상대 전적 계산 함수
function calculatePositionHeadToHead(player1Name, player2Name) {
    console.log(`calculatePositionHeadToHead called: ${player1Name} vs ${player2Name}`);
    
    // 결과를 저장할 객체
    const positionResults = {};
    
    // 포지션 목록
    const positions = ['top', 'jungle', 'mid', 'adc', 'support'];
    
    // 각 포지션별로 전적 계산
    positions.forEach(position => {
        // 플레이어들의 해당 포지션 게임 수 확인
        const player1PositionGames = getPlayerPositionGames(player1Name, position);
        const player2PositionGames = getPlayerPositionGames(player2Name, position);
        
        // 둘 다 해당 포지션에서 게임을 했을 때만 계산
        if (player1PositionGames > 0 && player2PositionGames > 0) {
            let player1Wins = 0;
            let player2Wins = 0;
            let totalGames = 0;
            
            // 대소문자 구분 없이 비교하기 위해 소문자로 변환
            const p1Name = player1Name.toLowerCase();
            const p2Name = player2Name.toLowerCase();
            
            if (gameRecords && Array.isArray(gameRecords)) {
                gameRecords.forEach((record, index) => {
                    if (!record || !record.winners || !record.losers) return;
                    
                    // Check if both players played in this game
                    const p1InWinners = record.winners.some(name => name.toLowerCase() === p1Name);
                    const p2InLosers = record.losers.some(name => name.toLowerCase() === p2Name);
                    const p1InLosers = record.losers.some(name => name.toLowerCase() === p1Name);
                    const p2InWinners = record.winners.some(name => name.toLowerCase() === p2Name);
                    
                    // Check if both players played in the specified position
                    const p1WinnerIndex = record.winners.findIndex(name => name.toLowerCase() === p1Name);
                    const p2LoserIndex = record.losers.findIndex(name => name.toLowerCase() === p2Name);
                    const p1LoserIndex = record.losers.findIndex(name => name.toLowerCase() === p1Name);
                    const p2WinnerIndex = record.winners.findIndex(name => name.toLowerCase() === p2Name);
                    
                    const p1PositionMatch = (p1InWinners && p1WinnerIndex === getPositionIndex(position)) || 
                                           (p1InLosers && p1LoserIndex === getPositionIndex(position));
                    const p2PositionMatch = (p2InWinners && p2WinnerIndex === getPositionIndex(position)) || 
                                           (p2InLosers && p2LoserIndex === getPositionIndex(position));
                    
                    // 두 플레이어가 모두 같은 포지션으로 서로 다른 팀에 있었을 때
                    if (p1PositionMatch && p2PositionMatch && 
                        ((p1InWinners && p2InLosers) || (p1InLosers && p2InWinners))) {
                        totalGames++;
                        if (p1InWinners) {
                            player1Wins++;
                        } else {
                            player2Wins++;
                        }
                    }
                });
            }
            
            // 결과 저장
            if (totalGames > 0) {
                positionResults[position] = {
                    player1: {
                        wins: player1Wins,
                        losses: player2Wins, // player1의 패배는 player2의 승리
                        winrate: (player1Wins / totalGames) * 100
                    },
                    player2: {
                        wins: player2Wins,
                        losses: player1Wins, // player2의 패배는 player1의 승리
                        winrate: (player2Wins / totalGames) * 100
                    }
                };
            }
        }
    });
    
    console.log("Position head-to-head results:", positionResults);
    return positionResults;
}

// 특정 플레이어의 특정 포지션 게임 수 확인
function getPlayerPositionGames(playerName, position) {
    const player = gameData.players.find(p => p.name === playerName);
    if (player && player.positions[position]) {
        return player.positions[position].games;
    }
    return 0;
}

// 게임 기록에서 플레이어의 포지션 확인
function getPlayerPositionInGame(record, playerName, position) {
    // 승자 팀에서 플레이어 찾기
    const winnerIndex = record.winners.findIndex(name => name.toLowerCase() === playerName);
    if (winnerIndex !== -1 && winnerIndex === getPositionIndex(position)) {
        return true;
    }

    // 패자 팀에서 플레이어 찾기
    const loserIndex = record.losers.findIndex(name => name.toLowerCase() === playerName);
    if (loserIndex !== -1 && loserIndex === getPositionIndex(position)) {
        return true;
    }

    return false;
}

// 플레이어의 최근 N경기 폼 계산 (승/패 배열 반환)
export function getPlayerRecentForm(playerName, maxGames = 5) {
    if (!gameRecords || !Array.isArray(gameRecords)) return [];

    const playerNameLower = playerName.toLowerCase();
    const recentGames = [];

    // 게임 기록을 역순으로 순회 (최신 기록부터)
    for (let i = gameRecords.length - 1; i >= 0 && recentGames.length < maxGames; i--) {
        const record = gameRecords[i];
        if (!record || !record.winners || !record.losers) continue;

        const inWinners = record.winners.some(name => name.toLowerCase() === playerNameLower);
        const inLosers = record.losers.some(name => name.toLowerCase() === playerNameLower);

        if (inWinners) {
            recentGames.push('win');
        } else if (inLosers) {
            recentGames.push('loss');
        }
    }

    return recentGames;
}

// 플레이어의 최근 N경기 상세 정보 반환
export function getPlayerRecentGames(playerName, maxGames = 5) {
    if (!gameRecords || !Array.isArray(gameRecords)) return [];

    const playerNameLower = playerName.toLowerCase();
    const recentGames = [];

    // 게임 기록을 역순으로 순회 (최신 기록부터)
    for (let i = gameRecords.length - 1; i >= 0 && recentGames.length < maxGames; i--) {
        const record = gameRecords[i];
        if (!record || !record.winners || !record.losers) continue;

        const inWinners = record.winners.some(name => name.toLowerCase() === playerNameLower);
        const inLosers = record.losers.some(name => name.toLowerCase() === playerNameLower);

        if (inWinners || inLosers) {
            recentGames.push({
                date: record.date || '',
                isWin: inWinners,
                winners: record.winners,
                losers: record.losers,
                myTeam: inWinners ? record.winners : record.losers,
                enemyTeam: inWinners ? record.losers : record.winners,
                mvp: record.mvp || '',
                ace: record.ace || ''
            });
        }
    }

    return recentGames;
}

// 최근 폼 HTML 생성
export function getRecentFormHtml(playerName) {
    const form = getPlayerRecentForm(playerName);
    if (form.length === 0) return '';

    return `
        <span class="recent-form d-flex gap-1">
            ${form.map(result =>
                `<span style="width: 8px; height: 8px; border-radius: 50%; background: ${result === 'win' ? '#10B981' : '#EF4444'}; display: inline-block;" title="${result === 'win' ? '승리' : '패배'}"></span>`
            ).join('')}
        </span>
    `;
}

// 두 플레이어의 상성 계산
export function calculateSynergy(player1Name, player2Name) {
    if (!gameRecords || !Array.isArray(gameRecords)) {
        return { sameTeamWinRate: 0, sameTeamGames: 0, vsWinRate: 0, vsGames: 0 };
    }

    const p1Name = player1Name.toLowerCase();
    const p2Name = player2Name.toLowerCase();

    let sameTeamWins = 0;
    let sameTeamGames = 0;
    let p1WinsVsP2 = 0;
    let vsGames = 0;

    gameRecords.forEach(record => {
        if (!record || !record.winners || !record.losers) return;

        const p1InWinners = record.winners.some(name => name.toLowerCase() === p1Name);
        const p2InWinners = record.winners.some(name => name.toLowerCase() === p2Name);
        const p1InLosers = record.losers.some(name => name.toLowerCase() === p1Name);
        const p2InLosers = record.losers.some(name => name.toLowerCase() === p2Name);

        // 같은 팀
        if ((p1InWinners && p2InWinners) || (p1InLosers && p2InLosers)) {
            sameTeamGames++;
            if (p1InWinners && p2InWinners) {
                sameTeamWins++;
            }
        }

        // 상대 팀
        if ((p1InWinners && p2InLosers) || (p1InLosers && p2InWinners)) {
            vsGames++;
            if (p1InWinners) {
                p1WinsVsP2++;
            }
        }
    });

    return {
        sameTeamWinRate: sameTeamGames > 0 ? (sameTeamWins / sameTeamGames) * 100 : 0,
        sameTeamGames,
        vsWinRate: vsGames > 0 ? (p1WinsVsP2 / vsGames) * 100 : 0,
        vsGames
    };
}

// 상성 배지 HTML 생성
export function getSynergyBadgeHtml(player1Name, player2Name) {
    const synergy = calculateSynergy(player1Name, player2Name);
    const badges = [];

    // 듀오 배지: 같은 팀 승률 75% 이상, 최소 4경기 이상
    if (synergy.sameTeamGames >= 4 && synergy.sameTeamWinRate >= 75) {
        badges.push(`<span class="synergy-badge duo"><i class="fas fa-bolt me-1"></i>영혼의 듀오</span>`);
    }

    // 천적 배지: 상대 팀 승률 25% 미만, 최소 4경기 이상
    if (synergy.vsGames >= 4 && synergy.vsWinRate <= 25) {
        badges.push(`<span class="synergy-badge nemesis"><i class="fas fa-skull me-1"></i>천적 관계</span>`);
    }

    return badges.join('');
}

// 플레이어의 MVP/ACE 카운트 계산
export function getPlayerMvpAceCounts(playerName) {
    if (!gameRecords || !Array.isArray(gameRecords)) {
        return { mvpCount: 0, aceCount: 0 };
    }

    const playerNameLower = playerName.toLowerCase();
    let mvpCount = 0;
    let aceCount = 0;

    gameRecords.forEach(record => {
        if (!record) return;

        if (record.mvp && record.mvp.toLowerCase() === playerNameLower) {
            mvpCount++;
        }
        if (record.ace && record.ace.toLowerCase() === playerNameLower) {
            aceCount++;
        }
    });

    return { mvpCount, aceCount };
}
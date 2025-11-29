import { getPositionName, getPositionIndex, getParticle } from './utils.js';
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

// 카드 영역 높이를 상세 패널 높이에 맞춤
function syncCardsWrapperHeight() {
    const detailsPanel = document.getElementById('playerDetailsDisplayArea');
    const cardsWrapper = document.querySelector('.player-cards-wrapper');

    if (detailsPanel && cardsWrapper && detailsPanel.classList.contains('show')) {
        // 상세 패널의 실제 높이를 가져와서 카드 영역에 적용
        requestAnimationFrame(() => {
            const panelHeight = detailsPanel.offsetHeight;
            cardsWrapper.style.maxHeight = panelHeight + 'px';
        });
    }
}

// 카드 영역 높이 초기화
function resetCardsWrapperHeight() {
    const cardsWrapper = document.querySelector('.player-cards-wrapper');
    if (cardsWrapper) {
        cardsWrapper.style.maxHeight = '';
    }
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
            // 2명이 이미 선택된 경우, 2번째 플레이어를 교체
            const secondPlayer = selectedPlayers[1];
            const secondCard = document.getElementById(`player-card-${secondPlayer}`);
            if (secondCard) {
                secondCard.classList.remove('selected', 'selected-first', 'selected-second');
            }

            // 새 플레이어를 2번째로 설정
            selectedPlayers[1] = playerName;
            card.classList.add('selected', 'selected-second');
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
        // 패널 숨기기 애니메이션
        playerDetailsDisplayArea.classList.remove('show');
        playerDetailsDisplayArea.classList.add('hiding');

        // 애니메이션 완료 후 완전히 숨기기
        setTimeout(() => {
            playerDetailsDisplayArea.classList.remove('hiding');
            playerDetailsDisplayArea.style.display = 'none';
            playerDetailsContent.innerHTML = '';
            resetCardsWrapperHeight();
        }, 60);
    } else if (selectedPlayers.length === 1) {
        console.log("One player selected, showing all player comparison");
        playerDetailsContent.innerHTML = renderAllPlayerComparison(selectedPlayers[0]);
        playerDetailsDisplayArea.style.display = 'block';
        // 패널 표시 애니메이션
        requestAnimationFrame(() => {
            playerDetailsDisplayArea.classList.add('show');
            syncCardsWrapperHeight();
        });
    } else if (selectedPlayers.length === 2) {
        console.log("Two players selected, showing comparison");
        playerDetailsContent.innerHTML = renderComparePlayerDetails(selectedPlayers[0], selectedPlayers[1]);
        playerDetailsDisplayArea.style.display = 'block';
        // 패널 표시 애니메이션
        requestAnimationFrame(() => {
            playerDetailsDisplayArea.classList.add('show');
            syncCardsWrapperHeight();
        });
    }
}

export function clearPlayerSelection() {
    console.log("clearPlayerSelection called.");

    // 선택된 플레이어가 없으면 아무것도 하지 않음
    if (selectedPlayers.length === 0) {
        return;
    }

    selectedPlayers.forEach(playerName => {
        const card = document.getElementById(`player-card-${playerName}`);
        if (card) {
            card.classList.remove('selected', 'selected-first', 'selected-second');
        }
    });
    selectedPlayers = [];
    const playerDetailsDisplayArea = document.getElementById('playerDetailsDisplayArea');
    const playerDetailsContent = document.getElementById('playerDetailsContent');

    // 패널 숨기기 애니메이션
    playerDetailsDisplayArea.classList.remove('show');
    playerDetailsDisplayArea.classList.add('hiding');

    // 애니메이션 완료 후 완전히 숨기기
    setTimeout(() => {
        playerDetailsDisplayArea.classList.remove('hiding');
        playerDetailsDisplayArea.style.display = 'none';
        playerDetailsContent.innerHTML = '';
        resetCardsWrapperHeight();
    }, 60);
}

// 태그 용어집에서 플레이어 선택 (애니메이션 없이 즉시 초기화 후 선택)
export function selectPlayerFromGlossary(playerName) {
    // 기존 선택 즉시 초기화 (애니메이션 없이)
    selectedPlayers.forEach(name => {
        const card = document.getElementById(`player-card-${name}`);
        if (card) {
            card.classList.remove('selected', 'selected-first', 'selected-second');
        }
    });
    selectedPlayers = [];

    // 새 플레이어 선택
    handlePlayerClick(playerName);
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

    // 태그 HTML 가져오기 (포지션 태그 통합됨)
    const allTagsHtml = getAllPlayerTagsHtml(selectedPlayerName);

    // HTML 생성
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="mb-0">${selectedPlayer.name} ${getTierBadgeHtml(selectedPlayer.tier)} - 전적 분석</h4>
            <span>
                전체 전적: ${selectedPlayer.total_wins}승 ${selectedPlayer.total_losses}패 (${(selectedPlayer.overall_winrate * 100).toFixed(1)}%)
                <span class="ms-3">
                    <span style="color: var(--accent-primary);"><i class="fas fa-crown me-1"></i>MVP ${mvpAceCounts.mvpCount}회</span>
                    <span class="ms-2" style="color: var(--accent-green);"><i class="fas fa-medal me-1"></i>ACE ${mvpAceCounts.aceCount}회</span>
                </span>
            </span>
        </div>

        <div class="player-tags-section mb-4">
            <h5><i class="fas fa-tags me-2"></i>획득 태그</h5>
            ${allTagsHtml}
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
                        <span style="color: var(--accent-primary);"><i class="fas fa-crown me-1"></i>${recentMvpCount}</span>
                        <span class="ms-1" style="color: var(--accent-green);"><i class="fas fa-medal me-1"></i>${recentAceCount}</span>
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

                            // 본인 하이라이트 (박스) - CSS 클래스 사용
                            const selfRegex = new RegExp(`(${selectedPlayerName})`, 'gi');
                            result = result.replace(selfRegex, `<span class="player-highlight">$1</span>`);

                            // MVP 하이라이트 (승리팀에서)
                            if (game.mvp && isWinnerSide) {
                                const mvpRegex = new RegExp(`(${game.mvp})`, 'gi');
                                result = result.replace(mvpRegex, `<span class="fw-bold" style="color: var(--accent-primary);"><i class="fas fa-crown me-1"></i>$1</span>`);
                            }
                            // ACE 하이라이트 (패배팀에서)
                            if (game.ace && !isWinnerSide) {
                                const aceRegex = new RegExp(`(${game.ace})`, 'gi');
                                result = result.replace(aceRegex, `<span class="fw-bold" style="color: var(--accent-green);"><i class="fas fa-medal me-1"></i>$1</span>`);
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
        const positionInfo = {
            'top': { class: 'pos-top', img: 'img/positions/Top.svg', name: 'TOP' },
            'jungle': { class: 'pos-jungle', img: 'img/positions/Jug.svg', name: 'JGL' },
            'mid': { class: 'pos-mid', img: 'img/positions/Mid.svg', name: 'MID' },
            'adc': { class: 'pos-adc', img: 'img/positions/Bot.svg', name: 'ADC' },
            'support': { class: 'pos-support', img: 'img/positions/Sup.svg', name: 'SUP' }
        };

        Object.entries(positionHeadToHead).forEach(([position, data]) => {
            const posInfo = positionInfo[position] || { class: '', img: '', name: position };

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
                    <td><span class="position-badge ${posInfo.class}"><img src="${posInfo.img}" alt="${posInfo.name}" title="${posInfo.name}"></span></td>
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

        <div class="player-tags-section mb-4">
            <h5><i class="fas fa-tags me-2"></i>획득 태그</h5>
            ${synergyBadges || '<p class="text-muted mb-0">획득한 태그가 없습니다</p>'}
        </div>
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

    // 역순으로 변환 (가장 오래된 게임이 왼쪽, 최신 게임이 오른쪽)
    const reversedForm = [...form].reverse();

    return `
        <span class="recent-form d-flex gap-1">
            ${reversedForm.map(result =>
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

// 모든 듀오 시너지 계산 및 랭킹 반환
export function getDuoSynergyRanking(minGames = 5) {
    if (!gameData?.players || !gameRecords) return { best: [], worst: [] };

    const duoStats = [];
    const players = gameData.players;

    // 모든 플레이어 조합 계산
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const p1 = players[i].name;
            const p2 = players[j].name;
            const synergy = calculateSynergy(p1, p2);

            if (synergy.sameTeamGames >= minGames) {
                duoStats.push({
                    player1: p1,
                    player2: p2,
                    games: synergy.sameTeamGames,
                    winRate: synergy.sameTeamWinRate
                });
            }
        }
    }

    // 승률 기준 정렬
    const sorted = duoStats.sort((a, b) => b.winRate - a.winRate);

    return {
        best: sorted.slice(0, 10),
        worst: sorted.slice(-10).reverse()
    };
}

// 듀오 시너지 랭킹 HTML 렌더링
export function renderDuoSynergyRanking() {
    const { best, worst } = getDuoSynergyRanking(5);

    const createDuoRow = (duo, index, isBest) => {
        const winRateColor = duo.winRate >= 60 ? '#10B981' :
                            duo.winRate >= 40 ? '#F59E0B' : '#EF4444';
        const rankIcon = index === 0 ? (isBest ? '🥇' : '💀') :
                        index === 1 ? (isBest ? '🥈' : '☠️') :
                        index === 2 ? (isBest ? '🥉' : '👻') : `${index + 1}`;

        return `
            <div class="duo-rank-item d-flex align-items-center gap-3 p-2" style="background: var(--bg-tertiary, rgba(40, 40, 45, 0.5)); border-radius: 8px;">
                <span class="duo-rank-number fw-bold" style="min-width: 28px; text-align: center;">${rankIcon}</span>
                <div class="duo-players flex-grow-1">
                    <span class="fw-semibold">${duo.player1}</span>
                    <span class="text-muted mx-1">&</span>
                    <span class="fw-semibold">${duo.player2}</span>
                </div>
                <div class="duo-stats text-end">
                    <span class="fw-bold" style="color: ${winRateColor};">${duo.winRate.toFixed(1)}%</span>
                    <span class="text-muted small ms-1">(${duo.games}판)</span>
                </div>
            </div>
        `;
    };

    return `
        <div class="duo-synergy-ranking card mb-4" style="background: var(--bg-secondary, rgba(30, 30, 35, 0.8)); border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));">
            <div class="card-body">
                <h5 class="card-title mb-3">
                    <i class="fas fa-user-friends me-2" style="color: var(--accent-primary, #8b5cf6);"></i>
                    듀오 시너지 랭킹
                    <span class="text-muted small ms-2">(최소 5판 이상)</span>
                </h5>

                <div class="row">
                    <div class="col-md-6 mb-3 mb-md-0">
                        <h6 class="text-success mb-3"><i class="fas fa-trophy me-2"></i>베스트 듀오 TOP 10</h6>
                        <div class="d-flex flex-column gap-2">
                            ${best.length > 0 ? best.map((duo, i) => createDuoRow(duo, i, true)).join('') : '<p class="text-muted">데이터가 없습니다</p>'}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-danger mb-3"><i class="fas fa-skull-crossbones me-2"></i>워스트 듀오 TOP 10</h6>
                        <div class="d-flex flex-column gap-2">
                            ${worst.length > 0 ? worst.map((duo, i) => createDuoRow(duo, i, false)).join('') : '<p class="text-muted">데이터가 없습니다</p>'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 상성 배지 HTML 생성 (2인 비교 전용)
export function getSynergyBadgeHtml(player1Name, player2Name, isSinglePlayer = false) {
    // 1인 선택 시 빈 문자열 반환 (태그는 getPlayerTags로 통합됨)
    if (isSinglePlayer) {
        return '';
    }

    const synergy = calculateSynergy(player1Name, player2Name);
    const badges = [];

    // 태그 생성 헬퍼 함수
    const createTag = (icon, text, color, tooltip) => {
        return `<span class="player-tag player-tag-large" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40;" data-tooltip="${tooltip}">
            <i class="fas ${icon} me-1"></i>${text}
        </span>`;
    };

    // 플레이어 개인 승률 가져오기
    const player1 = gameData?.players?.find(p => p.name.toLowerCase() === player1Name.toLowerCase());
    const player2 = gameData?.players?.find(p => p.name.toLowerCase() === player2Name.toLowerCase());
    const p1WinRate = (player1?.overall_winrate || 0) * 100;
    const p2WinRate = (player2?.overall_winrate || 0) * 100;

    // 전체 게임 수 계산
    const totalGames = synergy.sameTeamGames + synergy.vsGames;
    const sameTeamRatio = totalGames > 0 ? (synergy.sameTeamGames / totalGames) * 100 : 0;
    const vsRatio = totalGames > 0 ? (synergy.vsGames / totalGames) * 100 : 0;

    // === 같은 팀 관련 태그 ===

    // 영혼의 듀오: 같은 팀 승률 65% 이상, 최소 5경기 이상
    if (synergy.sameTeamGames >= 5 && synergy.sameTeamWinRate >= 65) {
        badges.push(createTag('fa-bolt', '영혼의 듀오', '#F59E0B', '같은 팀 승률 65% 이상'));
    }
    // 합쳐서 3인분: 둘 다 개인 승률 50% 미만인데 뭉치면 60% 이상
    if (synergy.sameTeamGames >= 5 && p1WinRate < 50 && p2WinRate < 50 && synergy.sameTeamWinRate >= 60) {
        badges.push(createTag('fa-hand-holding-heart', '합쳐서 3인분', '#EC4899', '각자 승률 50% 미만, 같은 팀 승률 60% 이상'));
    }
    // 패트와 매트: 같은 팀 승률 35% 이하, 최소 5경기 이상
    if (synergy.sameTeamGames >= 5 && synergy.sameTeamWinRate <= 35) {
        badges.push(createTag('fa-tools', '패트와 매트', '#6B7280', '같은 팀 승률 35% 이하'));
    }
    // 불협화음: 둘 다 개인 승률 50% 초과인데 뭉치면 40% 이하
    if (synergy.sameTeamGames >= 5 && p1WinRate > 50 && p2WinRate > 50 && synergy.sameTeamWinRate <= 40) {
        badges.push(createTag('fa-unlink', '불협화음', '#EF4444', '각자 승률 50% 초과, 같은 팀 승률 40% 이하'));
    }

    // === 상대 팀 관련 태그 ===

    // 먹잇감: 상대 팀 승률 35% 이하, 최소 5경기 이상
    if (synergy.vsGames >= 5 && synergy.vsWinRate <= 35) {
        badges.push(createTag('fa-skull', '먹잇감', '#8B5CF6', '상대 시 승률 35% 이하'));
    }
    // 사냥꾼: 상대 팀 승률 65% 이상, 최소 5경기 이상
    else if (synergy.vsGames >= 5 && synergy.vsWinRate >= 65) {
        badges.push(createTag('fa-crosshairs', '사냥꾼', '#10B981', '상대 시 승률 65% 이상'));
    }
    // 자강두천: 상대 팀 승률 45% ~ 55% 사이, 최소 5경기 이상
    else if (synergy.vsGames >= 5 && synergy.vsWinRate >= 45 && synergy.vsWinRate <= 55) {
        badges.push(createTag('fa-balance-scale', '자강두천', '#3B82F6', '상대 시 승률 45%~55%'));
    }

    // === 매칭 빈도 관련 태그 ===

    // 깐부: 전체 게임 중 같은 팀 비율 65% 이상
    if (totalGames >= 5 && sameTeamRatio >= 65) {
        badges.push(createTag('fa-handshake', '깐부', '#3B82F6', '같은 팀 비율 65% 이상'));
    }

    // 질긴 인연: 전체 게임 중 적으로 만난 비율 65% 이상
    if (totalGames >= 5 && vsRatio >= 65) {
        badges.push(createTag('fa-link', '질긴 인연', '#F97316', '상대 팀 비율 65% 이상'));
    }

    if (badges.length === 0) return '';

    return `<div class="player-tags-all d-flex flex-wrap justify-content-center gap-2">${badges.join('')}</div>`;
}

// 최근 10판의 MVP/ACE 카운트 계산
function getRecentMvpAceCounts(playerName) {
    if (!gameRecords || !Array.isArray(gameRecords)) {
        return { mvpCount: 0, aceCount: 0 };
    }

    const playerNameLower = playerName.toLowerCase();

    // 해당 플레이어가 참여한 최근 10경기 찾기
    const playerGames = gameRecords.filter(record => {
        if (!record) return false;
        const allPlayers = [...(record.winners || []), ...(record.losers || [])];
        return allPlayers.some(p => p.toLowerCase() === playerNameLower);
    }).slice(-10);

    let mvpCount = 0;
    let aceCount = 0;

    playerGames.forEach(record => {
        if (record.mvp && record.mvp.toLowerCase() === playerNameLower) {
            mvpCount++;
        }
        if (record.ace && record.ace.toLowerCase() === playerNameLower) {
            aceCount++;
        }
    });

    return { mvpCount, aceCount };
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

// ========================================
// 자극적 태그 시스템
// ========================================

// 연승/연패 계산
export function calculateStreak(playerName) {
    if (!gameRecords || !Array.isArray(gameRecords)) {
        return { type: null, count: 0, isHistoricBest: false };
    }

    const playerNameLower = playerName.toLowerCase();
    let currentStreak = 0;
    let streakType = null;
    let maxWinStreak = 0;
    let maxLoseStreak = 0;
    let tempStreak = 0;
    let tempType = null;

    // 게임 기록을 역순으로 순회 (최신부터)
    for (let i = gameRecords.length - 1; i >= 0; i--) {
        const record = gameRecords[i];
        if (!record || !record.winners || !record.losers) continue;

        const inWinners = record.winners.some(name => name.toLowerCase() === playerNameLower);
        const inLosers = record.losers.some(name => name.toLowerCase() === playerNameLower);

        if (!inWinners && !inLosers) continue; // 이 게임에 참여하지 않음

        const isWin = inWinners;

        // 현재 연승/연패 계산 (첫 번째 연속만)
        if (currentStreak === 0) {
            streakType = isWin ? 'win' : 'lose';
            currentStreak = 1;
        } else if ((streakType === 'win' && isWin) || (streakType === 'lose' && !isWin)) {
            currentStreak++;
        } else {
            break; // 연속이 끊어짐
        }
    }

    // 역대 최고 연승/연패 계산
    for (let i = 0; i < gameRecords.length; i++) {
        const record = gameRecords[i];
        if (!record || !record.winners || !record.losers) continue;

        const inWinners = record.winners.some(name => name.toLowerCase() === playerNameLower);
        const inLosers = record.losers.some(name => name.toLowerCase() === playerNameLower);

        if (!inWinners && !inLosers) continue;

        const isWin = inWinners;

        if (tempType === null) {
            tempType = isWin ? 'win' : 'lose';
            tempStreak = 1;
        } else if ((tempType === 'win' && isWin) || (tempType === 'lose' && !isWin)) {
            tempStreak++;
        } else {
            // 연속 끊김 - 최고 기록 갱신
            if (tempType === 'win' && tempStreak > maxWinStreak) maxWinStreak = tempStreak;
            if (tempType === 'lose' && tempStreak > maxLoseStreak) maxLoseStreak = tempStreak;
            tempType = isWin ? 'win' : 'lose';
            tempStreak = 1;
        }
    }
    // 마지막 연속 처리
    if (tempType === 'win' && tempStreak > maxWinStreak) maxWinStreak = tempStreak;
    if (tempType === 'lose' && tempStreak > maxLoseStreak) maxLoseStreak = tempStreak;

    const isHistoricBest = (streakType === 'win' && currentStreak === maxWinStreak && currentStreak >= 3) ||
                          (streakType === 'lose' && currentStreak === maxLoseStreak && currentStreak >= 3);

    return { type: streakType, count: currentStreak, isHistoricBest };
}

// 특정 상대와의 전적 분석
export function analyzeRivalry(player1Name, player2Name) {
    if (!gameRecords || !Array.isArray(gameRecords)) {
        return { wins: 0, losses: 0, winRate: 0, games: 0 };
    }

    const p1Name = player1Name.toLowerCase();
    const p2Name = player2Name.toLowerCase();

    let wins = 0;
    let losses = 0;

    gameRecords.forEach(record => {
        if (!record || !record.winners || !record.losers) return;

        const p1InWinners = record.winners.some(name => name.toLowerCase() === p1Name);
        const p2InWinners = record.winners.some(name => name.toLowerCase() === p2Name);
        const p1InLosers = record.losers.some(name => name.toLowerCase() === p1Name);
        const p2InLosers = record.losers.some(name => name.toLowerCase() === p2Name);

        // 상대팀으로 만났을 때
        if ((p1InWinners && p2InLosers)) {
            wins++;
        } else if ((p1InLosers && p2InWinners)) {
            losses++;
        }
    });

    const games = wins + losses;
    const winRate = games > 0 ? (wins / games) * 100 : 0;

    return { wins, losses, winRate, games };
}

// 같은 팀 시너지 분석
export function analyzeTeamSynergy(player1Name, player2Name) {
    if (!gameRecords || !Array.isArray(gameRecords)) {
        return { wins: 0, losses: 0, winRate: 0, games: 0 };
    }

    const p1Name = player1Name.toLowerCase();
    const p2Name = player2Name.toLowerCase();

    let wins = 0;
    let losses = 0;

    gameRecords.forEach(record => {
        if (!record || !record.winners || !record.losers) return;

        const p1InWinners = record.winners.some(name => name.toLowerCase() === p1Name);
        const p2InWinners = record.winners.some(name => name.toLowerCase() === p2Name);
        const p1InLosers = record.losers.some(name => name.toLowerCase() === p1Name);
        const p2InLosers = record.losers.some(name => name.toLowerCase() === p2Name);

        // 같은 팀일 때
        if (p1InWinners && p2InWinners) {
            wins++;
        } else if (p1InLosers && p2InLosers) {
            losses++;
        }
    });

    const games = wins + losses;
    const winRate = games > 0 ? (wins / games) * 100 : 0;

    return { wins, losses, winRate, games };
}

// 최근 N판 상대 전적 분석 (태그용)
export function analyzeRecentRivalry(player1Name, player2Name, recentCount = 10) {
    if (!gameRecords || !Array.isArray(gameRecords)) {
        return { wins: 0, losses: 0, winRate: 0, games: 0 };
    }

    const p1Name = player1Name.toLowerCase();
    const p2Name = player2Name.toLowerCase();

    let wins = 0;
    let losses = 0;
    let matchCount = 0;

    // 최신 기록부터 역순으로 순회
    for (let i = gameRecords.length - 1; i >= 0 && matchCount < recentCount; i--) {
        const record = gameRecords[i];
        if (!record || !record.winners || !record.losers) continue;

        const p1InWinners = record.winners.some(name => name.toLowerCase() === p1Name);
        const p2InWinners = record.winners.some(name => name.toLowerCase() === p2Name);
        const p1InLosers = record.losers.some(name => name.toLowerCase() === p1Name);
        const p2InLosers = record.losers.some(name => name.toLowerCase() === p2Name);

        // 상대팀으로 만났을 때만 카운트
        if ((p1InWinners && p2InLosers) || (p1InLosers && p2InWinners)) {
            matchCount++;
            if (p1InWinners && p2InLosers) {
                wins++;
            } else {
                losses++;
            }
        }
    }

    const games = wins + losses;
    const winRate = games > 0 ? (wins / games) * 100 : 0;

    return { wins, losses, winRate, games };
}

// 최근 N판 같은 팀 시너지 분석 (태그용)
export function analyzeRecentTeamSynergy(player1Name, player2Name, recentCount = 10) {
    if (!gameRecords || !Array.isArray(gameRecords)) {
        return { wins: 0, losses: 0, winRate: 0, games: 0 };
    }

    const p1Name = player1Name.toLowerCase();
    const p2Name = player2Name.toLowerCase();

    let wins = 0;
    let losses = 0;
    let matchCount = 0;

    // 최신 기록부터 역순으로 순회
    for (let i = gameRecords.length - 1; i >= 0 && matchCount < recentCount; i--) {
        const record = gameRecords[i];
        if (!record || !record.winners || !record.losers) continue;

        const p1InWinners = record.winners.some(name => name.toLowerCase() === p1Name);
        const p2InWinners = record.winners.some(name => name.toLowerCase() === p2Name);
        const p1InLosers = record.losers.some(name => name.toLowerCase() === p1Name);
        const p2InLosers = record.losers.some(name => name.toLowerCase() === p2Name);

        // 같은 팀일 때만 카운트
        if ((p1InWinners && p2InWinners) || (p1InLosers && p2InLosers)) {
            matchCount++;
            if (p1InWinners && p2InWinners) {
                wins++;
            } else {
                losses++;
            }
        }
    }

    const games = wins + losses;
    const winRate = games > 0 ? (wins / games) * 100 : 0;

    return { wins, losses, winRate, games };
}

// MVP/ACE가 기록된 게임 수와 비율 계산
export function getPlayerMvpAceRatio(playerName) {
    if (!gameRecords || !Array.isArray(gameRecords)) {
        return { mvpCount: 0, aceCount: 0, gamesWithMvpAce: 0, mvpRate: 0, aceRate: 0 };
    }

    const playerNameLower = playerName.toLowerCase();
    let mvpCount = 0;
    let aceCount = 0;
    let gamesWithMvpAce = 0;
    let playerParticipated = 0;

    gameRecords.forEach(record => {
        if (!record || !record.winners || !record.losers) return;

        const inWinners = record.winners.some(name => name.toLowerCase() === playerNameLower);
        const inLosers = record.losers.some(name => name.toLowerCase() === playerNameLower);

        if (!inWinners && !inLosers) return; // 플레이어가 참여하지 않은 게임

        playerParticipated++;

        // MVP/ACE가 기록된 게임인지 확인
        if (record.mvp || record.ace) {
            gamesWithMvpAce++;
            if (record.mvp && record.mvp.toLowerCase() === playerNameLower) {
                mvpCount++;
            }
            if (record.ace && record.ace.toLowerCase() === playerNameLower) {
                aceCount++;
            }
        }
    });

    // MVP/ACE가 기록된 게임 중 비율 계산
    const mvpRate = gamesWithMvpAce > 0 ? (mvpCount / gamesWithMvpAce) * 100 : 0;
    const aceRate = gamesWithMvpAce > 0 ? (aceCount / gamesWithMvpAce) * 100 : 0;

    return { mvpCount, aceCount, gamesWithMvpAce, mvpRate, aceRate, playerParticipated };
}

// 플레이어 태그 생성
export function getPlayerTags(playerName) {
    const tags = [];
    const recentForm = getPlayerRecentForm(playerName, 10); // 최근 10판까지 확인
    const streak = calculateStreak(playerName);
    const mvpAce = getPlayerMvpAceCounts(playerName);

    // 플레이어 정보 가져오기
    const player = gameData?.players?.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    const totalGames = player ? player.total_wins + player.total_losses : 0;

    // 최근 경기 승/패 수
    const recentWins = recentForm.filter(r => r === 'win').length;
    const recentLosses = recentForm.filter(r => r === 'loss').length;
    const recentGames = recentForm.length;

    // ========================================
    // 포지션별 태그 (기존 synergy-badge 통합)
    // ========================================
    const positionTags = {
        top: { high: '제우스', low: '망나니' },
        jungle: { high: '오너', low: 'ㅈㄱㅊㅇ' },
        mid: { high: '페이커', low: '미드 오픈' },
        adc: { high: '구마유시', low: '숟가락' },
        support: { high: '케리아', low: '"도구"' }
    };

    const positionIcons = {
        top: 'fa-shield-alt',
        jungle: 'fa-tree',
        mid: 'fa-hat-wizard',
        adc: 'fa-crosshairs',
        support: 'fa-hands-helping'
    };

    const positionNames = {
        top: '탑',
        jungle: '정글',
        mid: '미드',
        adc: '원딜',
        support: '서폿'
    };

    const positionHighColors = {
        top: '#17a2b8',
        jungle: '#28a745',
        mid: '#ffc107',
        adc: '#dc3545',
        support: '#6f42c1'
    };

    const positionLowColors = {
        top: '#5C6B7A',
        jungle: '#4A5568',
        mid: '#78716C',
        adc: '#64748b',
        support: '#475569'
    };

    // ========================================
    // 0. MVP/ACE 누적 태그
    // ========================================
    const mvpAceRatio = getPlayerMvpAceRatio(playerName);

    // ⭐ MVP 수집가: MVP/ACE가 기록된 게임 중 MVP 비율 15% 이상
    if (mvpAceRatio.gamesWithMvpAce >= 10 && mvpAceRatio.mvpRate >= 15) {
        tags.push({
            icon: 'fa-star',
            text: 'MVP 수집가',
            color: '#FBBF24',
            title: `MVP ${mvpAceRatio.mvpCount}회 / ${mvpAceRatio.gamesWithMvpAce}게임 (${mvpAceRatio.mvpRate.toFixed(0)}%)`
        });
    }

    // 😢 위로 전문: MVP/ACE가 기록된 게임 중 ACE 비율 15% 이상
    if (mvpAceRatio.gamesWithMvpAce >= 10 && mvpAceRatio.aceRate >= 15) {
        tags.push({
            icon: 'fa-sad-tear',
            text: '위로 전문',
            color: '#60A5FA',
            title: `ACE ${mvpAceRatio.aceCount}회 / ${mvpAceRatio.gamesWithMvpAce}게임 (${mvpAceRatio.aceRate.toFixed(0)}%)`
        });
    }

    // ========================================
    // 1. 연속 기록, 최근 폼, 최근 활약 태그
    // ========================================

    // 👑 연승 괴물: 현재 3연승+
    if (streak.type === 'win' && streak.count >= 3) {
        tags.push({
            icon: 'fa-fire-alt',
            text: `${streak.count}연승`,
            color: '#F59E0B',
            title: `현재 ${streak.count}연승 중! 누가 막을 수 있을까?`
        });
    }

    // 📉 추락 중: 현재 3연패+
    if (streak.type === 'lose' && streak.count >= 3) {
        tags.push({
            icon: 'fa-arrow-trend-down',
            text: `${streak.count}연패`,
            color: '#DC2626',
            title: `현재 ${streak.count}연패 중... 반등을 기다리는 중`
        });
    }

    // 최근 10판 기준 폼 태그
    if (recentGames >= 10) {
        const winRate = (recentWins / recentGames) * 100;

        // 🔥 불타는 중: 최근 10판 승률 80%+
        if (winRate >= 80) {
            tags.push({
                icon: 'fa-fire',
                text: '불타는 중',
                color: '#FF6B35',
                title: `최근 10판 ${recentWins}승 ${recentLosses}패 (${winRate.toFixed(0)}%) - 폼이 미쳤다!`
            });
        }
        // 💀 냉동실행: 최근 10판 승률 20%-
        else if (winRate <= 20) {
            tags.push({
                icon: 'fa-skull',
                text: '냉동실행',
                color: '#4A5568',
                title: `최근 10판 ${recentWins}승 ${recentLosses}패 (${winRate.toFixed(0)}%) - 냉동실 입성`
            });
        }
        // ⚖️ 균형의 수호자: 최근 10판 승률 정확히 50%
        else if (winRate === 50) {
            tags.push({
                icon: 'fa-balance-scale',
                text: '균형의 수호자',
                color: '#8B5CF6',
                title: `최근 10판 ${recentWins}승 ${recentLosses}패 (50%) - 완벽한 균형!`
            });
        }
    }

    // 최근 10판 MVP/ACE 태그 (최근 활약)
    const recentMvpAce = getRecentMvpAceCounts(playerName);
    if (recentMvpAce.mvpCount >= 3) {
        tags.push({
            icon: 'fa-crown',
            text: '"캐리"',
            color: '#FFD700',
            title: `최근 10판 MVP ${recentMvpAce.mvpCount}회 - 캐리력 폭발!`
        });
    }
    if (recentMvpAce.aceCount >= 3) {
        tags.push({
            icon: 'fa-skull-crossbones',
            text: '난 무죄야',
            color: '#8b0000',
            title: `최근 10판 ACE ${recentMvpAce.aceCount}회 - 나만 잘했어...`
        });
    }

    // ========================================
    // 2. 포지션 태그 고승률
    // ========================================
    if (player?.positions) {
        Object.entries(player.positions).forEach(([pos, data]) => {
            const games = (data.wins || 0) + (data.losses || 0);
            if (games >= 5) {
                const winRate = games > 0 ? (data.wins / games) * 100 : 0;
                const posTag = positionTags[pos];
                const icon = positionIcons[pos] || 'fa-gamepad';
                const posName = positionNames[pos] || pos;

                if (posTag && winRate >= 65) {
                    tags.push({
                        icon: icon,
                        text: posTag.high,
                        color: positionHighColors[pos] || '#FBBF24',
                        title: `${posName} 승률 65% 이상 (${winRate.toFixed(0)}%, ${games}판)`
                    });
                }
            }
        });
    }

    // ========================================
    // 3. 포지션 태그 저승률
    // ========================================
    if (player?.positions) {
        Object.entries(player.positions).forEach(([pos, data]) => {
            const games = (data.wins || 0) + (data.losses || 0);
            if (games >= 5) {
                const winRate = games > 0 ? (data.wins / games) * 100 : 0;
                const posTag = positionTags[pos];
                const icon = positionIcons[pos] || 'fa-gamepad';
                const posName = positionNames[pos] || pos;

                if (posTag && winRate <= 35) {
                    tags.push({
                        icon: icon,
                        text: posTag.low,
                        color: positionLowColors[pos] || '#64748b',
                        title: `${posName} 승률 35% 이하 (${winRate.toFixed(0)}%, ${games}판)`
                    });
                }
            }
        });
    }

    // ========================================
    // 4. 상대/시너지 관련 태그 (최근 10판 기준)
    // ========================================

    // 상대/시너지 관련 태그 계산 (최근 10판 기준)
    if (gameData?.players && totalGames >= 5) {
        const hunters = [];      // 사냥꾼 (상대 승률 80%+)
        const preys = [];        // 개 (상대 승률 20%-)
        const goodDuos = [];     // 찰떡 (팀 승률 80%+)
        const badDuos = [];      // 상극 (팀 승률 20%-)

        gameData.players.forEach(otherPlayer => {
            if (otherPlayer.name.toLowerCase() === playerName.toLowerCase()) return;

            // 최근 10판 상대 전적
            const rivalry = analyzeRecentRivalry(playerName, otherPlayer.name, 10);
            if (rivalry.games >= 5) {
                // 🎯 [이름] 사냥꾼: 최근 10판 중 80%+
                if (rivalry.winRate >= 80) {
                    hunters.push({ name: otherPlayer.name, ...rivalry });
                }
                // 🐕 [이름]의 개: 최근 10판 중 20%-
                if (rivalry.winRate <= 20) {
                    preys.push({ name: otherPlayer.name, ...rivalry });
                }
            }

            // 최근 10판 팀 시너지
            const synergy = analyzeRecentTeamSynergy(playerName, otherPlayer.name, 10);
            if (synergy.games >= 5) {
                // 🤝 [이름]와 찰떡: 최근 10판 중 80%+
                if (synergy.winRate >= 80) {
                    goodDuos.push({ name: otherPlayer.name, ...synergy });
                }
                // 💔 [이름]와 상극: 최근 10판 중 20%-
                if (synergy.winRate <= 20) {
                    badDuos.push({ name: otherPlayer.name, ...synergy });
                }
            }
        });

        // 모든 사냥꾼 태그 추가
        hunters.forEach(hunter => {
            tags.push({
                icon: 'fa-crosshairs',
                text: `${hunter.name} 사냥꾼`,
                color: '#10B981',
                title: `vs ${hunter.name}: ${hunter.wins}승 ${hunter.losses}패 (${hunter.winRate.toFixed(0)}%)`
            });
        });

        // 모든 개 태그 추가
        preys.forEach(prey => {
            tags.push({
                icon: 'fa-dog',
                text: `${prey.name}의 개`,
                color: '#8B5CF6',
                title: `vs ${prey.name}: ${prey.wins}승 ${prey.losses}패 (${prey.winRate.toFixed(0)}%)`
            });
        });

        // 모든 찰떡 태그 추가
        goodDuos.forEach(duo => {
            tags.push({
                icon: 'fa-handshake',
                text: `${duo.name}${getParticle(duo.name, ['와', '과'])} 찰떡`,
                color: '#3B82F6',
                title: `+ ${duo.name}: ${duo.wins}승 ${duo.losses}패 (${duo.winRate.toFixed(0)}%)`
            });
        });

        // 모든 상극 태그 추가
        badDuos.forEach(duo => {
            tags.push({
                icon: 'fa-heart-broken',
                text: `${duo.name}${getParticle(duo.name, ['와', '과'])} 상극`,
                color: '#EF4444',
                title: `+ ${duo.name}: ${duo.wins}승 ${duo.losses}패 (${duo.winRate.toFixed(0)}%)`
            });
        });
    }

    // 태그가 없으면 "태그 없음" 태그 추가 (용어집에는 표시 안됨)
    if (tags.length === 0) {
        tags.push({
            icon: 'fa-times',
            text: '태그 없음',
            color: '#888888',
            title: '태그 없음. 열심히 해서 태그를 얻어봐요!',
            isNoTag: true  // 용어집에서 제외하기 위한 플래그
        });
    }

    return tags;
}

// 태그 HTML 생성
export function getPlayerTagsHtml(playerName, maxTags = 2) {
    const tags = getPlayerTags(playerName);
    if (tags.length === 0) return ''; // 이 경우는 발생하지 않음 (태그 없음이 항상 추가되므로)

    // 우선순위: 연승/연패 > 핫/콜드 > MVP/ACE > 상대/시너지
    const priorityTags = tags.slice(0, maxTags);

    // 특별 애니메이션 클래스 매핑
    const getSpecialClass = (icon) => {
        if (icon === 'fa-fire' || icon === 'fa-crown' || icon === 'fa-hat-wizard') return 'tag-fire';
        if (icon === 'fa-skull' || icon === 'fa-poop' || icon === 'fa-chart-line-down') return 'tag-cold';
        if (icon === 'fa-star') return 'tag-mvp';
        return '';
    };

    return `
        <div class="player-tags">
            ${priorityTags.map(tag => `
                <span class="player-tag ${getSpecialClass(tag.icon)}" style="background: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40;" data-tooltip="${tag.title}">
                    <i class="fas ${tag.icon} me-1"></i>${tag.text}
                </span>
            `).join('')}
        </div>
    `;
}

// 모든 태그 HTML 생성 (상세 정보용)
export function getAllPlayerTagsHtml(playerName) {
    const tags = getPlayerTags(playerName);
    if (tags.length === 0) return '<p class="text-muted mb-0">획득한 태그가 없습니다</p>';

    // 특별 애니메이션 클래스 매핑
    const getSpecialClass = (icon) => {
        if (icon === 'fa-fire' || icon === 'fa-crown' || icon === 'fa-hat-wizard') return 'tag-fire';
        if (icon === 'fa-skull' || icon === 'fa-poop' || icon === 'fa-chart-line-down') return 'tag-cold';
        if (icon === 'fa-star') return 'tag-mvp';
        return '';
    };

    return `
        <div class="player-tags-all d-flex flex-wrap gap-2">
            ${tags.map(tag => `
                <span class="player-tag player-tag-large ${getSpecialClass(tag.icon)}" style="background: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40;" data-tooltip="${tag.title}">
                    <i class="fas ${tag.icon} me-1"></i>${tag.text}
                </span>
            `).join('')}
        </div>
    `;
}

// ========================================
// 태그 용어집 (Tag Glossary)
// ========================================

// 모든 태그 정의 반환
export function getTagDefinitions() {
    return [
        // 포지션 태그 - 높은 승률
        {
            category: '포지션 태그 (고승률)',
            tags: [
                { text: '제우스', icon: 'fa-shield-alt', color: '#17a2b8', description: '탑 포지션 승률 65% 이상 (5판 이상)' },
                { text: '오너', icon: 'fa-tree', color: '#28a745', description: '정글 포지션 승률 65% 이상 (5판 이상)' },
                { text: '페이커', icon: 'fa-hat-wizard', color: '#ffc107', description: '미드 포지션 승률 65% 이상 (5판 이상)' },
                { text: '구마유시', icon: 'fa-crosshairs', color: '#dc3545', description: '원딜 포지션 승률 65% 이상 (5판 이상)' },
                { text: '케리아', icon: 'fa-hands-helping', color: '#6f42c1', description: '서폿 포지션 승률 65% 이상 (5판 이상)' }
            ]
        },
        // 포지션 태그 - 낮은 승률
        {
            category: '포지션 태그 (저승률)',
            tags: [
                { text: '망나니', icon: 'fa-shield-alt', color: '#5C6B7A', description: '탑 포지션 승률 35% 이하 (5판 이상)' },
                { text: 'ㅈㄱㅊㅇ', icon: 'fa-tree', color: '#4A5568', description: '정글 포지션 승률 35% 이하 (5판 이상)' },
                { text: '미드 오픈', icon: 'fa-hat-wizard', color: '#78716C', description: '미드 포지션 승률 35% 이하 (5판 이상)' },
                { text: '숟가락', icon: 'fa-crosshairs', color: '#64748b', description: '원딜 포지션 승률 35% 이하 (5판 이상)' },
                { text: '"도구"', icon: 'fa-hands-helping', color: '#475569', description: '서폿 포지션 승률 35% 이하 (5판 이상)' }
            ]
        },
        // 최근 캐리 태그
        {
            category: '최근 활약',
            tags: [
                { text: '"캐리"', icon: 'fa-crown', color: '#FFD700', description: '최근 10판에서 MVP 3회 이상' },
                { text: '난 무죄야', icon: 'fa-skull-crossbones', color: '#8b0000', description: '최근 10판에서 ACE 3회 이상' }
            ]
        },
        // 최근 폼 태그
        {
            category: '최근 폼',
            tags: [
                { text: '불타는 중', icon: 'fa-fire', color: '#FF6B35', description: '최근 10판 승률 80% 이상' },
                { text: '냉동실행', icon: 'fa-skull', color: '#4A5568', description: '최근 10판 승률 20% 이하' },
                { text: '균형의 수호자', icon: 'fa-balance-scale', color: '#8B5CF6', description: '최근 10판 승률 정확히 50%' }
            ]
        },
        // 연승/연패 태그
        {
            category: '연속 기록',
            tags: [
                { text: 'N연승', icon: 'fa-fire-alt', color: '#FFD700', description: '현재 3연승 이상 진행 중' },
                { text: 'N연패', icon: 'fa-chart-line-down', color: '#DC2626', description: '현재 3연패 이상 진행 중' }
            ]
        },
        // MVP/ACE 누적 태그
        {
            category: 'MVP/ACE 누적',
            tags: [
                { text: 'MVP 수집가', icon: 'fa-star', color: '#FBBF24', description: 'MVP/ACE 기록된 게임 중 MVP 비율 15% 이상 (10게임 이상)' },
                { text: '위로 전문', icon: 'fa-sad-tear', color: '#60A5FA', description: 'MVP/ACE 기록된 게임 중 ACE 비율 15% 이상 (10게임 이상)' }
            ]
        },
        // 상대/시너지 태그
        {
            category: '상대/시너지 (최근 10판)',
            tags: [
                { text: '[상대] 사냥꾼', icon: 'fa-crosshairs', color: '#10B981', description: '최근 10판 중 특정 상대와 5판 이상, 승률 80% 이상' },
                { text: '[상대]의 개', icon: 'fa-dog', color: '#8B5CF6', description: '최근 10판 중 특정 상대와 5판 이상, 승률 20% 이하' },
                { text: '[파트너]와 찰떡', icon: 'fa-handshake', color: '#3B82F6', description: '최근 10판 중 특정 플레이어와 같은 팀 5판 이상, 승률 80% 이상' },
                { text: '[파트너]와 상극', icon: 'fa-heart-broken', color: '#EF4444', description: '최근 10판 중 특정 플레이어와 같은 팀 5판 이상, 승률 20% 이하' }
            ]
        }
    ];
}

// 모든 플레이어의 태그 매핑 반환
export function getPlayersWithTags() {
    if (!gameData?.players) return {};

    const tagToPlayers = {};

    gameData.players.forEach(player => {
        const playerTags = getPlayerTags(player.name);
        playerTags.forEach(tag => {
            // "태그 없음"은 용어집에서 제외
            if (tag.isNoTag) return;

            // 태그 텍스트를 일반화 (연승/연패 숫자 제거, 이름 제거)
            let normalizedText = tag.text;
            if (/^\d+연승$/.test(tag.text)) normalizedText = 'N연승';
            if (/^\d+연패$/.test(tag.text)) normalizedText = 'N연패';
            if (tag.text.includes('사냥꾼')) normalizedText = '[상대] 사냥꾼';
            if (tag.text.includes('의 개')) normalizedText = '[상대]의 개';
            if (tag.text.includes('찰떡')) normalizedText = '[파트너]와 찰떡';
            if (tag.text.includes('상극')) normalizedText = '[파트너]와 상극';

            if (!tagToPlayers[normalizedText]) {
                tagToPlayers[normalizedText] = [];
            }
            tagToPlayers[normalizedText].push({
                name: player.name,
                originalTag: tag.text,
                title: tag.title
            });
        });
    });

    return tagToPlayers;
}

// 태그 용어집 HTML 렌더링
export function renderTagGlossary() {
    const definitions = getTagDefinitions();
    const playersWithTags = getPlayersWithTags();

    return `
        <div class="tag-glossary card mb-4" style="background: var(--bg-secondary, rgba(30, 30, 35, 0.8)); border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));">
            <div class="card-body">
                <h5 class="card-title mb-3">
                    <i class="fas fa-tags me-2" style="color: var(--accent-primary, #8b5cf6);"></i>
                    태그 용어집
                </h5>
                <p class="text-muted small mb-3">각 태그를 클릭하면 해당 태그를 가진 플레이어를 확인할 수 있습니다.</p>

                <div class="accordion" id="tagGlossaryAccordion">
                    ${definitions.map((category, catIndex) => {
                        return `
                            <div class="accordion-item" style="background: transparent; border-color: var(--border-subtle, rgba(255, 255, 255, 0.1));">
                                <h2 class="accordion-header">
                                    <button class="accordion-button ${catIndex === 0 ? '' : 'collapsed'}" type="button"
                                            data-bs-toggle="collapse" data-bs-target="#tagCategory${catIndex}"
                                            style="background: var(--bg-tertiary, rgba(40, 40, 45, 0.8)); color: var(--text-primary, #fafafa);">
                                        ${category.category}
                                        <span class="badge bg-secondary ms-2">${category.tags.length}개</span>
                                    </button>
                                </h2>
                                <div id="tagCategory${catIndex}" class="accordion-collapse collapse ${catIndex === 0 ? 'show' : ''}"
                                     data-bs-parent="#tagGlossaryAccordion">
                                    <div class="accordion-body" style="background: var(--bg-secondary, rgba(30, 30, 35, 0.5));">
                                        ${category.tags.map(tag => {
                                            const players = playersWithTags[tag.text] || [];
                                            return `
                                                <div class="tag-glossary-item mb-3 p-3" style="background: var(--bg-tertiary, rgba(40, 40, 45, 0.5)); border-radius: 8px;">
                                                    <div class="d-flex align-items-center gap-2 mb-2">
                                                        <span class="player-tag" style="background: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40;">
                                                            <i class="fas ${tag.icon} me-1"></i>${tag.text}
                                                        </span>
                                                        <span class="badge bg-secondary">${players.length}명</span>
                                                    </div>
                                                    <p class="text-muted small mb-2">${tag.description}</p>
                                                    ${players.length > 0 ? `
                                                        <div class="tag-players d-flex flex-wrap gap-1">
                                                            ${players.map(p => `
                                                                <button class="btn btn-sm btn-outline-light tag-player-btn"
                                                                        onclick="window.selectPlayerFromGlossary('${p.name}')"
                                                                        data-tooltip="${p.originalTag}: ${p.title}">
                                                                    ${p.name}
                                                                </button>
                                                            `).join('')}
                                                        </div>
                                                    ` : '<p class="text-muted small mb-0 fst-italic">해당 태그를 가진 플레이어가 없습니다</p>'}
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}
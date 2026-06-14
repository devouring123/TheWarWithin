import CONFIG from './config.js';
import { parsePercentage, safeInt } from './utils.js';

// 통계 계산 (평균 게임/플레이어 제거)
export function calculateStatistics(players) {
    if (!players.length) return {};
    
    const totalPlayerGames = players.reduce((sum, p) => sum + p.total_games, 0);
    const actualTotalGames = Math.round(totalPlayerGames / 10);
    
    const positions = ['top', 'jungle', 'mid', 'adc', 'support'];
    const positionStats = {};
    
    positions.forEach(pos => {
        const posGames = players.reduce((sum, p) => sum + p.positions[pos].games, 0);
        const posWins = players.reduce((sum, p) => sum + p.positions[pos].wins, 0);
        
        positionStats[pos] = {
            total_games: posGames,
            total_wins: posWins,
            winrate: posGames > 0 ? posWins / posGames : 0
        };
    });
    
    return {
        total_games: actualTotalGames,
        position_stats: positionStats
    };
}

// Google Sheets API 데이터 파싱
export function parseGoogleSheetsData(values) {
    if (!values || values.length <= 2) {
        throw new Error('스프레드시트에 데이터가 없습니다.');
    }
    
    // 첫 2행은 헤더로 처리
    const dataRows = values.slice(2);
    const players = [];
    
    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length === 0 || !row[0] || row[0].trim() === '') {
            continue;
        }
        
        // 패딩으로 최소 21개 열 보장
        while (row.length < 21) {
            row.push('');
        }
        
        try {
            const name = row[0].trim();
            const tier = row[1] ? row[1].trim() : '';
            const totalGames = safeInt(row[2]);
            const overallWinrate = parsePercentage(row[3]);
            
            if (totalGames === 0) continue;
            
            const totalWins = safeInt(row[9]) || Math.round(totalGames * overallWinrate);
            const totalLosses = safeInt(row[10]) || (totalGames - totalWins);
            
            // 포지션별 데이터
            const positions = {
                top: {
                    winrate: parsePercentage(row[4]),
                    wins: safeInt(row[11]),
                    losses: safeInt(row[16]),
                    games: safeInt(row[11]) + safeInt(row[16])
                },
                jungle: {
                    winrate: parsePercentage(row[5]),
                    wins: safeInt(row[12]),
                    losses: safeInt(row[17]),
                    games: safeInt(row[12]) + safeInt(row[17])
                },
                mid: {
                    winrate: parsePercentage(row[6]),
                    wins: safeInt(row[13]),
                    losses: safeInt(row[18]),
                    games: safeInt(row[13]) + safeInt(row[18])
                },
                adc: {
                    winrate: parsePercentage(row[7]),
                    wins: safeInt(row[14]),
                    losses: safeInt(row[19]),
                    games: safeInt(row[14]) + safeInt(row[19])
                },
                support: {
                    winrate: parsePercentage(row[8]),
                    wins: safeInt(row[15]),
                    losses: safeInt(row[20]),
                    games: safeInt(row[15]) + safeInt(row[20])
                }
            };
            
            players.push({
                name,
                tier,
                total_games: totalGames,
                overall_winrate: overallWinrate,
                positions,
                total_wins: totalWins,
                total_losses: totalLosses
            });
            
        } catch (e) {
            console.warn(`행 ${i + 3} 처리 중 오류:`, e);
        }
    }
    
    // 통계 계산
    const statistics = calculateStatistics(players);
    
    return {
        last_updated: new Date().toISOString(),
        total_players: players.length,
        players,
        statistics,
        source: 'google_sheets'
    };
}

// CSV 데이터 파싱 (백업 방법)
export function parseCSVData(csvData) {
    const lines = csvData.split('\n');
    const values = lines.map(line => {
        // 간단한 CSV 파싱 (따옴표 처리 포함)
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }).filter(row => row.length > 0);
    
    return parseGoogleSheetsData(values);
}

// Google Sheets 기록 시트 데이터 파싱
export function parseRecordsCSV(csvData) {
    console.log('Raw CSV data:', csvData.substring(0, 1000) + '...'); // 처음 1000자 로그
    
    const lines = csvData.split('\n');
    console.log('Total lines:', lines.length);
    
    // CSV 파싱 함수
    function parseCSVLine(line) {
        const columns = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                columns.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        columns.push(current.trim());
        return columns;
    }
    
    // 모든 라인을 파싱하여 2차원 배열로 변환
    const parsedLines = lines.map(line => parseCSVLine(line)).filter(line => line.length > 1);
    console.log('Parsed lines count:', parsedLines.length);
    console.log('First few lines:', parsedLines.slice(0, 5));
    
    if (parsedLines.length < 12) {
        console.log('Not enough lines for game data');
        return [];
    }
    
    // 데이터 구조 파악
    // 첫 번째 행: 날짜들
    // 2-6행: 승리팀 (탑, 정글, 미드, 원딜, 서폿)
    // 7행: "승/패" 구분자 (건너뛰기)
    // 8-12행: 패배팀 (탑, 정글, 미드, 원딜, 서폿)
    // 13행: 빈칸 (건너뛰기)
    // 14행: MVP
    // 15행: ACE

    const dateRow = parsedLines[0];
    const winTeamRows = parsedLines.slice(1, 6); // 2-6행
    const loseTeamRows = parsedLines.slice(7, 12); // 8-12행
    const mvpRow = parsedLines[13] || []; // 14행 (MVP)
    const aceRow = parsedLines[14] || []; // 15행 (ACE)

    console.log('Date row:', dateRow);
    console.log('Win team rows:', winTeamRows);
    console.log('Lose team rows:', loseTeamRows);
    console.log('MVP row:', mvpRow);
    console.log('ACE row:', aceRow);

    const gameRecords = [];

    // 각 열(게임)을 순회
    for (let col = 1; col < dateRow.length; col++) {
        const date = dateRow[col];
        if (!date || !date.trim()) continue;

        const winners = winTeamRows.map(row => row[col]).filter(name => name && name.trim()).map(name => name.trim().toLowerCase());
        const losers = loseTeamRows.map(row => row[col]).filter(name => name && name.trim()).map(name => name.trim().toLowerCase());
        const mvp = mvpRow[col] ? mvpRow[col].trim().toLowerCase() : '';
        const ace = aceRow[col] ? aceRow[col].trim().toLowerCase() : '';

        console.log(`Game ${col}: date=${date}, winners=${winners}, losers=${losers}, mvp=${mvp}, ace=${ace}`);

        if (winners.length > 0 && losers.length > 0) {
            gameRecords.push({ date, winners, losers, mvp, ace });
        }
    }

    console.log('Final parsed records count:', gameRecords.length);
    console.log('Final records:', gameRecords);
    return gameRecords;
}

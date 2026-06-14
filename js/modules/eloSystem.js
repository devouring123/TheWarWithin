// ELO 기반 승률 예측 시스템
// 5대5 팀전 게임의 승률을 계산하는 모듈

// ELO 시스템 상수
const ELO_CONSTANTS = {
    DEFAULT_RATING: 1000,           // 기본 ELO 레이팅 (골드 기준)
    K_FACTOR: 32,                   // K-팩터 (변동폭)
    SCALING_FACTOR: 400,            // 레이팅 차이 스케일링
    PERSONAL_ADJUSTMENT_FACTOR: 800, // 개인 MMR과 팀 평균 차이에 따른 보정 완충값
    MIN_PERSONAL_MULTIPLIER: 0.5,    // 개인 보정 최소 배율
    MAX_PERSONAL_MULTIPLIER: 1.5,    // 개인 보정 최대 배율
    LANE_ADJUSTMENT_FACTOR: 10000,   // 라인 MMR 차이 보정 완충값 (100점 = 1%)
    MIN_LANE_FACTOR: 0.95,           // 라인 보정 최소 배율
    MAX_LANE_FACTOR: 1.05,           // 라인 보정 최대 배율
    MIN_RATING: 400,                // 최소 레이팅
    MAX_RATING: 2200                // 최대 레이팅
};

const POSITION_KEYS = ['top', 'jungle', 'mid', 'adc', 'support'];

// LoL 티어별 기본 MMR (Riot의 hidden MMR은 비공개이므로 골드 1000 기준 앱 내부값으로 사용)
const TIER_BASE_RATINGS = {
    '아이언': 700,
    'iron': 700,
    '브론즈': 800,
    'bronze': 800,
    '실버': 900,
    'silver': 900,
    '골드': 1000,
    'gold': 1000,
    '플래티넘': 1100,
    '플레': 1100,
    '플': 1100,
    'platinum': 1100,
    '에메랄드': 1200,
    '에': 1200,
    'emerald': 1200,
    '다이아몬드': 1350,
    '다이아': 1350,
    '다': 1350,
    'diamond': 1350,
    '마스터': 1550,
    '마': 1550,
    'master': 1550,
    '그랜드마스터': 1750,
    '그마': 1750,
    'grandmaster': 1750,
    '챌린저': 1900,
    '챌': 1900,
    'challenger': 1900,
    '언랭크': 1000,
    '언랭': 1000,
    '언': 1000,
    'unranked': 1000
};

// 포지션별 영향도 가중치 (미드 > 정글 > 서폿 > 탑 > 원딜)
const POSITION_WEIGHTS = {
    mid: 0.26,      // 미드 (1위)
    jungle: 0.24,   // 정글 (2위)
    support: 0.20,  // 서폿 (3위)
    top: 0.16,      // 탑 (4위)
    adc: 0.14       // 원딜 (5위)
};

// ELO 레이팅 관리 클래스
class EloRatingManager {
    constructor() {
        this.playerRatings = new Map(); // 플레이어별 ELO 레이팅 저장
        this.gameRecords = [];          // 게임 기록
    }

    // 플레이어 ELO 레이팅 초기화 또는 가져오기
    getPlayerRating(playerName) {
        if (!this.playerRatings.has(playerName)) {
            this.playerRatings.set(playerName, ELO_CONSTANTS.DEFAULT_RATING);
        }
        return this.playerRatings.get(playerName);
    }

    // 플레이어 ELO 레이팅 설정
    setPlayerRating(playerName, rating) {
        const clampedRating = Math.max(
            ELO_CONSTANTS.MIN_RATING,
            Math.min(ELO_CONSTANTS.MAX_RATING, rating)
        );
        this.playerRatings.set(playerName, clampedRating);
    }

    // 플레이어 티어 기반 기본 MMR 계산
    getDefaultRatingForTier(tier) {
        if (!tier) return ELO_CONSTANTS.DEFAULT_RATING;

        const normalizedTier = String(tier).trim().toLowerCase().replace(/\s/g, '');
        return TIER_BASE_RATINGS[normalizedTier] || ELO_CONSTANTS.DEFAULT_RATING;
    }

    // 모든 플레이어 레이팅 가져오기
    getAllRatings() {
        return Object.fromEntries(this.playerRatings);
    }

    // 기존 게임 데이터로부터 ELO 레이팅 계산
    initializeFromGameData(gameData, gameRecords) {
        console.log('ELO 시스템 초기화 시작...');
        
        // 모든 플레이어 기본 레이팅으로 초기화
        gameData.players.forEach(player => {
            this.setPlayerRating(player.name, this.getDefaultRatingForTier(player.tier));
        });

        // 게임 기록을 시간순으로 처리하여 ELO 계산
        if (gameRecords && gameRecords.length > 0) {
            // 게임 기록을 날짜순으로 정렬 (만약 timestamp가 있다면)
            const sortedRecords = [...gameRecords].sort((a, b) => {
                if (a.timestamp && b.timestamp) {
                    return new Date(a.timestamp) - new Date(b.timestamp);
                }
                return 0; // 타임스탬프가 없으면 원래 순서 유지
            });

            sortedRecords.forEach(record => {
                if (record.winners && record.losers && 
                    record.winners.length === 5 && record.losers.length === 5) {
                    this.updateRatingsFromGameResult(record.winners, record.losers);
                }
            });
        }

        console.log('ELO 초기화 완료. 현재 레이팅:', this.getAllRatings());
    }
}

// ELO 계산 핵심 함수들
class EloCalculator {
    // 두 팀의 예상 승률 계산 (기본 ELO 공식)
    static calculateBasicWinProbability(team1Rating, team2Rating) {
        const ratingDiff = team2Rating - team1Rating;
        return 1 / (1 + Math.pow(10, ratingDiff / ELO_CONSTANTS.SCALING_FACTOR));
    }

    // 팀의 평균 ELO 레이팅 계산
    static calculateTeamAverageRating(teamPlayers, ratingManager) {
        let totalRating = 0;
        let validPlayers = 0;

        teamPlayers.forEach(playerName => {
            if (playerName && playerName.trim()) {
                totalRating += ratingManager.getPlayerRating(playerName);
                validPlayers++;
            }
        });

        return validPlayers > 0 ? totalRating / validPlayers : ELO_CONSTANTS.DEFAULT_RATING;
    }

    // 포지션 고려한 팀 레이팅 계산 (가중평균)
    static calculateWeightedTeamRating(teamPlayers, ratingManager, positions = null) {
        if (!positions || positions.length !== 5) {
            // 포지션 정보가 없으면 단순 평균 사용
            return this.calculateTeamAverageRating(teamPlayers, ratingManager);
        }

        let weightedSum = 0;
        let totalWeight = 0;
        const positionKeys = ['top', 'jungle', 'mid', 'adc', 'support'];

        teamPlayers.forEach((playerName, index) => {
            if (playerName && playerName.trim() && index < 5) {
                const weight = POSITION_WEIGHTS[positionKeys[index]] || 0.2;
                const rating = ratingManager.getPlayerRating(playerName);
                
                weightedSum += rating * weight;
                totalWeight += weight;
            }
        });

        return totalWeight > 0 ? weightedSum / totalWeight : ELO_CONSTANTS.DEFAULT_RATING;
    }

    // 팀 간 승률 계산 (포지션 미고려)
    static calculateBasicTeamWinRate(team1Players, team2Players, ratingManager) {
        const team1Rating = this.calculateTeamAverageRating(team1Players, ratingManager);
        const team2Rating = this.calculateTeamAverageRating(team2Players, ratingManager);
        
        const team1WinProb = this.calculateBasicWinProbability(team1Rating, team2Rating);
        
        return {
            team1WinRate: team1WinProb * 100,
            team2WinRate: (1 - team1WinProb) * 100,
            team1Rating: team1Rating,
            team2Rating: team2Rating,
            ratingDifference: team1Rating - team2Rating
        };
    }

    // 팀 간 승률 계산 (포지션 고려)
    static calculatePositionalTeamWinRate(team1Players, team2Players, ratingManager, team1Positions = null, team2Positions = null) {
        const team1Rating = this.calculateWeightedTeamRating(team1Players, ratingManager, team1Positions);
        const team2Rating = this.calculateWeightedTeamRating(team2Players, ratingManager, team2Positions);
        
        const team1WinProb = this.calculateBasicWinProbability(team1Rating, team2Rating);
        
        return {
            team1WinRate: team1WinProb * 100,
            team2WinRate: (1 - team1WinProb) * 100,
            team1Rating: team1Rating,
            team2Rating: team2Rating,
            ratingDifference: team1Rating - team2Rating,
            isPositional: true
        };
    }
}

// 메인 ELO 시스템 클래스
class EloSystem {
    constructor() {
        this.ratingManager = new EloRatingManager();
        this.isInitialized = false;
    }

    // 게임 데이터로 시스템 초기화
    initialize(gameData, gameRecords) {
        this.ratingManager.initializeFromGameData(gameData, gameRecords);
        this.isInitialized = true;
        console.log('ELO 시스템 초기화 완료');
    }

    // 포지션 미고려 팀 승률 계산
    calculateBasicWinRate(team1Players, team2Players) {
        if (!this.isInitialized) {
            console.warn('ELO 시스템이 초기화되지 않았습니다. 기본값 사용.');
            return {
                team1WinRate: 50,
                team2WinRate: 50,
                team1Rating: ELO_CONSTANTS.DEFAULT_RATING,
                team2Rating: ELO_CONSTANTS.DEFAULT_RATING,
                ratingDifference: 0,
                error: 'System not initialized'
            };
        }

        return EloCalculator.calculateBasicTeamWinRate(
            team1Players, 
            team2Players, 
            this.ratingManager
        );
    }

    // 포지션 고려 팀 승률 계산
    calculatePositionalWinRate(team1Players, team2Players, team1Positions = null, team2Positions = null) {
        if (!this.isInitialized) {
            console.warn('ELO 시스템이 초기화되지 않았습니다. 기본값 사용.');
            return {
                team1WinRate: 50,
                team2WinRate: 50,
                team1Rating: ELO_CONSTANTS.DEFAULT_RATING,
                team2Rating: ELO_CONSTANTS.DEFAULT_RATING,
                ratingDifference: 0,
                isPositional: true,
                error: 'System not initialized'
            };
        }

        return EloCalculator.calculatePositionalTeamWinRate(
            team1Players, 
            team2Players, 
            this.ratingManager,
            team1Positions,
            team2Positions
        );
    }

    // 게임 결과로 ELO 업데이트
    updateRatingsFromGameResult(winners, losers) {
        if (!this.isInitialized) {
            console.warn('ELO 시스템이 초기화되지 않았습니다.');
            return {};
        }

        return this.ratingManager.updateRatingsFromGameResult(winners, losers);
    }

    // 플레이어 개별 레이팅 조회
    getPlayerRating(playerName) {
        return this.ratingManager.getPlayerRating(playerName);
    }

    // 모든 플레이어 레이팅 조회
    getAllRatings() {
        return this.ratingManager.getAllRatings();
    }

    // 시스템 상태 확인
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            totalPlayers: this.ratingManager.playerRatings.size,
            averageRating: this.calculateAverageRating(),
            constants: ELO_CONSTANTS
        };
    }

    // 전체 평균 레이팅 계산
    calculateAverageRating() {
        const ratings = Array.from(this.ratingManager.playerRatings.values());
        return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : ELO_CONSTANTS.DEFAULT_RATING;
    }
}

function getValidPlayerNames(players) {
    return players.filter(playerName => playerName && playerName.trim());
}

function clampPersonalMultiplier(multiplier) {
    return Math.max(
        ELO_CONSTANTS.MIN_PERSONAL_MULTIPLIER,
        Math.min(ELO_CONSTANTS.MAX_PERSONAL_MULTIPLIER, multiplier)
    );
}

function clampLaneFactor(multiplier) {
    return Math.max(
        ELO_CONSTANTS.MIN_LANE_FACTOR,
        Math.min(ELO_CONSTANTS.MAX_LANE_FACTOR, multiplier)
    );
}

function roundRatingDelta(delta) {
    return Math.round(delta * 100) / 100;
}

function roundMultiplier(multiplier) {
    return Math.round((multiplier + Number.EPSILON) * 100) / 100;
}

function formatSignedNumber(value, digits = 0) {
    const rounded = Number(value).toFixed(digits);
    return value > 0 ? `+${rounded}` : rounded;
}

function getLaneContext(ratingManager, playerName, teamPlayers, opponentPlayers) {
    if (teamPlayers.length !== 5 || opponentPlayers.length !== 5) {
        return {
            position: null,
            laneOpponent: null,
            laneOpponentRating: null,
            laneDiff: 0,
            hasLaneInfo: false
        };
    }

    const playerIndex = teamPlayers.indexOf(playerName);
    if (playerIndex < 0 || playerIndex >= 5) {
        return {
            position: null,
            laneOpponent: null,
            laneOpponentRating: null,
            laneDiff: 0,
            hasLaneInfo: false
        };
    }

    const laneOpponent = opponentPlayers[playerIndex];
    const laneOpponentRating = ratingManager.getPlayerRating(laneOpponent);
    const playerRating = ratingManager.getPlayerRating(playerName);

    return {
        position: POSITION_KEYS[playerIndex],
        laneOpponent,
        laneOpponentRating,
        laneDiff: Math.round(playerRating - laneOpponentRating),
        hasLaneInfo: true
    };
}

function calculatePlayerChange(ratingManager, playerName, teamRating, opponentTeamRating, baseDelta, isWinner, laneContext) {
    const before = ratingManager.getPlayerRating(playerName);
    const ratingGapFromTeam = before - teamRating;
    const rawMultiplier = isWinner
        ? 1 - (ratingGapFromTeam / ELO_CONSTANTS.PERSONAL_ADJUSTMENT_FACTOR)
        : 1 + (ratingGapFromTeam / ELO_CONSTANTS.PERSONAL_ADJUSTMENT_FACTOR);
    const personalMultiplier = roundMultiplier(clampPersonalMultiplier(rawMultiplier));
    const laneResponsibility = laneContext.hasLaneInfo
        ? (isWinner ? -laneContext.laneDiff : laneContext.laneDiff)
        : 0;
    const rawLaneFactor = 1 + laneResponsibility / ELO_CONSTANTS.LANE_ADJUSTMENT_FACTOR;
    const laneFactor = roundMultiplier(clampLaneFactor(rawLaneFactor));
    const multiplier = roundMultiplier(personalMultiplier * laneFactor);
    const exactDelta = baseDelta * multiplier;
    const delta = roundRatingDelta(exactDelta);
    const finalDeltaDisplay = Math.round(delta);
    const teamDiff = Math.round(opponentTeamRating - teamRating);
    const playerTeamDiff = Math.round(before - teamRating);

    return {
        before,
        after: before + delta,
        delta,
        multiplier,
        exactDelta: roundRatingDelta(exactDelta),
        baseDelta: roundRatingDelta(baseDelta),
        personalMultiplier,
        laneFactor,
        teamDiff,
        playerTeamDiff,
        position: laneContext.position,
        laneOpponent: laneContext.laneOpponent,
        laneOpponentRating: laneContext.laneOpponentRating,
        laneDiff: laneContext.laneDiff,
        hasLaneInfo: laneContext.hasLaneInfo,
        formulaText: `기본 ${formatSignedNumber(baseDelta, 2)} × 개인 ${personalMultiplier.toFixed(2)} × 라인 ${laneFactor.toFixed(2)} = ${formatSignedNumber(baseDelta, 2)} × 최종배율 ${multiplier.toFixed(2)} = ${formatSignedNumber(exactDelta, 2)} => ${formatSignedNumber(finalDeltaDisplay)}`
        };
}

function calculatePersonalizedRatingChanges(ratingManager, winners, losers) {
    const validWinners = getValidPlayerNames(winners);
    const validLosers = getValidPlayerNames(losers);
    const winnersRating = EloCalculator.calculateTeamAverageRating(validWinners, ratingManager);
    const losersRating = EloCalculator.calculateTeamAverageRating(validLosers, ratingManager);
    const expectedWinnerProb = EloCalculator.calculateBasicWinProbability(winnersRating, losersRating);
    const expectedLoserProb = 1 - expectedWinnerProb;
    const winnerBaseDelta = ELO_CONSTANTS.K_FACTOR * (1 - expectedWinnerProb);
    const loserBaseDelta = ELO_CONSTANTS.K_FACTOR * (0 - expectedLoserProb);
    const changes = {};

    validWinners.forEach(playerName => {
        const laneContext = getLaneContext(ratingManager, playerName, validWinners, validLosers);
        changes[playerName] = calculatePlayerChange(ratingManager, playerName, winnersRating, losersRating, winnerBaseDelta, true, laneContext);
    });

    validLosers.forEach(playerName => {
        const laneContext = getLaneContext(ratingManager, playerName, validLosers, validWinners);
        changes[playerName] = calculatePlayerChange(ratingManager, playerName, losersRating, winnersRating, loserBaseDelta, false, laneContext);
    });

    return {
        changes,
        winnersRating,
        losersRating
    };
}

// ELO 레이팅 업데이트 함수를 EloRatingManager에 추가
EloRatingManager.prototype.updateRatingsFromGameResult = function(winners, losers) {
    const { changes, winnersRating, losersRating } = calculatePersonalizedRatingChanges(this, winners, losers);

    Object.entries(changes).forEach(([playerName, change]) => {
        this.setPlayerRating(playerName, change.after);
        change.after = this.getPlayerRating(playerName);
        change.delta = roundRatingDelta(change.after - change.before);
    });

    console.log(`ELO 업데이트 완료: 승자팀 평균 ${winnersRating.toFixed(1)} → 패자팀 평균 ${losersRating.toFixed(1)}`);

    return changes;
};

export function calculateMatchMmrChanges(gameData, gameRecords = []) {
    const replaySystem = new EloSystem();
    replaySystem.initialize(gameData, []);

    return gameRecords.map(record => {
        if (!record.winners || !record.losers || record.winners.length !== 5 || record.losers.length !== 5) {
            return { ...record, mmrChanges: {} };
        }

        return {
            ...record,
            mmrChanges: replaySystem.updateRatingsFromGameResult(record.winners, record.losers)
        };
    });
}

// 글로벌 ELO 시스템 인스턴스
const globalEloSystem = new EloSystem();

// 외부 모듈에서 사용할 함수들
export {
    EloSystem,
    EloCalculator,
    ELO_CONSTANTS,
    TIER_BASE_RATINGS,
    POSITION_WEIGHTS,
    globalEloSystem
};

// 편의 함수들
export function initializeEloSystem(gameData, gameRecords) {
    globalEloSystem.initialize(gameData, gameRecords);
    return globalEloSystem;
}

export function calculateTeamWinRates(team1Players, team2Players, withPositions = false, team1Positions = null, team2Positions = null) {
    if (withPositions && team1Positions && team2Positions) {
        return globalEloSystem.calculatePositionalWinRate(team1Players, team2Players, team1Positions, team2Positions);
    } else {
        return globalEloSystem.calculateBasicWinRate(team1Players, team2Players);
    }
}

export function getEloSystemStatus() {
    return globalEloSystem.getSystemStatus();
}

export function getPlayerMmr(playerName) {
    return Math.round(globalEloSystem.getPlayerRating(playerName));
}

export function getAllPlayerMmrs() {
    return globalEloSystem.getAllRatings();
}

export function updateEloRatings(winners, losers) {
    return globalEloSystem.updateRatingsFromGameResult(winners, losers);
}

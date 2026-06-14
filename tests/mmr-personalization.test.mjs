import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { EloSystem, calculateMatchMmrChanges } from '../js/modules/eloSystem.js';

function makePlayer(name, tier) {
    return {
        name,
        tier,
        total_games: 0,
        total_wins: 0,
        total_losses: 0,
        overall_winrate: 0,
        positions: {
            top: { games: 0, wins: 0 },
            jungle: { games: 0, wins: 0 },
            mid: { games: 0, wins: 0 },
            adc: { games: 0, wins: 0 },
            support: { games: 0, wins: 0 }
        }
    };
}

const gameData = {
    players: [
        makePlayer('goldWinner', '골드'),
        makePlayer('diamondWinner', '다이아'),
        makePlayer('winSupport1', '골드'),
        makePlayer('winSupport2', '골드'),
        makePlayer('winSupport3', '골드'),
        makePlayer('extraGold', '골드'),
        makePlayer('goldLoser', '골드'),
        makePlayer('diamondLoser', '다이아'),
        makePlayer('loseSupport1', '골드'),
        makePlayer('loseSupport2', '골드'),
        makePlayer('loseSupport3', '골드')
    ],
    statistics: { total_games: 0 }
};

test('same winning team players receive different MMR deltas based on personal MMR', () => {
    const system = new EloSystem();
    system.initialize(gameData, []);

    const changes = system.updateRatingsFromGameResult(
        ['goldWinner', 'diamondWinner', 'winSupport1', 'winSupport2', 'winSupport3'],
        ['goldLoser', 'diamondLoser', 'loseSupport1', 'loseSupport2', 'loseSupport3']
    );

    assert.ok(changes.goldWinner.delta > 0);
    assert.ok(changes.diamondWinner.delta > 0);
    assert.notEqual(changes.goldWinner.delta, changes.diamondWinner.delta);
    assert.ok(changes.goldWinner.delta > changes.diamondWinner.delta);
    assert.equal(Math.round(system.getPlayerRating('goldWinner') - changes.goldWinner.before), Math.round(changes.goldWinner.delta));
});

test('a diamond gains more when winning on one-diamond team than on four-diamond team', () => {
    const oneDiamondSystem = new EloSystem();
    oneDiamondSystem.initialize(gameData, []);
    const oneDiamondChanges = oneDiamondSystem.updateRatingsFromGameResult(
        ['diamondWinner', 'winSupport1', 'winSupport2', 'winSupport3', 'goldWinner'],
        ['goldLoser', 'loseSupport1', 'loseSupport2', 'loseSupport3', 'diamondLoser']
    );

    const fourDiamondData = {
        players: [
            makePlayer('diamondWinner', '다이아'),
            makePlayer('diamondAlly1', '다이아'),
            makePlayer('diamondAlly2', '다이아'),
            makePlayer('diamondAlly3', '다이아'),
            makePlayer('goldAlly', '골드'),
            makePlayer('goldLoser', '골드'),
            makePlayer('loseSupport1', '골드'),
            makePlayer('loseSupport2', '골드'),
            makePlayer('loseSupport3', '골드'),
            makePlayer('diamondLoser', '다이아')
        ],
        statistics: { total_games: 0 }
    };
    const fourDiamondSystem = new EloSystem();
    fourDiamondSystem.initialize(fourDiamondData, []);
    const fourDiamondChanges = fourDiamondSystem.updateRatingsFromGameResult(
        ['diamondWinner', 'diamondAlly1', 'diamondAlly2', 'diamondAlly3', 'goldAlly'],
        ['goldLoser', 'loseSupport1', 'loseSupport2', 'loseSupport3', 'diamondLoser']
    );

    assert.ok(oneDiamondChanges.diamondWinner.delta > fourDiamondChanges.diamondWinner.delta);
});

test('match history MMR replay returns per-player deltas for each record', () => {
    const records = [{
        date: '2026-06-13',
        winners: ['goldWinner', 'diamondWinner', 'winSupport1', 'winSupport2', 'winSupport3'],
        losers: ['goldLoser', 'diamondLoser', 'loseSupport1', 'loseSupport2', 'loseSupport3']
    }];

    const enriched = calculateMatchMmrChanges(gameData, records);

    assert.equal(enriched.length, 1);
    assert.ok(enriched[0].mmrChanges.goldWinner.delta > 0);
    assert.ok(enriched[0].mmrChanges.goldLoser.delta < 0);
    assert.notEqual(enriched[0].mmrChanges.goldWinner.delta, enriched[0].mmrChanges.diamondWinner.delta);
});

test('match history MMR replay includes team and lane reasons for each multiplier', () => {
    const records = [{
        date: '2026-06-13',
        winners: ['goldWinner', 'winSupport1', 'winSupport2', 'winSupport3', 'extraGold'],
        losers: ['diamondLoser', 'goldLoser', 'loseSupport1', 'loseSupport2', 'loseSupport3']
    }];

    const enriched = calculateMatchMmrChanges(gameData, records);
    const goldWinnerChange = enriched[0].mmrChanges.goldWinner;

    assert.equal(goldWinnerChange.teamDiff, 70);
    assert.equal(goldWinnerChange.playerTeamDiff, 0);
    assert.equal(goldWinnerChange.laneDiff, -350);
    assert.equal(goldWinnerChange.position, 'top');
    assert.equal(goldWinnerChange.laneOpponent, 'diamondLoser');
    assert.equal(goldWinnerChange.personalMultiplier, 1);
    assert.equal(goldWinnerChange.laneFactor, 1.04);
    assert.equal(goldWinnerChange.multiplier, 1.04);
    assert.match(goldWinnerChange.formulaText, /기본 \+\d+\.\d{2} × 개인 1\.00 × 라인 1\.04 = \+\d+\.\d{2} × 최종배율 1\.04 = \+\d+\.\d{2} => \+\d+/);
});

test('lane factor reflects same-lane tier gap responsibility by result', () => {
    const laneGapData = {
        players: [
            makePlayer('bronzeTopWinner', '브론즈'),
            makePlayer('winnerJungle', '골드'),
            makePlayer('winnerMid', '골드'),
            makePlayer('winnerAdc', '골드'),
            makePlayer('winnerSupport', '골드'),
            makePlayer('masterTopLoser', '마스터'),
            makePlayer('loserJungle', '골드'),
            makePlayer('loserMid', '골드'),
            makePlayer('loserAdc', '골드'),
            makePlayer('loserSupport', '골드')
        ],
        statistics: { total_games: 0 }
    };
    const system = new EloSystem();
    system.initialize(laneGapData, []);

    const changes = system.updateRatingsFromGameResult(
        ['bronzeTopWinner', 'winnerJungle', 'winnerMid', 'winnerAdc', 'winnerSupport'],
        ['masterTopLoser', 'loserJungle', 'loserMid', 'loserAdc', 'loserSupport']
    );

    assert.equal(changes.bronzeTopWinner.position, 'top');
    assert.equal(changes.bronzeTopWinner.laneOpponent, 'masterTopLoser');
    assert.equal(changes.bronzeTopWinner.laneDiff, -750);
    assert.equal(changes.bronzeTopWinner.laneFactor, 1.05);
    assert.ok(changes.bronzeTopWinner.delta > 0);

    assert.equal(changes.masterTopLoser.position, 'top');
    assert.equal(changes.masterTopLoser.laneOpponent, 'bronzeTopWinner');
    assert.equal(changes.masterTopLoser.laneDiff, 750);
    assert.equal(changes.masterTopLoser.laneFactor, 1.05);
    assert.ok(changes.masterTopLoser.delta < 0);
    assert.match(changes.masterTopLoser.formulaText, /라인 1\.05/);
});

test('renderMatchHistory keeps rows compact and puts MMR details in toggle panel', async () => {
    global.window = { CONFIG: {} };
    global.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
    };

    const matchHistoryList = { innerHTML: '' };
    global.document = {
        getElementById: (id) => (id === 'matchHistoryList' ? matchHistoryList : null),
        querySelectorAll: () => [],
        createElement: () => ({ id: '', innerHTML: '' }),
        head: { appendChild: () => {} }
    };

    const { renderMatchHistory } = await import('../js/modules/uiManager.js');
    const records = [{
        date: '2026-06-13',
        winners: ['goldWinner', 'diamondWinner', 'winSupport1', 'winSupport2', 'winSupport3'],
        losers: ['goldLoser', 'diamondLoser', 'loseSupport1', 'loseSupport2', 'loseSupport3'],
        mmrChanges: {
            goldWinner: {
                delta: 18.4,
                multiplier: 1.15,
                teamDiff: 70,
                playerTeamDiff: -70,
                laneDiff: 120,
                position: 'top',
                laneOpponent: 'goldLoser',
                baseDelta: 16,
                personalMultiplier: 1.09,
                laneFactor: 1.01,
        formulaText: '기본 +16.00 × 개인 1.09 × 라인 1.01 = +16.00 × 최종배율 1.10 = +17.60 => +18'
            },
            diamondWinner: { delta: 12.1, multiplier: 0.82 },
            goldLoser: { delta: -13.5, multiplier: 0.88 },
            diamondLoser: { delta: -19.8, multiplier: 1.21 }
        }
    }];

    renderMatchHistory(records);

    const compactRowHtml = matchHistoryList.innerHTML.split('match-mmr-detail-panel')[0];

    assert.match(matchHistoryList.innerHTML, /match-row-toggle/);
    assert.match(matchHistoryList.innerHTML, /match-mmr-detail-panel/);
    assert.match(matchHistoryList.innerHTML, /hidden/);
    assert.match(compactRowHtml, /GoldWinner/);
    assert.doesNotMatch(compactRowHtml, /\+18/);
    assert.doesNotMatch(compactRowHtml, /×1\.15/);
    assert.match(matchHistoryList.innerHTML, /GoldWinner[\s\S]*\+18/);
    assert.doesNotMatch(matchHistoryList.innerHTML, /match-mmr-multiplier/);
    assert.doesNotMatch(matchHistoryList.innerHTML, /match-mmr-delta[^>]*>[+-]?\d+\s*<span[\s\S]*?×/);
    assert.match(matchHistoryList.innerHTML, /팀 MMR 차이[\s\S]*상대팀 평균 \+70점/);
    assert.match(matchHistoryList.innerHTML, /라인 상대[\s\S]*top goldLoser, 상대 대비 \+120점/);
    assert.match(matchHistoryList.innerHTML, /기본 \+16\.00 × 개인 1\.09 × 라인 1\.01 = \+16\.00 × 최종배율 1\.10 = \+17\.60 =&gt; \+18/);
    assert.match(matchHistoryList.innerHTML, /DiamondWinner[\s\S]*\+12/);
    assert.match(matchHistoryList.innerHTML, /GoldLoser[\s\S]*-14/);
    assert.match(matchHistoryList.innerHTML, /DiamondLoser[\s\S]*-20/);
    assert.match(matchHistoryList.innerHTML, /팀 내 내 MMR[\s\S]*팀 평균 대비 -70점/);
});

test('renderOverviewStats shows the MMR formula card in statistics area', async () => {
    const overviewEl = { innerHTML: '' };
    global.document = {
        getElementById: (id) => (id === 'overviewStats' ? overviewEl : null)
    };

    const { renderOverviewStats } = await import('../js/modules/uiManager.js');

    renderOverviewStats({ total_players: 10, statistics: { total_games: 3 } });

    assert.match(overviewEl.innerHTML, /MMR 계산 공식/);
    assert.match(overviewEl.innerHTML, /팀 기대승률 기반 기본 변동폭/);
    assert.match(overviewEl.innerHTML, /라인 보정/);
    assert.match(overviewEl.innerHTML, /기본 MMR: 골드 1000/);
});

test('renderMatchHistory escapes player names and MVP/ACE regex characters', async () => {
    const matchHistoryList = { innerHTML: '' };
    global.window = { CONFIG: {} };
    global.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
    };
    global.document = {
        getElementById: (id) => (id === 'matchHistoryList' ? matchHistoryList : null),
        querySelectorAll: () => [],
        createElement: () => ({ id: '', innerHTML: '' }),
        head: { appendChild: () => {} }
    };

    const { renderMatchHistory } = await import('../js/modules/uiManager.js');
    const maliciousName = '<img src=x onerror=alert(1)>';
    const regexName = 'ace(user)';
    const records = [{
        date: '2026-06-13',
        winners: [maliciousName, 'winner2', 'winner3', 'winner4', 'winner5'],
        losers: [regexName, 'loser2', 'loser3', 'loser4', 'loser5'],
        mvp: maliciousName,
        ace: regexName,
        mmrChanges: {
            [maliciousName]: { delta: 12.2 },
            [regexName]: { delta: -11.6 }
        }
    }];

    assert.doesNotThrow(() => renderMatchHistory(records));
    assert.doesNotMatch(matchHistoryList.innerHTML, /<img/i);
    assert.match(matchHistoryList.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(matchHistoryList.innerHTML, /Ace\(user\)[\s\S]*-12/);
});

test('basic waiting-area win rate uses the same cached ELO module instance as initialized win rate display', () => {
    const winRateDisplaySource = fs.readFileSync('js/modules/winRateDisplay.js', 'utf8');
    const basicWinRateSource = fs.readFileSync('js/modules/basicWinRateDisplay.js', 'utf8');

    const winRateEloImport = winRateDisplaySource.match(/from '\.\/eloSystem\.js\?v=([^']+)'/);
    const basicEloImport = basicWinRateSource.match(/from '\.\/eloSystem\.js\?v=([^']+)'/);
    const basicModuleImport = winRateDisplaySource.match(/from '\.\/basicWinRateDisplay\.js\?v=([^']+)'/);

    assert.ok(winRateEloImport, 'winRateDisplay must import the versioned ELO module');
    assert.ok(basicEloImport, 'basicWinRateDisplay must import the versioned ELO module');
    assert.ok(basicModuleImport, 'winRateDisplay must import the versioned basic win-rate module to avoid stale browser cache');
    assert.match(
        basicWinRateSource,
        /import \{ getAllTeamPlayers \} from '\.\/teamBuilder\.js\?v=([^']+)';/,
        'basic win-rate must read the canonical team-builder state, not rendered DOM labels'
    );
    assert.doesNotMatch(
        basicWinRateSource,
        /\.position-slot \.player-name/,
        'basic win-rate must not parse position slot text because position tags are rendered inside player labels'
    );
    assert.equal(
        basicModuleImport[1],
        winRateEloImport[1],
        'basic win-rate module cache version must stay aligned with the initialized ELO module version'
    );
    assert.equal(
        basicEloImport[1],
        winRateEloImport[1],
        'basic waiting-area win rate must share the initialized ELO singleton instead of using an uninitialized module instance'
    );
});

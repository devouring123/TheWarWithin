import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function setupBrowserGlobals({ compactMode = 'true' } = {}) {
    global.window = {
        CONFIG: {
            GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/test-script/exec'
        }
    };
    global.localStorage = {
        getItem: () => compactMode,
        setItem: () => {},
        removeItem: () => {}
    };
    const fakeElement = () => ({
        innerHTML: '',
        style: {},
        textContent: '',
        classList: { add: () => {}, remove: () => {} },
        querySelectorAll: () => [],
        addEventListener: () => {}
    });
    global.document = {
        getElementById: (id) => {
            if (id === 'playersList') {
                return {
                    innerHTML: '',
                    querySelectorAll: () => []
                };
            }
            return fakeElement();
        },
        querySelectorAll: () => [],
        createElement: () => ({ style: {}, remove: () => {} }),
        head: { appendChild: () => {} }
    };
}

function makePlayer(name, tier) {
    return {
        name,
        tier,
        total_games: 10,
        total_wins: 5,
        total_losses: 5,
        overall_winrate: 0.5,
        positions: {
            top: { games: 1, wins: 1 },
            jungle: { games: 0, wins: 0 },
            mid: { games: 0, wins: 0 },
            adc: { games: 0, wins: 0 },
            support: { games: 0, wins: 0 }
        }
    };
}

test('updatePlayerTier sends a fixed action payload and rejects unsupported tiers', async () => {
    setupBrowserGlobals();
    let sentRequest = null;
    global.fetch = async (url, options) => {
        sentRequest = { url, options, body: JSON.parse(options.body) };
        return {
            text: async () => JSON.stringify({ success: true, playerName: '정재헌', tier: '다이아' })
        };
    };

    const { updatePlayerTier } = await import(`../js/modules/gameManager.js?test=${Date.now()}`);

    await assert.rejects(() => updatePlayerTier('정재헌', '직접입력'), /지원하지 않는 티어/);
    assert.equal(sentRequest, null);

    const result = await updatePlayerTier('정재헌', '다이아');

    assert.equal(result.tier, '다이아');
    assert.equal(sentRequest.url, 'https://script.google.com/macros/s/test-script/exec');
    assert.deepEqual(sentRequest.body, {
        action: 'updatePlayerTier',
        playerName: '정재헌',
        tier: '다이아'
    });
    assert.equal(sentRequest.options.method, 'POST');
});

test('tier edit controls render in the player analysis panel, not on player cards', async () => {
    setupBrowserGlobals({ compactMode: 'true' });
    const playersList = {
        innerHTML: '',
        querySelectorAll: () => []
    };
    global.document.getElementById = (id) => id === 'playersList'
        ? playersList
        : { innerHTML: '', style: {}, classList: { add: () => {}, remove: () => {} }, querySelectorAll: () => [], addEventListener: () => {} };

    const { renderPlayersList } = await import(`../js/modules/uiManager.js?test=${Date.now()}`);
    renderPlayersList({ players: [makePlayer('정재헌', '골드')] }, [], () => {});

    assert.doesNotMatch(playersList.innerHTML, /tier-edit-btn/);
    assert.doesNotMatch(playersList.innerHTML, /analysis-tier-option/);
    assert.doesNotMatch(playersList.innerHTML, /data-tier-value=/);
    assert.doesNotMatch(playersList.innerHTML, /<input/i);
    assert.doesNotMatch(playersList.innerHTML, /<select/i);

    const { setGameData, setGameRecords, renderAllPlayerComparison } = await import(`../js/modules/playerManager.js?test=${Date.now()}`);
    setGameData({ players: [makePlayer('정재헌', '골드')] });
    setGameRecords([]);

    const analysisHtml = renderAllPlayerComparison('정재헌');

    assert.match(analysisHtml, /class="analysis-tier-trigger"/);
    assert.match(analysisHtml, /data-tier-player="정재헌"/);
    assert.match(analysisHtml, /class="analysis-tier-editor"/);
    assert.match(analysisHtml, /data-tier-value="언랭"/);
    assert.match(analysisHtml, /data-tier-value="다이아"/);
    assert.match(analysisHtml, /data-tier-value="그랜드 마스터"/);
    assert.doesNotMatch(analysisHtml, /<input/i);
    assert.doesNotMatch(analysisHtml, /<select/i);
});

test('tier update success toast only announces refresh', () => {
    const source = fs.readFileSync('js/modules/playerManager.js', 'utf8');

    assert.match(source, /ToastManager\.success\('화면을 새로고침합니다\.'\)/);
    assert.doesNotMatch(source, /티어를 \$\{savedTier\}/);
    assert.doesNotMatch(source, /최신 승률표|다시 읽기/);
});

test('blank tier stays blank in data and only displays as a dash badge', async () => {
    setupBrowserGlobals();
    const { parseGoogleSheetsData } = await import(`../js/modules/dataManager.js?test=${Date.now()}`);
    const { getTierBadgeHtml } = await import(`../js/modules/uiManager.js?test=${Date.now()}`);

    const parsed = parseGoogleSheetsData([
        ['이름', '티어', '게임', '승률'],
        ['헤더', '', '', ''],
        ['빈티어', '', '10', '50%', '0%', '0%', '0%', '0%', '0%', '5', '5']
    ]);

    assert.equal(parsed.players[0].tier, '');
    assert.match(getTierBadgeHtml(parsed.players[0].tier), /title="티어 없음"/);
    assert.match(getTierBadgeHtml(parsed.players[0].tier), />-<\/span>/);
});

test('Apps Script updatePlayerTier validates fixed tiers, updates existing rows, and appends missing players', () => {
    const source = fs.readFileSync('googleAppScript.js', 'utf8');
    const setValuesCalls = [];
    const 티어표 = {
        getDataRange: () => ({
            getValues: () => [
                ['티어', '등급'],
                ['정재헌', '골드', '4'],
                ['나원준', '실버', '2']
            ]
        }),
        getLastRow: () => 3,
        getRange: (row, column, numRows, numColumns) => ({
            setValues: (values) => setValuesCalls.push({ row, column, numRows, numColumns, values })
        })
    };
    const 기록 = {
        getLastColumn: () => 1,
        getRange: () => ({ setValues: () => {} })
    };
    const context = {
        console,
        JSON,
        Date,
        Utilities: { formatDate: () => '26.06.14' },
        SpreadsheetApp: {
            openById: () => ({
                getSheetByName: (name) => ({ 티어표, 기록 })[name] || null,
                getSheets: () => []
            })
        },
        ContentService: {
            MimeType: { JSON: 'application/json' },
            createTextOutput: (content) => ({
                content,
                setMimeType() { return this; },
                getContent() { return this.content; }
            })
        }
    };
    vm.createContext(context);
    vm.runInContext(source, context);

    const invalid = context.doPost({
        postData: { contents: JSON.stringify({ action: 'updatePlayerTier', playerName: '정재헌', tier: '직접입력' }) }
    });
    assert.equal(JSON.parse(invalid.getContent()).success, false);
    assert.deepEqual(setValuesCalls, []);

    const valid = context.doPost({
        postData: { contents: JSON.stringify({ action: 'updatePlayerTier', playerName: '정재헌', tier: '다이아' }) }
    });

    assert.equal(JSON.parse(valid.getContent()).success, true);
    assert.equal(JSON.stringify(setValuesCalls[0]), JSON.stringify({
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 2,
        values: [['정재헌', '다이아']]
    }));

    const created = context.doPost({
        postData: { contents: JSON.stringify({ action: 'updatePlayerTier', playerName: '새사람', tier: '골드' }) }
    });
    const createdBody = JSON.parse(created.getContent());

    assert.equal(createdBody.success, true);
    assert.equal(createdBody.created, true);
    assert.equal(JSON.stringify(setValuesCalls[1]), JSON.stringify({
        row: 4,
        column: 1,
        numRows: 1,
        numColumns: 2,
        values: [['새사람', '골드']]
    }));
});

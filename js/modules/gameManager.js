import CONFIG from './config.js';
import { updateConfig, updateScriptURL, getConfig } from './config.js';
import { parseCSVData, parseRecordsCSV } from './dataManager.js';
import { updateEloAfterGame } from './winRateDisplay.js';

let gameData = null;
let gameRecords = []; // 게임 기록 데이터를 저장할 배열

// URL에서 쿼리 파라미터 가져오기
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        spreadsheetId: params.get('spreadsheetId'),
        scriptId: params.get('scriptId')
    };
}

// 로컬 스토리지에서 설정 가져오기
function getStoredConfig() {
    try {
        const storedSpreadsheetId = localStorage.getItem('spreadsheetId');
        const storedScriptId = localStorage.getItem('scriptId');

        // 모든 설정 값이 있어야 함
        if (storedSpreadsheetId && storedScriptId) {
            return {
                spreadsheetId: storedSpreadsheetId,
                scriptId: storedScriptId
            };
        }
        return null;
    } catch (error) {
        console.warn('로컬 스토리지에서 설정을 가져오는 중 오류 발생:', error);
        return null;
    }
}

// 로컬 스토리지에 설정 저장
function storeConfig(spreadsheetId, scriptId) {
    try {
        localStorage.setItem('spreadsheetId', spreadsheetId);
        localStorage.setItem('scriptId', scriptId);
    } catch (error) {
        console.warn('로컬 스토리지에 설정을 저장하는 중 오류 발생:', error);
    }
}

// 설정 입력 폼 표시 (실제 설정 사용)
function showConfigForm() {
    return new Promise((resolve) => {
        // URL에서 쿼리 파라미터 가져오기
        const queryParams = getQueryParams();
        if (queryParams.spreadsheetId && queryParams.scriptId) {
            // 쿼리 파라미터가 모두 있으면 바로 사용
            updateConfig({
                SPREADSHEET_ID: queryParams.spreadsheetId
            });

            // Google Apps Script URL 업데이트
            updateScriptURL(queryParams.scriptId);

            // 로컬 스토리지에 설정 저장
            storeConfig(queryParams.spreadsheetId, queryParams.scriptId);

            // 로딩 화면 표시
            const loadingEl = document.getElementById('loading');
            loadingEl.style.display = 'flex';
            loadingEl.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-light mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="text-light">URL 파라미터로 설정된 데이터를 불러오는 중...</p>
                </div>
            `;

            resolve();
            return;
        }

        // 로컬 스토리지에서 저장된 설정 확인
        const storedConfig = getStoredConfig();
        if (storedConfig && storedConfig.spreadsheetId && storedConfig.scriptId) {
            // 저장된 설정이 모두 있으면 바로 사용
            updateConfig({
                SPREADSHEET_ID: storedConfig.spreadsheetId
            });

            // Google Apps Script URL 업데이트
            updateScriptURL(storedConfig.scriptId);

            // 로딩 화면 표시
            const loadingEl = document.getElementById('loading');
            loadingEl.style.display = 'flex';
            loadingEl.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-light mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="text-light">저장된 설정으로 데이터를 불러오는 중...</p>
                </div>
            `;

            resolve();
            return;
        }

        // 저장된 설정이 없거나 불완전하면 입력 폼 표시
        // 기존 로딩 화면 숨기기
        document.getElementById('loading').style.display = 'none';

        // 설정 입력 폼 생성
        const configFormHTML = `
            <div class="card text-center" style="max-width: 700px; margin: 0 auto;">
                <div class="card-body">
                    <h5 class="card-title">Google Sheets 설정</h5>
                    <p class="card-text">데이터를 불러오기 위해 아래 정보를 입력해주세요.</p>
                    
                    <div class="mb-3 text-start">
                        <label for="spreadsheetId" class="form-label">스프레드시트 ID</label>
                        <input type="text" class="form-control" id="spreadsheetId" placeholder="">
                    </div>
                    
                    <div class="mb-3 text-start">
                        <label for="scriptId" class="form-label">Google Apps Script ID</label>
                        <input type="text" class="form-control" id="scriptId" placeholder="">
                        <div class="form-text">https://script.google.com/macros/s/ 이후의 ID 부분만 입력하세요</div>
                    </div>
                    
                    <div class="alert alert-info" role="alert">
                        <h6 class="alert-heading">안내</h6>
                        <ul class="mb-0">
                            <li>입력된 정보는 실제 사용됩니다</li>
                            <li>스프레드시트는 공개 설정이어야 합니다</li>
                            <li>입력한 정보는 브라우저에 저장되며 다음 로그인 시 자동으로 사용됩니다</li>
                        </ul>
                    </div>
                    
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" id="continueBtn">계속</button>
                    </div>
                </div>
            </div>
        `;

        const loadingEl = document.getElementById('loading');
        loadingEl.style.display = 'flex';
        loadingEl.innerHTML = configFormHTML;

        // 계속 버튼 이벤트 리스너
        document.getElementById('continueBtn').addEventListener('click', function () {
            // 입력된 정보를 실제로 사용
            const spreadsheetId = document.getElementById('spreadsheetId').value.trim();
            const scriptId = document.getElementById('scriptId').value.trim();

            // 모든 필드가 입력되었는지 확인
            if (!spreadsheetId || !scriptId) {
                alert('모든 필드를 입력해주세요.');
                return;
            }

            // 설정 업데이트
            updateConfig({
                SPREADSHEET_ID: spreadsheetId
            });

            // Google Apps Script URL 업데이트
            updateScriptURL(scriptId);

            // 로컬 스토리지에 설정 저장
            storeConfig(spreadsheetId, scriptId);

            // 업데이트된 설정 값 출력
            console.log('설정 업데이트 완료:', {
                spreadsheetId: spreadsheetId,
                scriptId: scriptId
            });

            loadingEl.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-light mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="text-light">설정을 확인하고 데이터를 불러오는 중...</p>
                </div>
            `;

            resolve();
        });
    });
}

// 데이터 로드 함수 - CSV 우선, API 보조 방식
export async function loadData(showConfigFormFlag = true) {
    try {
        // 설정 폼 표시 (새로고침 시에는 표시하지 않음)
        if (showConfigFormFlag) {
            await showConfigForm();
        }

        // 현재 CONFIG 값을 가져오기
        const currentConfig = getConfig();

        // 설정 값이 있는지 확인
        if (!currentConfig.SPREADSHEET_ID || !currentConfig.GOOGLE_APPS_SCRIPT_URL) {
            throw new Error('필수 설정 값이 없습니다. 스프레드시트 ID, Google Apps Script URL을 입력해주세요.');
        }

        showLoading('Google Sheets에서 실시간 데이터를 불러오는 중...');

        // 캐시 무효화를 위한 타임스탬프
        const cacheBuster = `&_t=${Date.now()}`;

        // 승률표 데이터 로드 (CSV 우선, API 보조)
        const csvUrl = `https://docs.google.com/spreadsheets/d/${currentConfig.SPREADSHEET_ID}/export?format=csv&gid=${currentConfig.SHEET_GID}${cacheBuster}`;
        try {
            console.log('승률표 CSV 방식으로 데이터 로드 시도...');
            const csvResponse = await fetch(csvUrl, { cache: 'no-store' });
            if (csvResponse.ok) {
                const csvData = await csvResponse.text();
                gameData = parseCSVData(csvData);
                console.log('✅ 승률표 CSV 방식으로 데이터 로드 성공');
            } else {
                throw new Error('승률표 CSV 접근 실패');
            }
        } catch (csvError) {
            console.warn('승률표 CSV 방식 실패', csvError);
            throw new Error('CSV 방식 데이터 로드에 실패했습니다. 스프레드시트 공개 설정을 확인해주세요.');
        }

        // 기록 시트 데이터 로드 (CSV 방식만 사용)
        const recordsCsvUrl = `https://docs.google.com/spreadsheets/d/${currentConfig.SPREADSHEET_ID}/export?format=csv&gid=${currentConfig.RECORDS_SHEET_GID}${cacheBuster}`;
        try {
            console.log('기록 시트 CSV 방식으로 데이터 로드 시도...');
            const recordsCsvResponse = await fetch(recordsCsvUrl, { cache: 'no-store' });
            if (recordsCsvResponse.ok) {
                const recordsCsvData = await recordsCsvResponse.text();
                gameRecords = parseRecordsCSV(recordsCsvData);
                console.log('✅ 기록 시트 CSV 방식으로 데이터 로드 성공');
                console.log("Parsed gameRecords:", gameRecords);
            } else {
                throw new Error('기록 시트 CSV 접근 실패');
            }
        } catch (recordsError) {
            console.error('❌ 기록 시트 데이터 로드 실패:', recordsError);
            // 기록 시트 로드 실패는 치명적이지 않으므로 경고만 표시
            alert('게임 기록 데이터를 불러오는 데 실패했습니다. 플레이어 비교 기능이 제한될 수 있습니다.');
        }

        return { gameData, gameRecords };

    } catch (error) {
        console.error('데이터 로드 오류:', error);
        throw error;
    }
}

// Google Sheets 기록 시트에 데이터 추가
export async function addToGoogleSheetsRecord(winners, losers, mvp = null, ace = null) {
    try {
        // CONFIG가 비어있으면 URL 파라미터나 localStorage에서 설정 재로드
        console.log('Initial CONFIG:', window.CONFIG);

        if (!window.CONFIG.GOOGLE_APPS_SCRIPT_URL) {
            const queryParams = getQueryParams();
            console.log('Query params:', queryParams);

            if (queryParams.scriptId) {
                console.log('Updating with query scriptId:', queryParams.scriptId);
                updateScriptURL(queryParams.scriptId);
                console.log('Updated CONFIG from query params:', window.CONFIG);
            } else {
                const storedConfig = getStoredConfig();
                console.log('Stored config:', storedConfig);

                if (storedConfig && storedConfig.scriptId) {
                    console.log('Updating with stored scriptId:', storedConfig.scriptId);
                    updateScriptURL(storedConfig.scriptId);
                    console.log('Updated CONFIG from stored config:', window.CONFIG);
                }
            }
        }

        // 여전히 URL이 없으면 에러
        if (!window.CONFIG.GOOGLE_APPS_SCRIPT_URL) {
            throw new Error('Google Apps Script URL이 설정되지 않았습니다. scriptId 파라미터를 확인해주세요.');
        }

        // 단일 배열 형식으로 데이터 구성
        // [승리팀 5명, 빈칸, 패배팀 5명, 빈칸, MVP, ACE]
        const rows = [
            ...winners,      // 0-4: 승리팀 (탑, 정글, 미드, 원딜, 서폿)
            '',              // 5: 빈칸
            ...losers,       // 6-10: 패배팀 (탑, 정글, 미드, 원딜, 서폿)
            '',              // 11: 빈칸
            mvp || '',       // 12: MVP
            ace || ''        // 13: ACE
        ];

        const requestBody = {
            rows: rows
        };

        console.log('Sending request to:', window.CONFIG.GOOGLE_APPS_SCRIPT_URL);
        console.log('Request body:', JSON.stringify(requestBody));

        const response = await fetch(window.CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('Response text:', responseText);

        // HTML 응답인지 확인
        if (responseText.startsWith('<')) {
            throw new Error('서버에서 HTML 응답이 반환되었습니다. 웹 앱 설정을 확인해주세요.');
        }

        const result = JSON.parse(responseText);

        if (!result.success) {
            throw new Error(result.error || '알 수 없는 오류');
        }

        console.log('✅ Google Sheets에 성공적으로 기록됨:', result.message);
        return true;

    } catch (error) {
        console.error('❌ Google Sheets 기록 실패:', error);
        throw error;
    }
}

// 팀 승리 처리
export function handleTeamWin(winningTeam, team1InputValue, team2InputValue) {
    const team1Input = team1InputValue.trim();
    const team2Input = team2InputValue.trim();

    if (!team1Input || !team2Input) {
        alert('두 팀의 플레이어를 모두 입력해주세요.');
        return null;
    }

    try {
        const team1Players = parseTeamInput(team1Input);
        const team2Players = parseTeamInput(team2Input);

        if (team1Players.length !== 5) {
            alert(`팀 1에 정확히 5명의 플레이어가 필요합니다. 현재 ${team1Players.length}명 입력되었습니다.`);
            return null;
        }

        if (team2Players.length !== 5) {
            alert(`팀 2에 정확히 5명의 플레이어가 필요합니다. 현재 ${team2Players.length}명 입력되었습니다.`);
            return null;
        }

        const gameResult = {
            winners: winningTeam === 1 ? team1Players : team2Players,
            losers: winningTeam === 1 ? team2Players : team1Players
        };

        // ELO 레이팅 업데이트
        try {
            updateEloAfterGame(gameResult.winners, gameResult.losers).catch(error => {
                console.warn('ELO 업데이트 중 오류:', error);
            });
        } catch (error) {
            console.warn('ELO 업데이트 중 오류:', error);
        }

        return gameResult;

    } catch (error) {
        alert('입력 데이터를 처리하는 중 오류가 발생했습니다: ' + error.message);
        return null;
    }
}

// 팀 입력 파싱
function parseTeamInput(input) {
    // 줄바꿈으로 분할하고 공백 제거
    const names = input.split(/\n/)
        .map(name => name.trim())
        .filter(name => name.length > 0);

    return names;
}

// 로딩 화면 표시
function showLoading(message = '데이터를 불러오는 중...') {
    const loadingEl = document.getElementById('loading');
    loadingEl.style.display = 'flex';
    loadingEl.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-light mb-3" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-light">${message}</p>
        </div>
    `;

    document.getElementById('content').style.display = 'none';
}

// 로딩 화면 숨기기
export function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
}

// 오류 표시
export function showError(message) {
    const loadingEl = document.getElementById('loading');
    loadingEl.style.display = 'flex';
    loadingEl.innerHTML = `
        <div class="card text-center" style="max-width: 700px; margin: 0 auto;">
            <div class="card-body">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h5 class="card-title">데이터를 불러올 수 없습니다</h5>
                <p class="card-text text-danger">${message}</p>
                <div class="d-grid gap-2">
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo me-1"></i>다시 시도
                    </button>
                    <hr>
                    <div class="text-start small">
                        <h6 class="text-primary mt-3">🔧 스프레드시트 공개 설정 방법:</h6>
                        <ol class="mt-2">
                            <li><strong>Google Sheets</strong>에서 승률표 스프레드시트 열기</li>
                            <li>우측 상단 <span class="badge bg-success">공유</span> 버튼 클릭</li>
                            <li><strong>"링크가 있는 모든 사용자"</strong> 선택</li>
                            <li>권한을 <strong>"뷰어"</strong>로 설정</li>
                            <li><span class="badge bg-primary">완료</span> 버튼 클릭</li>
                        </ol>
                        
                        <div class="mt-3 p-2 bg-light rounded">
                            <small><strong>💡 팁:</strong> 스프레드시트 URL: <br>
                            <code class="small">https://docs.google.com/spreadsheets/d/1sJ7tQw3Ufy50Ih1DOEYxBtlCPNuZoGcd8serBRwbAkU/</code></small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
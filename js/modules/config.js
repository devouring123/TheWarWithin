// Google Sheets 설정을 window 객체에 저장
window.CONFIG = window.CONFIG || {
    SPREADSHEET_ID: '',
    SHEET_GID: '', // 승률표 시트의 GID
    RECORDS_SHEET_GID: '', // 기록 시트의 GID
    SHEET_NAME: '승률표',
    RECORDS_SHEET_NAME: '기록', // 기록 시트 이름
    // Google Apps Script 웹 앱 URL (배포 후 받은 URL로 교체)
    GOOGLE_APPS_SCRIPT_URL: ''
};

// 설정을 업데이트하는 함수
export function updateConfig(newConfig) {
    window.CONFIG = { ...window.CONFIG, ...newConfig };
    console.log('CONFIG 업데이트됨:', window.CONFIG);
}

// Google Apps Script URL을 업데이트하는 함수
export function updateScriptURL(scriptId) {
    window.CONFIG.GOOGLE_APPS_SCRIPT_URL = `https://script.google.com/macros/s/${scriptId}/exec`;
    console.log('Google Apps Script URL 업데이트됨:', window.CONFIG.GOOGLE_APPS_SCRIPT_URL);
}

// 현재 CONFIG 값을 가져오는 함수
export function getConfig() {
    return window.CONFIG;
}

export default window.CONFIG;

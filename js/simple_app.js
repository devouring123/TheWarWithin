// 모듈 임포트
import { setupEventListeners, toggleCompactMode, SpinnerManager } from './modules/uiManager.js';
import { loadData, showError, hideLoading } from './modules/gameManager.js';
import { renderOverviewStats, renderStatsTable, renderPlayersList, renderCharts, updateLastUpdated, renderMatchHistory, showCaptureButton } from './modules/uiManager.js';
import { handlePlayerClick, clearPlayerSelection, getSelectedPlayers, setGameRecords, setGameData, renderRivalChart, renderTeammateChart } from './modules/playerManager.js';
import { initializeWinRateSystem, updateWinRateDisplay } from './modules/winRateDisplay.js';
import { initializePlayerPicker } from './modules/playerPicker.js';
import { setGameDataForTeamBuilder } from './modules/teamBuilder.js';
import { ToastManager, showSuccess, showError as showToastError, showWarning, showInfo, initTooltips } from './modules/toast.js';
import { initializeShortcuts, showShortcutsHelp, toggleTheme } from './modules/shortcuts.js';

// 전역 변수
let gameData = null;
let gameRecords = []; // 게임 기록 데이터를 저장할 배열

// DOM 로드 완료 시 실행
document.addEventListener('DOMContentLoaded', function () {
    // Chart.js 로딩 대기 후 초기화
    const checkChartLoaded = setInterval(() => {
        if (typeof Chart !== 'undefined') {
            clearInterval(checkChartLoaded);
            initializeApp();
            setupEventListeners();

            // 플레이어 클릭 핸들러를 전역으로 노출
            window.handlePlayerClick = handlePlayerClick;
            window.clearPlayerSelection = clearPlayerSelection;
            window.refreshData = refreshData;
            window.renderRivalChart = renderRivalChart;
            window.renderTeammateChart = renderTeammateChart;
            window.addPlayerToInput = window.addPlayerToInput; // playerPicker에서 설정됨

            // 컴팩트 모드 토글 버튼 이벤트 리스너
            const toggleCardModeBtn = document.getElementById('toggleCardMode');
            if (toggleCardModeBtn) {
                toggleCardModeBtn.addEventListener('click', () => {
                    toggleCompactMode(gameData);
                });
            }

            // 토스트 알림 시스템 전역 노출
            window.ToastManager = ToastManager;
            window.showToast = ToastManager.show.bind(ToastManager);
            window.showSuccess = showSuccess;
            window.showError = showToastError;
            window.showWarning = showWarning;
            window.showInfo = showInfo;

            // 키보드 단축키 초기화 및 전역 노출
            initializeShortcuts();
            window.toggleTheme = toggleTheme;
            window.showShortcutsHelp = showShortcutsHelp;

            // 툴팁 시스템 초기화
            initTooltips();
        }
    }, 100);
});

// 앱 초기화
async function initializeApp() {
    try {
        const { gameData: data, gameRecords: records } = await loadData(); // 기본값으로 true 사용
        gameData = data;
        gameRecords = records;

        // playerManager에 데이터 설정
        setGameData(gameData);
        setGameRecords(gameRecords);

        // teamBuilder에 데이터 설정
        setGameDataForTeamBuilder(gameData);

        // UI 업데이트
        hideLoading();
        renderOverviewStats(gameData);
        renderStatsTable(gameData);
        renderPlayersList(gameData, getSelectedPlayers(), handlePlayerClick);
        renderCharts(gameData);
        updateLastUpdated(gameData);

        // ELO 기반 승률 시스템 초기화
        initializeWinRateSystem(gameData, gameRecords);

        // 플레이어 피커 초기화
        initializePlayerPicker(gameData, gameRecords);

        // 매치 히스토리 렌더링 (서버 데이터 사용)
        renderMatchHistory(gameRecords);

    } catch (error) {
        console.error('앱 초기화 오류:', error);
        showError(`앱을 초기화할 수 없습니다: ${error.message}`);
    }
}

// 새로고침 함수
async function refreshData() {
    try {
        const { gameData: data, gameRecords: records } = await loadData(false); // 새로고침 시에는 설정 폼 표시하지 않음
        gameData = data;
        gameRecords = records;

        // playerManager에 데이터 설정
        setGameData(gameData);
        setGameRecords(gameRecords);

        // teamBuilder에 데이터 설정
        setGameDataForTeamBuilder(gameData);

        // UI 업데이트
        hideLoading();
        renderOverviewStats(gameData);
        renderStatsTable(gameData);
        renderPlayersList(gameData, getSelectedPlayers(), handlePlayerClick);
        renderCharts(gameData);
        updateLastUpdated(gameData);

        // 플레이어 피커 재초기화
        initializePlayerPicker(gameData, gameRecords);

        // 매치 히스토리 렌더링
        renderMatchHistory(gameRecords);

    } catch (error) {
        console.error('데이터 새로고침 오류:', error);
        showError(`데이터를 새로고침할 수 없습니다: ${error.message}`);
    }
}
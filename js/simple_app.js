// 모듈 임포트
import { setupEventListeners } from './modules/uiManager.js';
import { loadData, hideLoading, showError } from './modules/gameManager.js';
import { renderOverviewStats, renderStatsTable, renderPlayersList, renderCharts, updateLastUpdated } from './modules/uiManager.js';
import { handlePlayerClick, clearPlayerSelection, getSelectedPlayers, setGameRecords, setGameData, renderRivalChart, renderTeammateChart } from './modules/playerManager.js';
import { initializeWinRateSystem, updateWinRateDisplay } from './modules/winRateDisplay.js';

// 전역 변수
let gameData = null;
let gameRecords = []; // 게임 기록 데이터를 저장할 배열

// DOM 로드 완료 시 실행
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    
    // 플레이어 클릭 핸들러를 전역으로 노출
    window.handlePlayerClick = handlePlayerClick;
    window.clearPlayerSelection = clearPlayerSelection;
    window.refreshData = refreshData;
    window.renderRivalChart = renderRivalChart;
    window.renderTeammateChart = renderTeammateChart;
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
        
        // UI 업데이트
        hideLoading();
        renderOverviewStats(gameData);
        renderStatsTable(gameData);
        renderPlayersList(gameData, getSelectedPlayers(), handlePlayerClick);
        renderCharts(gameData);
        updateLastUpdated(gameData);
        
        // ELO 기반 승률 시스템 초기화
        initializeWinRateSystem(gameData, gameRecords);
        
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
        
        // UI 업데이트
        hideLoading();
        renderOverviewStats(gameData);
        renderStatsTable(gameData);
        renderPlayersList(gameData, getSelectedPlayers(), handlePlayerClick);
        renderCharts(gameData);
        updateLastUpdated(gameData);
        
    } catch (error) {
        console.error('데이터 새로고침 오류:', error);
        showError(`데이터를 새로고침할 수 없습니다: ${error.message}`);
    }
}
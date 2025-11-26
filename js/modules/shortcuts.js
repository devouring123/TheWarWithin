// 키보드 단축키 시스템
// 앱 전반에서 사용되는 키보드 단축키 관리 모듈

import { ToastManager } from './toast.js';

// 단축키 정의
const SHORTCUTS = {
    'r': {
        action: () => window.refreshData?.(),
        description: '데이터 새로고침',
        category: 'general'
    },
    't': {
        action: () => toggleTheme(),
        description: '테마 전환 (다크/라이트)',
        category: 'general'
    },
    'Escape': {
        action: () => window.clearPlayerSelection?.(),
        description: '플레이어 선택 초기화',
        category: 'player'
    },
    ' ': {
        action: () => document.getElementById('generateTeamsBtn')?.click(),
        description: '랜덤 팀 생성',
        category: 'team'
    },
    '1': {
        action: () => scrollToSection('team-builder'),
        description: '팀짜기 섹션으로 이동',
        category: 'navigation'
    },
    '2': {
        action: () => scrollToSection('overview'),
        description: '전체 현황 섹션으로 이동',
        category: 'navigation'
    },
    '3': {
        action: () => scrollToSection('statistics'),
        description: '통계표 섹션으로 이동',
        category: 'navigation'
    },
    '4': {
        action: () => scrollToSection('charts'),
        description: '차트 섹션으로 이동',
        category: 'navigation'
    },
    '5': {
        action: () => scrollToSection('players'),
        description: '플레이어 목록으로 이동',
        category: 'navigation'
    },
    '?': {
        action: () => showShortcutsHelp(),
        description: '단축키 도움말 표시',
        category: 'help'
    }
};

// 테마 토글 함수
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    ToastManager.info(`${newTheme === 'dark' ? '다크' : '라이트'} 모드로 전환되었습니다`, 2000);
}

// 섹션으로 스크롤
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 단축키 도움말 표시
function showShortcutsHelp() {
    const helpContent = `
        <div class="shortcuts-help">
            <h5 class="mb-3"><i class="fas fa-keyboard me-2"></i>키보드 단축키</h5>
            <div class="shortcuts-grid">
                <div class="shortcut-category">
                    <h6 class="text-muted mb-2">일반</h6>
                    <div class="shortcut-item"><kbd>R</kbd> 데이터 새로고침</div>
                    <div class="shortcut-item"><kbd>T</kbd> 테마 전환</div>
                    <div class="shortcut-item"><kbd>?</kbd> 단축키 도움말</div>
                </div>
                <div class="shortcut-category">
                    <h6 class="text-muted mb-2">탐색</h6>
                    <div class="shortcut-item"><kbd>1</kbd> 팀짜기</div>
                    <div class="shortcut-item"><kbd>2</kbd> 전체 현황</div>
                    <div class="shortcut-item"><kbd>3</kbd> 통계표</div>
                    <div class="shortcut-item"><kbd>4</kbd> 차트</div>
                    <div class="shortcut-item"><kbd>5</kbd> 플레이어</div>
                </div>
                <div class="shortcut-category">
                    <h6 class="text-muted mb-2">동작</h6>
                    <div class="shortcut-item"><kbd>Space</kbd> 랜덤 팀 생성</div>
                    <div class="shortcut-item"><kbd>Esc</kbd> 선택 초기화</div>
                </div>
            </div>
        </div>
    `;

    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('shortcutsHelpModal');
    if (existingModal) {
        existingModal.remove();
    }

    // 새 모달 생성
    const modal = document.createElement('div');
    modal.id = 'shortcutsHelpModal';
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
        <div class="shortcuts-modal-backdrop"></div>
        <div class="shortcuts-modal-content">
            ${helpContent}
            <button class="shortcuts-modal-close" aria-label="닫기">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // 애니메이션을 위한 지연
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });

    // 닫기 이벤트
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 200);
    };

    modal.querySelector('.shortcuts-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.shortcuts-modal-backdrop').addEventListener('click', closeModal);
}

// 키보드 이벤트 핸들러
function handleKeyDown(e) {
    // 입력 필드에서는 무시 (Space 제외한 일부 키만)
    const isInputField = e.target.tagName === 'INPUT' ||
                         e.target.tagName === 'TEXTAREA' ||
                         e.target.isContentEditable;

    if (isInputField) {
        // ESC는 입력 필드에서도 동작 (포커스 해제)
        if (e.key === 'Escape') {
            e.target.blur();
            return;
        }
        return;
    }

    const key = e.key;
    const shortcut = SHORTCUTS[key];

    if (shortcut) {
        e.preventDefault();
        shortcut.action();
    }
}

// 단축키 시스템 초기화
export function initializeShortcuts() {
    document.addEventListener('keydown', handleKeyDown);
    console.log('키보드 단축키 시스템 초기화 완료');
}

// 단축키 비활성화
export function disableShortcuts() {
    document.removeEventListener('keydown', handleKeyDown);
}

// 단축키 목록 반환
export function getShortcutsList() {
    return Object.entries(SHORTCUTS).map(([key, value]) => ({
        key,
        ...value
    }));
}

// 전역 노출
export { toggleTheme, scrollToSection, showShortcutsHelp, SHORTCUTS };

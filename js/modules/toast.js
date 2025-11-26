// 토스트 알림 시스템
// 다양한 유형의 알림을 표시하는 모듈

// 토스트 매니저 클래스
class ToastManager {
    static iconMap = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    // 토스트 컨테이너 확인 및 생성
    static ensureContainer() {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            document.body.appendChild(container);
        }
        return container;
    }

    // 아이콘 가져오기
    static getIcon(type) {
        return this.iconMap[type] || this.iconMap.info;
    }

    // 토스트 표시
    static show(message, type = 'info', duration = 3000) {
        const container = this.ensureContainer();

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <i class="fas ${this.getIcon(type)} toast-icon"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="닫기">
                <i class="fas fa-times"></i>
            </button>
        `;

        // 닫기 버튼 이벤트
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.hide(toast);
        });

        container.appendChild(toast);

        // 애니메이션을 위한 지연
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 자동 숨김
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toast);
            }, duration);
        }

        return toast;
    }

    // 토스트 숨기기
    static hide(toast) {
        if (!toast || !toast.parentNode) return;

        toast.classList.remove('show');
        toast.classList.add('hiding');

        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }

    // 성공 토스트
    static success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    // 에러 토스트
    static error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    // 경고 토스트
    static warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    }

    // 정보 토스트
    static info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    // 모든 토스트 제거
    static clearAll() {
        const container = document.getElementById('toastContainer');
        if (container) {
            const toasts = container.querySelectorAll('.toast-notification');
            toasts.forEach(toast => this.hide(toast));
        }
    }
}

// 툴팁 매니저 클래스
class TooltipManager {
    static tooltipElement = null;

    // 툴팁 엘리먼트 생성
    static ensureTooltip() {
        if (!this.tooltipElement) {
            this.tooltipElement = document.createElement('div');
            this.tooltipElement.className = 'dynamic-tooltip';
            this.tooltipElement.style.cssText = `
                position: fixed;
                background: #1f2937;
                color: #f9fafb;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 0.75rem;
                font-weight: 500;
                white-space: nowrap;
                z-index: 99999;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                pointer-events: none;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.15s ease, visibility 0.15s ease;
            `;
            document.body.appendChild(this.tooltipElement);
        }
        return this.tooltipElement;
    }

    // 툴팁 표시
    static show(target, text) {
        const tooltip = this.ensureTooltip();
        tooltip.textContent = text;
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';

        // 위치 계산
        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        // 기본: 타겟 위쪽 중앙
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 8;

        // 화면 밖으로 나가면 조정
        if (top < 5) {
            top = rect.bottom + 8; // 아래쪽에 표시
        }
        if (left < 5) {
            left = 5;
        }
        if (left + tooltipRect.width > window.innerWidth - 5) {
            left = window.innerWidth - tooltipRect.width - 5;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    // 툴팁 숨기기
    static hide() {
        if (this.tooltipElement) {
            this.tooltipElement.style.opacity = '0';
            this.tooltipElement.style.visibility = 'hidden';
        }
    }

    // 이벤트 리스너 초기화
    static init() {
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                const text = target.getAttribute('data-tooltip');
                if (text) {
                    this.show(target, text);
                }
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                this.hide();
            }
        });
    }
}

// 전역 접근용 export
export { ToastManager, TooltipManager };

// 편의 함수들
export const showToast = (message, type, duration) => ToastManager.show(message, type, duration);
export const showSuccess = (message, duration) => ToastManager.success(message, duration);
export const showError = (message, duration) => ToastManager.error(message, duration);
export const showWarning = (message, duration) => ToastManager.warning(message, duration);
export const showInfo = (message, duration) => ToastManager.info(message, duration);

// 툴팁 초기화
export const initTooltips = () => TooltipManager.init();

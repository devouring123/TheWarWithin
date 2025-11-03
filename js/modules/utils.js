// 퍼센트 문자열을 소수로 변환
export function parsePercentage(value) {
    if (!value || value === '') return 0.0;
    
    const str = String(value);
    if (str.includes('%')) {
        try {
            return parseFloat(str.replace('%', '')) / 100.0;
        } catch {
            return 0.0;
        }
    }
    
    try {
        const val = parseFloat(str);
        if (val >= 0 && val <= 1) return val;
        if (val >= 0 && val <= 100) return val / 100.0;
        return 0.0;
    } catch {
        return 0.0;
    }
}

// 안전한 정수 변환
export function safeInt(value) {
    if (!value || value === '') return 0;
    try {
        return parseInt(parseFloat(String(value)));
    } catch {
        return 0;
    }
}

// 승률에 따른 클래스 반환
export function getWinrateClass(winrate) {
    if (winrate >= 0.6) return 'winrate-high';
    if (winrate >= 0.4) return 'winrate-medium';
    return 'winrate-low';
}

// 포지션 이름을 한글로 변환하는 함수
export function getPositionName(position) {
    const positionNames = {
        'top': '탑',
        'jungle': '정글',
        'mid': '미드',
        'adc': '원딜',
        'support': '서폿'
    };
    return positionNames[position] || position;
}

// 포지션에 해당하는 인덱스 반환 (게임 기록의 포지션 순서: 탑(0), 정글(1), 미드(2), 원딜(3), 서폿(4))
export function getPositionIndex(position) {
    const positionMap = {
        'top': 0,
        'jungle': 1,
        'mid': 2,
        'adc': 3,
        'support': 4
    };
    return positionMap[position];
}
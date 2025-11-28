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

// 한글 이름의 마지막 글자에 받침이 있는지 확인
export function hasFinalConsonant(name) {
    if (!name || name.length === 0) return false;

    const lastChar = name.charAt(name.length - 1);
    const code = lastChar.charCodeAt(0);

    // 한글 음절 범위: 0xAC00 ~ 0xD7A3
    if (code < 0xAC00 || code > 0xD7A3) {
        // 한글이 아니면 받침 없음으로 처리
        return false;
    }

    // 종성(받침) = (코드 - 0xAC00) % 28
    // 종성이 0이면 받침 없음, 1~27이면 받침 있음
    const jongseong = (code - 0xAC00) % 28;
    return jongseong !== 0;
}

// 이름에 따라 올바른 조사 반환 (와/과, 이/가, 을/를, 은/는, 로/으로)
export function getParticle(name, particles) {
    // particles: [받침 없을 때, 받침 있을 때]
    // 예: ['와', '과'], ['가', '이'], ['를', '을'], ['는', '은'], ['로', '으로']
    return hasFinalConsonant(name) ? particles[1] : particles[0];
}
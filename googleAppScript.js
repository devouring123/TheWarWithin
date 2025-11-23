// Preflight OPTIONS 요청을 처리하기 위한 함수
function doOptions(e) {
    return ContentService.createTextOutput('')
        .addHeader("Access-Control-Allow-Origin", "*")
        .addHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        .addHeader("Access-Control-Allow-Headers", "Content-Type");
}

// TheWarWithin 게임 기록 스크립트
function doPost(e) {
    console.log("doPost 함수가 실행되었습니다.");

    try {
        if (!e || !e.postData || !e.postData.contents) {
            throw new Error("POST 데이터가 비어 있습니다.");
        }

        // 원시 데이터 로그
        console.log("수신된 데이터:", e.postData.contents);

        // POST 요청 데이터 파싱
        const data = JSON.parse(e.postData.contents);

        // === 필수: rows 배열만 받는다 ===
        if (!Array.isArray(data.rows)) {
            throw new Error("'rows' 배열이 없습니다. 예: { \"rows\": [\"...\", \"...\"] }");
        }

        // 스프레드시트 정보
        const SPREADSHEET_ID = 'YOUR_SPEADSHEET_ID';
        const RECORDS_SHEET_NAME = '기록';

        // 스프레드시트 및 시트 열기
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        const recordsSheet = spreadsheet.getSheetByName(RECORDS_SHEET_NAME);

        if (!recordsSheet) {
            throw new Error("'" + RECORDS_SHEET_NAME + "' 시트를 찾을 수 없습니다.");
        }

        // 다음 빈 열 찾기
        const lastColumn = recordsSheet.getLastColumn();
        const nextColumn = lastColumn + 1;

        // 현재 날짜/시간
        const now = new Date();
        const dateStr = Utilities.formatDate(now, 'Asia/Seoul', 'YY.MM.dd');

        // 1행: 날짜, 2행 이후: 클라에서 온 rows
        const rows = [];

        // 맨 윗줄: 날짜
        rows.push(dateStr);

        // 나머지 줄: 클라 rows 그대로 (null/undefined는 빈 문자열로 보정)
        data.rows.forEach(function (item) {
            if (item === null || item === undefined) {
                rows.push("");
            } else {
                rows.push(String(item));
            }
        });

        const rowCount = rows.length;
        if (rowCount === 0) {
            throw new Error("기록할 행 데이터가 없습니다.");
        }

        // setValues용 2차원 배열로 변환
        const values = rows.map(function (item) {
            return [item];
        });

        // 1행 ~ rowCount행, nextColumn열에 작성
        const range = recordsSheet.getRange(1, nextColumn, rowCount, 1);
        range.setValues(values);

        console.log(nextColumn + "열에 " + rowCount + "행 데이터를 성공적으로 기록했습니다.");

        // 성공 응답
        const response = ContentService
            .createTextOutput(JSON.stringify({
                success: true,
                message: "게임 기록이 성공적으로 추가되었습니다.",
                column: nextColumn,
                rowCount: rowCount,
                timestamp: now.toISOString()
            }))
            .setMimeType(ContentService.MimeType.JSON);

        return response;

    } catch (error) {
        console.error("doPost 오류:", error.toString(), "\n스택:", error.stack);

        const errorResponse = ContentService
            .createTextOutput(JSON.stringify({
                success: false,
                error: "스크립트 오류: " + error.message
            }))
            .setMimeType(ContentService.MimeType.JSON);

        return errorResponse;
    }
}

// GET 요청 처리 (테스트용)
function doGet(e) {
    const output = {
        message: 'TheWarWithin Game Recorder is running!',
        timestamp: new Date().toISOString()
    };

    return ContentService
        .createTextOutput(JSON.stringify(output))
        .setMimeType(ContentService.MimeType.JSON);
}

// 테스트 함수
function testRecordGame() {
    // 클라에서 이렇게 rows만 보내온다고 가정 (접두사 없이 이름만)
    const testRows = [
        // 2행~6행: 승리팀
        '김탑',
        '이정글',
        '박미드',
        '최원딜',
        '정서폿',
        "",          // 구분선
        // 8행~12행: 패배팀
        '한탑',
        '송정글',
        '조미드',
        '윤원딜',
        '장서폿',
        "",          // 구분선
        // 14행: MVP
        '김탑',
        // 15행: ACE
        '한탑'
    ];

    const testData = {
        postData: {
            contents: JSON.stringify({
                rows: testRows
            })
        }
    };

    const result = doPost(testData);
    console.log("rows 포맷 결과:", result.getContent());
}

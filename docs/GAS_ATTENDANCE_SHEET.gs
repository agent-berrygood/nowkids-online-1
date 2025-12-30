// Google Apps Script Code for Generating Attendance Sheet
// 2025.12.11 Updated - Simplified Name-Based Matching

/**
 * Creates or updates the AttendanceView sheet.
 * Structure:
 * Rows 1-3: Empty
 * Row 4: Headers [Grade, Class, Name, Rate, ...Dates]
 * Row 5+: Student Data + Formulas
 */
function createAttendanceView() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'AttendanceView';
  let sheet = ss.getSheetByName(sheetName);

  // 기존 시트가 있으면 삭제
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  
  sheet = ss.insertSheet(sheetName);
  
  // 1. Setup Dates (Sundays from Dec 2025 to Dec 2026)
  sheet.setColumnWidth(4, 120); // Rate (Attendance Rate)
  for (let c = 5; c <= allHeaders.length; c++) {
    sheet.setColumnWidth(c, 40); // 날짜 컬럼들
  }
}

function getExtendedSundays() {
  const dates = [];
  const start = new Date(2025, 11, 1); 
  const end = new Date(2026, 11, 31);
  
  let current = new Date(start);
  while (current.getDay() !== 0) {
    current.setDate(current.getDate() + 1);
  }
  
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 7);
  }
  return dates;
}

function getStudentList(ss) {
  const sheet = ss.getSheetByName('StudentDB');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  
  // Helper to find column index
  const getIdx = (eng, kor) => {
    let idx = headers.indexOf(eng);
    if (idx === -1 && kor) idx = headers.indexOf(kor);
    return idx;
  };

/**
 * StudentDB 시트 수정 시 자동으로 AttendanceView 갱신
 * Simple Trigger - 별도 설치 없이 자동 동작
 */
function onEdit(e) {
  try {
    const sheet = e.source.getActiveSheet();
    const sheetName = sheet.getName();
    
    // StudentDB 시트가 수정된 경우에만 실행
    if (sheetName === 'StudentDB') {
      createAttendanceView();
    }
  } catch (error) {
    Logger.log('onEdit 오류: ' + error.toString());
  }
}

/**
 * 트리거 수동 설치 함수 (선택사항)
 * Simple Trigger로 충분하지만, 필요시 Installable Trigger로 전환 가능
 */
function installTrigger() {
  // 기존 onEdit 트리거 삭제
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEdit') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // 새 트리거 생성
  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
  
  Browser.msgBox('트리거가 설치되었습니다.');
}

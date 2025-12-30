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
  const sundays = getExtendedSundays();
  
  // 2. Setup Headers - Simple: Grade, Class, Name, Rate, Dates
  const fixedHeaders = ['Grade', 'Class', 'Name', 'Attendance Rate'];
  const allHeaders = fixedHeaders.concat(sundays);
  
  // Set headers at Row 3
  const fixedHeaderRange = sheet.getRange(3, 1, 1, fixedHeaders.length);
  fixedHeaderRange.setValues([fixedHeaders]);
  fixedHeaderRange.setFontWeight('bold').setBackground('#e0e0e0').setHorizontalAlignment('center');
  
  // Date headers (E3 onwards)
  const dateHeaderRange = sheet.getRange(3, 5, 1, sundays.length);
  dateHeaderRange.setValues([sundays]); 
  dateHeaderRange.setFontWeight('bold').setBackground('#e0e0e0').setHorizontalAlignment('center');
  dateHeaderRange.setNumberFormat('mm/dd');
  
  // Add Summary Statistics in Rows 1-2
  
  // Row 1: 재적 (Total Enrollment)
  sheet.getRange('A1').setValue('재적');
  sheet.getRange('A2').setFormula('=COUNTA(C4:C)'); // Count names from row 4 down
  
  // Row 2: 출석현황 (Daily Attendance Count) - Moved from Row 3 to Row 2
  sheet.getRange('D2').setValue('출석현황');
  
  // Add formulas for each date column (E onwards) at Row 2
  const lastColLetter = getColumnLetter(allHeaders.length);
  
  // E2 onwards: Daily Attendance Count (TRUE count)
  for (let col = 5; col <= allHeaders.length; col++) {
    const colLetter = getColumnLetter(col);
    sheet.getRange(2, col).setFormula(`=COUNTIF(${colLetter}4:${colLetter}, TRUE)`);
  }
  
  // Freeze panes
  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(4);
  
  // 3. Fetch Students from StudentDB
  const students = getStudentList(ss);
  
  if (students.length === 0) {
    Browser.msgBox('StudentDB에 학생 데이터가 없습니다.');
    return;
  }
  
  // Sort Students: Grade > Class > Name
  students.sort((a, b) => {
    if (String(a.grade) !== String(b.grade)) return String(a.grade).localeCompare(String(b.grade));
    if (Number(a.classNum) !== Number(b.classNum)) return Number(a.classNum) - Number(b.classNum);
    return String(a.name).localeCompare(String(b.name));
  });
  
  // 4. Write Student Data
  const startRow = 4;
  const numRows = students.length;
  
  const dataRows = students.map(s => [s.grade, s.classNum, s.name]);
  sheet.getRange(startRow, 1, numRows, 3).setValues(dataRows);
  
  // 5. Apply Formulas
  
  // (1) Attendance Rate Formula (Column D)
  // Formula: (My Attendance Count) / (Total Weeks - Weeks with 0 Attendance)
  // User Request: (출석일/전체주일-출석현황0인날의 수)
  const dailyCountRange = `$E$2:$${lastColLetter}$2`;
  const headerDateRange = `$E$3:$${lastColLetter}$3`;
  
  for (let i = 0; i < numRows; i++) {
    const r = startRow + i;
    // 분자: 나의 출석일수 (COUNTIF(E{r}:LastCol{r}, TRUE))
    // 분모: 전체 주일 수(COUNTA(Headers)) - 출석현황이 0인 날의 수(COUNTIF(DailyCount, 0))
    const rateFormula = `=IFERROR(COUNTIF(E${r}:${lastColLetter}${r}, TRUE) / (COUNTA(${headerDateRange}) - COUNTIF(${dailyCountRange}, 0)), 0)`;
    sheet.getRange(r, 4).setFormula(rateFormula).setNumberFormat('0%');
  }
  
  // (2) Checkbox Formulas - Name-Based Matching
  // Range: E4 to LastRow LastCol
  const checkboxRange = sheet.getRange(startRow, 5, numRows, sundays.length);
  
  // Formula Logic:
  // Match Student Name (Col C) -> AttendanceDB Col C (StudentName)
  // Match Date (Header Row 3) -> AttendanceDB Col D (Date)
  // Match Status TRUE -> AttendanceDB Col E (Status)
  
  checkboxRange.setFormula(`=COUNTIFS(AttendanceDB!$C:$C, $C4, AttendanceDB!$D:$D, E$3, AttendanceDB!$E:$E, TRUE) > 0`);
  checkboxRange.insertCheckboxes();
  
  // 6. Formatting
  sheet.setColumnWidth(1, 60); // Grade
  sheet.setColumnWidth(2, 50); // Class
  sheet.setColumnWidth(3, 80); // Name
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
  
  const gIdx = getIdx('Grade', '학년');
  const cIdx = getIdx('Class', '반');
  const naIdx = getIdx('Name', '이름');
  
  if (gIdx === -1 || cIdx === -1 || naIdx === -1) {
    Browser.msgBox('필수 헤더(Grade/학년, Class/반, Name/이름)를 찾을 수 없습니다.\\n현재 헤더: ' + headers.join(', '));
    return [];
  }
  
  const list = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    list.push({
      grade: row[gIdx],
      classNum: row[cIdx],
      name: row[naIdx]
    });
  }
  return list;
}

function getColumnLetter(col) {
  let temp, letter = '';
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}

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

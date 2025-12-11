// Google Apps Script Code for Generating Attendance Sheet
// 2025.12.11 Created

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

  if (sheet) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert('경고', '기존 시트가 삭제되고 재생성됩니다. 계속하시겠습니까?', ui.ButtonSet.YES_NO);
    if (response !== ui.Button.YES) return;
    ss.deleteSheet(sheet);
  }
  
  sheet = ss.insertSheet(sheetName);
  
  // 1. Setup Dates (Sundays from Dec 2025 to Dec 2026)
  const sundays = getExtendedSundays();
  
  // 2. Setup Headers
  const fixedHeaders = ['Grade', 'Class', 'Name', 'Attendance Rate'];
  const allHeaders = fixedHeaders.concat(sundays);
  
  // Set headers at Row 4
  const headerRange = sheet.getRange(4, 1, 1, allHeaders.length);
  headerRange.setValues([allHeaders]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#e0e0e0');
  headerRange.setHorizontalAlignment('center');
  
  // Freeze panes
  sheet.setFrozenRows(4);
  sheet.setFrozenColumns(4);
  
  // 3. Fetch Students from StudentDB
  const students = getStudentList(ss);
  
  if (students.length === 0) {
    Browser.msgBox('StudentDB에 학생 데이터가 없습니다.');
    return;
  }
  
  // Sort Students: Grade > Class > Number (or Name)
  students.sort((a, b) => {
    if (String(a.grade) !== String(b.grade)) return String(a.grade).localeCompare(String(b.grade));
    if (Number(a.classNum) !== Number(b.classNum)) return Number(a.classNum) - Number(b.classNum);
    return Number(a.number) - Number(b.number);
  });
  
  // 4. Prepare Data Rows
  const startRow = 5;
  const numRows = students.length;
  
  // Write Static Data (Grade, Class, Name)
  const staticData = students.map(s => [s.grade, s.classNum, s.name]);
  sheet.getRange(startRow, 1, numRows, 3).setValues(staticData);
  
  // 5. Apply Formulas
  
  // (1) Attendance Rate Formula (Column D)
  // Formula: =COUNTIF(E5:5, TRUE) / COUNTIF(DateRange, "<="&TODAY()) 
  // Simplified: =COUNTIF(E5:5, TRUE) / (ColumnsCount) or just Count TRUEs
  // Let's use simple percentage of total checked weeks so far? Or total overall?
  // User asked for "Attendance Rate". Usually: Checked / Total Weeks passed.
  // Ideally: =IFERROR(COUNTIF(E5:ZZ5, TRUE) / COUNTIFS($E$4:$ZZ$4, "<="&TODAY()), 0)
  // We need column letter for last date.
  const lastColLetter = getColumnLetter(allHeaders.length);
  const dateRange = `$E$4:$${lastColLetter}$4`;
  
  for (let i = 0; i < numRows; i++) {
    const r = startRow + i;
    // Count TRUEs in the row, divide by number of Sundays that have passed (or total?)
    // Basic: Count / Total Columns
    // const rateFormula = `=IFERROR(COUNTIF(E${r}:${lastColLetter}${r}, TRUE) / ${sundays.length}, 0)`;
    
    // Advanced: Count / (Sundays <= Today)
    const rateFormula = `=IFERROR(COUNTIF(E${r}:${lastColLetter}${r}, TRUE) / COUNTIFS(${dateRange}, "<="&TODAY()), 0)`;
    
    sheet.getRange(r, 4).setFormula(rateFormula).setNumberFormat('0%');
  }
  
  // (2) Checkbox Formulas (Auto-check from Response/AttendanceDB)
  // We need to match StudentID + Date.
  // StudentID construction: Grade_Class_Number_Name_Index ??
  // Wait, in `StudentDB` we might not have the UniqueID constructed yet.
  // But `AttendanceDB` (where data is submitted) uses `studentId`.
  // `getStudentList` should return enough info to reconstruct the unique ID or match it.
  // Current Unique ID Logic: `${grade}_${classNum}_${number}_${name}_${index}`.
  
  // Problem: Sheet formulas can't easily do complex string generation or partial matching efficiently.
  // Solution: We should rely on `AttendanceDB` having consistent IDs.
  // Formula: `=COUNTIFS(AttendanceDB!$B:$B, UNIQUE_ID_OF_ROW, AttendanceDB!$D:$D, DateHeader) > 0`
  // We need to put the **Unique ID** somewhere in this sheet to match!
  // User asked for Grade, Class, Name, Rate.
  // We can put UniqueID in a Hidden Column (e.g., Column A, shifting everything? Or Column Z?)
  // Let's Insert UniqueID in Column A (Hidden)? Or just use Columns E+ formulas referencing constructed ID?
  // Constructing ID in formula: `=$A5 & "_" & $B5 & "_" & ...` is risky if logic changes.
  // Better: Add a HIDDEN column for StudentID.
  
  // Revised Headers: [StudentID (Hidden), Grade, Class, Name, Rate, ...Dates]
  // Let's add StudentID at Col 1 and hide it.
  
  // New Header Mapping:
  // 1: ID (Hidden)
  // 2: Grade
  // 3: Class
  // 4: Name
  // 5: Rate
  // 6+: Dates
  
  const realHeaders = ['ID', 'Grade', 'Class', 'Name', 'Attendance Rate'].concat(sundays);
  sheet.getRange(4, 1, 1, realHeaders.length).setValues([realHeaders]);
  // Re-style
  sheet.getRange(4, 2, 1, realHeaders.length - 1).setFontWeight('bold').setBackground('#e0e0e0').setHorizontalAlignment('center');
  
  // Write Data including Generated ID
  // ID Logic must match `getStudents` in compiled code: `${grade}_${classNum}_${number}_${rowIndex}`
  // In `getStudentList`, we iterate StudentDB. `rowIndex` is `i` (from 1).
  const dataRows = students.map(s => [s.id, s.grade, s.classNum, s.name]);
  sheet.getRange(startRow, 1, numRows, 4).setValues(dataRows);
  
  // Hide ID Column
  sheet.hideColumns(1);
  
  // Checkbox Formula
  // Col 1 is ID ($A5). Dates start at Col 6 (F). Headers at Row 4.
  // AttendanceDB Col B is StudentID, Col D is Date.
  const lastColLetterReal = getColumnLetter(realHeaders.length);
  const dateHeaderRow = 4;
  
  // Range for check boxes: F5 : LastCol LastRow
  // We will set data validation (Checkboxes) AND Formula.
  // Formula: =COUNTIFS(AttendanceDB!$B:$B, $A5, AttendanceDB!$D:$D, F$4) > 0
  
  const checkboxRange = sheet.getRange(startRow, 6, numRows, sundays.length);
  const formulaR1C1 = `=COUNTIFS(AttendanceDB!$C:$C, $A5, AttendanceDB!$E:$E, F$4) > 0`; 
  // Wait, check AttendanceDB column indices in `submitAttendance`?
  // In `submitAttendance`:
  // appendRow([id, studentId, studentName, date, status, timestamp])
  // Col 1: ID (recordId) -> A
  // Col 2: StudentID -> B
  // Col 3: Name -> C
  // Col 4: Date -> D
  // Col 5: Status -> E
  // So StudentID is B, Date is D.
  
  // Correct Formula: =COUNTIFS(AttendanceDB!$B:$B, $A5, AttendanceDB!$D:$D, F$4) > 0
  // Note: Date format in Header and DB must match (YYYY-MM-DD string).
  
  // Apply Checkboxes (Visual)
  checkboxRange.insertCheckboxes();
  
  // Apply Formula (Logic)
  // *Important*: In Sheets, if you put a formula in a Checkbox cell, it works as a read-only toggle (mostly).
  // If user clicks it, they overwrite formula.
  // We loop to set formula for each cell involves many calls.
  // Better to setFormulaR1C1 or just setFormula for the whole block?
  // `setFormula` on a range automatically adjusts relative references if we use A1 notation carefully?
  // Let's try setting formula on the whole range.
  
  // Logic to adjust references across range:
  // IF we set "=COUNTIFS(..., $A5, ..., F$4)" on F5, dragging it to G5 becomes G$4. Dragging to F6 becomes $A6.
  // Yes, relative references work.
  checkboxRange.setFormula(`=COUNTIFS(AttendanceDB!$B:$B, $A5, AttendanceDB!$D:$D, F$4) > 0`);
  
  // 6. Formatting
  sheet.setColumnWidth(1, 5); // ID (Hidden)
  sheet.setColumnWidth(2, 60); // Grade
  sheet.setColumnWidth(3, 50); // Class
  sheet.setColumnWidth(4, 80); // Name
  sheet.setColumnWidth(5, 60); // Rate
  for (let c = 6; c <= realHeaders.length; c++) {
    sheet.setColumnWidth(c, 30);
  }
}

function getExtendedSundays() {
  const dates = [];
  // From Dec 2025 to Dec 2026
  // Start: 2025-12-01
  const start = new Date(2025, 11, 1); // Month is 0-indexed: 11 = Dec
  const end = new Date(2026, 11, 31);
  
  let current = new Date(start);
  // Find first Sunday
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
  const gIdx = headers.indexOf('Grade');
  const cIdx = headers.indexOf('Class');
  const nIdx = headers.indexOf('Number');
  const naIdx = headers.indexOf('Name');
  // ID might not be in column? We generate it based on logic.
  // Logic: `${grade}_${class}_${number}_${rowIndex}`.
  
  const list = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Use i as rowIndex match
    const id = `${row[gIdx]}_${row[cIdx]}_${row[nIdx]}_${i}`;
    list.push({
      id: id,
      grade: row[gIdx],
      classNum: row[cIdx],
      number: row[nIdx],
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

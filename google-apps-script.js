/**
 * Google Apps Script for NowKids Online DB
 * 
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Create two sheets: "Students" and "Attendance".
 * 3. "Students" columns: id, name, grade, classNum, number, etc.
 * 4. "Attendance" columns: id, studentId, date, status, timestamp.
 * 5. Go to Extensions > Apps Script.
 * 6. Paste this code.
 * 7. Deploy as Web App (Execute as: Me, Who has access: Anyone).
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const params = e.parameter;
    const action = params.action;
    
    let result;
    
    switch (action) {
      case 'getStudents':
        result = getStudents(params);
        break;
      case 'getAttendance':
        result = getAttendance(params);
        break;
      case 'submitAttendance':
        // For POST requests, data might be in postData.contents
        const postData = e.postData ? JSON.parse(e.postData.contents) : params;
        result = submitAttendance(postData);
        break;
      case 'getGradeClassList':
        result = getGradeClassList();
        break;
      default:
        throw new Error('Invalid action: ' + action);
    }
    
    return createResponse({ success: true, data: result });
    
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Database Helper Functions ---

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Initialize headers if new sheet
    if (name === 'Students') {
      sheet.appendRow(['id', 'name', 'grade', 'classNum', 'number', 'gender', 'birthDate']);
    } else if (name === 'Attendance') {
      sheet.appendRow(['id', 'studentId', 'date', 'status', 'timestamp']);
    }
  }
  return sheet;
}

function getData(sheetName) {
  const sheet = getSheet(sheetName);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const data = rows.slice(1);
  
  return data.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

// --- Action Functions ---

function getStudents(params) {
  const { grade, classNum } = params;
  const allStudents = getData('Students');
  
  return allStudents.filter(s => 
    String(s.grade) === String(grade) && 
    String(s.classNum) === String(classNum)
  );
}

function getAttendance(params) {
  const { date, grade, classNum } = params;
  
  // 1. Get students for the class to filter relevant attendance
  const students = getStudents({ grade, classNum });
  const studentIds = new Set(students.map(s => String(s.id)));
  
  // 2. Get all attendance records
  const allAttendance = getData('Attendance');
  
  // 3. Filter by date and student IDs belonging to the class
  return allAttendance.filter(r => 
    String(r.date) === String(date) && 
    studentIds.has(String(r.studentId))
  );
}

function submitAttendance(data) {
  const { date, records } = data;
  const sheet = getSheet('Attendance');
  const timestamp = new Date().toISOString();
  
  // records: [{ studentId: '...', status: '...' }, ...]
  
  // Optional: Remove existing records for this date/student to prevent duplicates?
  // For simplicity, we just append. A real app might update or delete old ones.
  // Let's try to update if exists, or append.
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  
  // Map headers to indices
  const h = {};
  headers.forEach((header, i) => h[header] = i);
  
  records.forEach(record => {
    let found = false;
    // Try to find existing row to update
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      if (String(row[h.date]) === String(date) && String(row[h.studentId]) === String(record.studentId)) {
        // Update existing row
        // We need the actual row index in the sheet (1-based) -> i + 1
        sheet.getRange(i + 1, h.status + 1).setValue(record.status);
        sheet.getRange(i + 1, h.timestamp + 1).setValue(timestamp);
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Append new row
      const newRow = [];
      headers.forEach(header => {
        if (header === 'id') newRow.push(Utilities.getUuid());
        else if (header === 'studentId') newRow.push(record.studentId);
        else if (header === 'date') newRow.push(date);
        else if (header === 'status') newRow.push(record.status);
        else if (header === 'timestamp') newRow.push(timestamp);
        else newRow.push('');
      });
      sheet.appendRow(newRow);
    }
  });
  
  return true;
}

function getGradeClassList() {
  const students = getData('Students');
  const grades = new Set();
  const classes = new Set();
  
  students.forEach(s => {
    if (s.grade) grades.add(String(s.grade));
    if (s.classNum) classes.add(Number(s.classNum));
  });
  
  return {
    grades: Array.from(grades).sort(),
    classes: Array.from(classes).sort((a, b) => a - b)
  };
}

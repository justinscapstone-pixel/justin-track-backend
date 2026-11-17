"use strict";
const storageKey = "partida-studenttrack-teacher-prototype-v1";
const accountsKey = "partida-studenttrack-accounts-prototype-v1";
const settingsKey = "partida-studenttrack-preferences-v1";
const defaultGrades = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const defaultSections = ["Section A", "Section B", "Section C"];
const attendanceStatuses = ["present", "absent", "late", "excused"];
const attendanceLabels = { present: "Present", absent: "Absent", late: "Late", excused: "Excused",
unmarked: "Unmarked" };
const behaviorTypeLabels = { merit: "Merit", demerit: "Demerit" };
const behaviorTypes = new Set(["merit", "demerit", "positive", "concern", "negative"]);
const attendanceDate = localDateKey(new Date());
function normalizeBehaviorType(type) {
if (type === "merit" || type === "positive") return "merit";
if (type === "demerit" || type === "concern" || type === "negative") return "demerit";
return "demerit";
}
function isValidBehaviorType(type) {
return behaviorTypes.has(type);
}
function behaviorTypeLabel(type) {
const normalized = normalizeBehaviorType(type);
return behaviorTypeLabels[normalized] || "Demerit";
}
function legacyBehaviorTypeClass(type) {
return normalizeBehaviorType(type) === "merit" ? "positive" : "concern";
}
let students = [];
let account = null;
let selectedPortal = "teacher";
const elements = {
portalChoiceScreen: document.getElementById("portal-choice-screen"),
chooseTeacher: document.getElementById("choose-teacher"),
chooseParent: document.getElementById("choose-parent"),
backToPortals: document.getElementById("back-to-portals"),
authPortalLabel: document.getElementById("auth-portal-label"),
authTitle: document.getElementById("auth-title"),
authCopy: document.getElementById("auth-copy"),
authScreen: document.getElementById("auth-screen"),
portal: document.getElementById("portal"),
parentPortal: document.getElementById("parent-portal"),
loginTab: document.getElementById("login-tab"),
registerTab: document.getElementById("register-tab"),
loginForm: document.getElementById("login-form"),
registerForm: document.getElementById("register-form"),
registerName: document.getElementById("register-name"),
registerNameLabel: document.querySelector('label[for="register-name"]'),
registerSubmit: document.getElementById("register-submit"),
parentRegisterLrn: document.getElementById("parent-register-lrn"),
teacherRoleFields: document.querySelectorAll(".teacher-role-field"),

parentChildrenFields: document.querySelectorAll(".parent-children-field"),
authError: document.getElementById("auth-error"),
totpDialog: document.getElementById("totp-dialog"),
totpInstructions: document.getElementById("totp-instructions"),
totpPasswordInput: document.getElementById("totp-password-input"),
totpPasswordLabel: document.getElementById("totp-password-label"),
totpQr: document.getElementById("totp-qr"),
totpCodeInput: document.getElementById("totp-code-input"),
totpCodeLabel: document.getElementById("totp-code-label"),
totpError: document.getElementById("totp-error"),
recoveryCodePanel: document.getElementById("recovery-code-panel"),
recoveryCodeList: document.getElementById("recovery-code-list"),
totpStartButton: document.getElementById("totp-start-btn"),
totpVerifyButton: document.getElementById("totp-verify-btn"),
totpDoneButton: document.getElementById("totp-done-btn"),
totpCancelButton: document.getElementById("totp-cancel-btn"),
signOut: document.getElementById("sign-out"),
topSignOut: document.getElementById("top-sign-out"),
parentSignOut: document.getElementById("parent-sign-out"),
parentAvatar: document.getElementById("parent-avatar"),
parentAccountName: document.getElementById("parent-account-name"),
parentNotificationsEnable: document.getElementById("parent-notifications-enable"),
parentOverviewView: document.getElementById("parent-overview-view"),
parentSettingsView: document.getElementById("parent-settings-view"),
parentOverviewTab: document.getElementById("parent-overview-tab"),
parentSettingsTab: document.getElementById("parent-settings-tab"),
parentGreetingName: document.getElementById("parent-greeting-name"),
parentLinkForm: document.getElementById("parent-link-form"),
parentAddChild: document.getElementById("parent-add-child"),
parentChildList: document.getElementById("parent-child-list"),
parentNoChildren: document.getElementById("parent-no-children"),
parentUpdatesList: document.getElementById("parent-updates-list"),
parentNoUpdates: document.getElementById("parent-no-updates"),
parentUpdateCount: document.getElementById("parent-update-count"),
breadcrumbCurrent: document.getElementById("breadcrumb-current"),
sidebarUserName: document.getElementById("sidebar-user-name"),
sidebarUserRole: document.getElementById("sidebar-user-role"),
userAvatar: document.getElementById("user-avatar"),
today: document.getElementById("today-label"),
greeting: document.getElementById("greeting"),
total: document.getElementById("stat-total"),
present: document.getElementById("stat-present"),
presentFoot: document.getElementById("stat-present-foot"),
absent: document.getElementById("stat-absent"),
unmarkedStat: document.getElementById("stat-unmarked"),
behaviorCount: document.getElementById("stat-behavior"),
trendPeriod: document.getElementById("trend-period"),
trendStart: document.getElementById("trend-start"),
trendEnd: document.getElementById("trend-end"),
trendSummary: document.getElementById("trend-summary"),
trendChart: document.getElementById("attendance-trend-chart"),
trendEmpty: document.getElementById("attendance-trend-empty"),
trendError: document.getElementById("trend-error"),
sectionAttendanceDate: document.getElementById("section-attendance-date"),
sectionAttendanceTotal: document.getElementById("section-attendance-total"),
sectionAttendanceList: document.getElementById("section-attendance-list"),
sectionAttendanceToggle: document.getElementById("section-attendance-toggle"),
unmarkedNav: document.getElementById("nav-unmarked"),
presentCount: document.getElementById("present-count"),
absentCount: document.getElementById("absent-count"),
unmarkedCount: document.getElementById("unmarked-count"),
search: document.getElementById("student-search"),
attendanceFilter: document.getElementById("attendance-filter"),
attendanceClosureWarning: document.getElementById("attendance-closure-warning"),
classFilter: document.getElementById("class-filter"),
selectedClassLabel: document.getElementById("selected-class-label"),
studentRows: document.getElementById("student-rows"),
emptyRoster: document.getElementById("empty-roster"),
saveIndicator: document.getElementById("save-indicator"),
behaviorStudent: document.getElementById("behavior-student"),
behaviorForm: document.getElementById("behavior-form"),
behaviorNote: document.getElementById("behavior-note"),
characterCount: document.getElementById("character-count"),
formError: document.getElementById("form-error"),

behaviorFilter: document.getElementById("behavior-filter"),
activityList: document.getElementById("activity-list"),
emptyActivity: document.getElementById("empty-activity"),
resetAttendance: document.getElementById("reset-attendance"),
studentForm: document.getElementById("student-form"),
studentName: document.getElementById("new-student-name"),
studentId: document.getElementById("new-student-id"),
newStudentPhoto: document.getElementById("new-student-photo"),
rosterGrade: document.getElementById("roster-grade"),
rosterSection: document.getElementById("roster-section"),
rosterSectionHint: document.getElementById("roster-section-hint"),
rosterClassTitle: document.getElementById("roster-class-title"),
rosterClassCount: document.getElementById("roster-class-count"),
rosterSectionPhoto: document.getElementById("roster-section-photo"),
rosterSectionIcon: document.getElementById("roster-section-icon"),
rosterSectionAdviser: document.getElementById("roster-section-adviser"),
classAttendanceLink: document.getElementById("class-attendance-link"),
emptyClassRoster: document.getElementById("empty-class-roster"),
studentProfile: document.getElementById("student-profile-panel"),
studentProfileAvatar: document.getElementById("student-profile-avatar"),
studentProfileName: document.getElementById("student-profile-name"),
studentProfileClass: document.getElementById("student-profile-class"),
studentProfileAttendance: document.getElementById("student-profile-attendance"),
studentProfileNote: document.getElementById("student-profile-note"),
studentProfileBehavior: document.getElementById("student-profile-behavior"),
studentProfileFrom: document.getElementById("student-profile-from"),
studentProfileTo: document.getElementById("student-profile-to"),
studentProfileFilterError: document.getElementById("student-profile-filter-error"),
studentAttendanceList: document.getElementById("student-attendance-list"),
studentCalendarMonth: document.getElementById("student-calendar-month"),
studentAttendanceCalendar: document.getElementById("student-attendance-calendar"),
studentAttendanceSummary: document.getElementById("student-attendance-summary"),
studentAttendanceEmpty: document.getElementById("student-attendance-empty"),
studentBehaviorList: document.getElementById("student-behavior-list"),
studentBehaviorSummary: document.getElementById("student-behavior-summary"),
studentBehaviorEmpty: document.getElementById("student-behavior-empty"),
setupGrade: document.getElementById("setup-grade"),
sectionGradeLabel: document.getElementById("section-grade-label"),
managementRows: document.getElementById("management-rows"),
noStudentsMessage: document.getElementById("no-students-message"),
gradeForm: document.getElementById("grade-form"),
sectionForm: document.getElementById("section-form"),
newGrade: document.getElementById("new-grade"),
newSection: document.getElementById("new-section"),
gradeList: document.getElementById("grade-list"),

sectionList: document.getElementById("section-list"),
sectionDetailForm: document.getElementById("section-detail-form"),
sectionDetailSelect: document.getElementById("section-detail-select"),
sectionAdviser: document.getElementById("section-adviser"),
sectionPhoto: document.getElementById("section-photo"),
sectionPhotoPreview: document.getElementById("section-photo-preview"),
exportBackup: document.getElementById("export-backup"),
importBackup: document.getElementById("import-backup"),
themeOptions: document.querySelectorAll("[data-theme-choice]"),
reduceMotionSetting: document.getElementById("reduce-motion-setting"),
settingsAccountName: document.getElementById("settings-account-name"),
settingsAccountEmail: document.getElementById("settings-account-email"),
settingsAccountRole: document.getElementById("settings-account-role"),
settingsSignOut: document.getElementById("settings-sign-out"),
toast: document.getElementById("toast")
};
let data = { students: [], staff: [], grades: defaultGrades.slice(), sectionsByGrade: {}, sectionDetails: {},
attendance: {}, attendanceHistory: {}, behavior: [], behaviorArchive: [], calendar: [], parentLinkRequests:
[], auditLog: [] };
let preferences = { theme: "light", reduceMotion: false };
let selectedRosterStudentId = "";
let profileCalendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let behaviorProfileReturnStudentId = "";
let storageReady = true;
let toastTimeout;
const byId = id => document.getElementById(id);
function localDateKey(date) {
return [
date.getFullYear(),
String(date.getMonth() + 1).padStart(2, "0"),
String(date.getDate()).padStart(2, "0")
].join("-");
}
function isValidDateKey(value) {
return typeof value === "string" &&
/^\d{4}-\d{2}-\d{2}$/.test(value) &&
localDateKey(new Date(`${value}T12:00:00`)) === value;
}
function formatDate(dateString) {
const date = new Date(`${dateString}T12:00:00`);
return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric"
}).format(date);
}
function readSavedDataCore() {
try {
const saved = localStorage.getItem(storageKey);
if (saved === null) {
return {
students: [],
staff: [],
grades: defaultGrades.slice(),

sectionsByGrade: Object.fromEntries(defaultGrades.map(grade => [grade,
defaultSections.slice()])),
sectionDetails: {},
attendance: {},
attendanceHistory: {},
behavior: [],
behaviorArchive: [],
calendar: [],
parentLinkRequests: [],
auditLog: []
};
}
const parsed = JSON.parse(saved);
if (
parsed === null ||
typeof parsed !== "object" ||
!parsed.attendance ||
typeof parsed.attendance !== "object" ||
!Array.isArray(parsed.behavior) ||
(parsed.students !== undefined && !Array.isArray(parsed.students))
) {
throw new Error("Saved student records have an invalid format.");
}
const savedStudents = Array.isArray(parsed.students)
? parsed.students.filter(student =>
student && typeof student.id === "string" && typeof student.name === "string" &&
typeof student.grade === "string" && typeof student.section === "string"
)
: [];
const staff = Array.isArray(parsed.staff)
? parsed.staff.filter(member =>
member && typeof member.id === "string" && member.id &&
typeof member.name === "string" && member.name.trim() && member.name.length <= 100
&&
typeof member.position === "string" && member.position.trim() && member.position.length <=
80 &&
typeof member.section === "string" && member.section.length <= 100
).map(member => ({
id: member.id,
name: member.name.trim(),
position: member.position.trim(),
section: member.section.trim(),
...(validProfileImage(member.photo) ? { photo: member.photo } : {})
}))
: [];
const attendanceHistory = normalizeAttendanceHistory(
parsed.attendanceHistory === undefined ? parsed.attendance : parsed.attendanceHistory,
new Set(savedStudents.map(student => student.id))
);
const sectionsByGrade = migrateSections(parsed);
const archivedStudentIds = new Set((Array.isArray(parsed.archive) ? parsed.archive : [])
.filter(entry => entry?.student && typeof entry.student.id === "string")
.map(entry => entry.student.id));
const behaviorStudentIds = new Set([...savedStudents.map(student => student.id),
...archivedStudentIds]);

return {
students: savedStudents,
staff,
grades: Array.isArray(parsed.grades) && parsed.grades.every(item => typeof item === "string") ?
parsed.grades : defaultGrades.slice(),
sectionsByGrade,
sectionDetails: migrateSectionDetails(parsed, sectionsByGrade),
attendance: normalizeAttendanceHistory(parsed.attendance, new Set(savedStudents.map(student =>
student.id))),
attendanceHistory,
behavior: parsed.behavior.filter(note =>
note && typeof note.studentId === "string" && typeof note.description === "string" &&
note.description.trim() && note.description.length <= 300 &&
typeof note.category === "string" && isValidDateKey(note.date) &&
Number.isFinite(note.createdAt) &&
isValidBehaviorType(note.type)
).map(note => ({ ...note, type: normalizeBehaviorType(note.type) })),
behaviorArchive: Array.isArray(parsed.behaviorArchive)
? parsed.behaviorArchive.filter(entry =>
entry && entry.note && behaviorStudentIds.has(entry.note.studentId) &&
typeof entry.note.description === "string" && entry.note.description.trim() &&
entry.note.description.length <= 300 &&
typeof entry.note.category === "string" && isValidDateKey(entry.note.date) &&
Number.isFinite(entry.note.createdAt) &&
isValidBehaviorType(entry.note.type) &&
Number.isFinite(entry.archivedAt) &&
(entry.archivedBy === undefined || typeof entry.archivedBy === "string")
).map(entry => ({
...entry,
note: { ...entry.note, type: normalizeBehaviorType(entry.note.type) }
}))
: [],
calendar: Array.isArray(parsed.calendar)
? parsed.calendar.filter(event => event && typeof event.id === "string" &&
isValidDateKey(event.date) && typeof event.title === "string" &&
(event.type === undefined || ["event", "non-school-day"].includes(event.type)))
: [],
parentLinkRequests: Array.isArray(parsed.parentLinkRequests)
? parsed.parentLinkRequests.filter(request => request &&
typeof request.parentEmail === "string" && typeof request.studentId === "string" &&
["pending", "approved", "denied"].includes(request.status))
: [],
auditLog: Array.isArray(parsed.auditLog)
? parsed.auditLog.filter(entry => entry && typeof entry.action === "string" &&
Number.isFinite(entry.at))
: []
};
} catch (error) {
storageReady = false;
console.error("Could not load StudentTrack records:", error);
window.setTimeout(() => showToast("Saved records could not be read. Changes will not be stored on this device.", true), 0);
return {
students: [],
staff: [],
grades: defaultGrades.slice(),

sectionsByGrade: Object.fromEntries(defaultGrades.map(grade => [grade, []])),
sectionDetails: {},
attendance: {},
attendanceHistory: {},
behavior: [],
behaviorArchive: [],
calendar: [],
parentLinkRequests: [],
auditLog: []
};
}
}
function migrateSections(parsed) {
const grades = Array.isArray(parsed.grades) && parsed.grades.every(item => typeof item === "string")
? parsed.grades
: defaultGrades;
if (
parsed.sectionsByGrade &&
typeof parsed.sectionsByGrade === "object" &&
!Array.isArray(parsed.sectionsByGrade)
) {
return Object.fromEntries(grades.map(grade => {
const sections = parsed.sectionsByGrade[grade];
return [grade, Array.isArray(sections) ? sections.filter(section => typeof section === "string") : []];
}));
}
const legacySections = Array.isArray(parsed.sections) && parsed.sections.every(item => typeof item
=== "string")
? parsed.sections
: defaultSections;
return Object.fromEntries(grades.map(grade => [grade, legacySections.slice()]));
}
function validProfileImage(value) {
return typeof value === "string" &&
value.length <= 600000 &&
/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}
function migrateSectionDetails(parsed, sectionsByGrade) {
const savedDetails = parsed.sectionDetails;
if (!savedDetails || typeof savedDetails !== "object" || Array.isArray(savedDetails)) return {};
const details = {};
for (const [grade, sections] of Object.entries(sectionsByGrade)) {
const gradeDetails = savedDetails[grade];
if (!gradeDetails || typeof gradeDetails !== "object" || Array.isArray(gradeDetails)) continue;
const sectionDetails = {};
for (const section of sections) {
const saved = gradeDetails[section];
if (!saved || typeof saved !== "object") continue;
sectionDetails[section] = {
adviser: typeof saved.adviser === "string" ? saved.adviser.slice(0, 100) : "",
...(validProfileImage(saved.photo) ? { photo: saved.photo } : {})
};
}

if (Object.keys(sectionDetails).length) details[grade] = sectionDetails;
}
return details;
}
function imageFileToDataUrl(file) {
if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
return Promise.reject(new Error("Choose a JPEG, PNG, or WebP image."));
}
if (file.size > 5 * 1024 * 1024) {
return Promise.reject(new Error("Choose an image smaller than 5 MB."));
}
return new Promise((resolve, reject) => {
const objectUrl = URL.createObjectURL(file);
const image = new Image();
image.onload = () => {
URL.revokeObjectURL(objectUrl);
const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
const canvas = document.createElement("canvas");
canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
const context = canvas.getContext("2d");
if (!context) {
reject(new Error("This browser could not process the selected image."));
return;
}
try {
context.drawImage(image, 0, 0, canvas.width, canvas.height);
const result = canvas.toDataURL("image/jpeg", 0.82);
if (!validProfileImage(result)) {
reject(new Error("The selected image could not be saved."));
return;
}
resolve(result);
} catch (error) {
reject(new Error("This browser could not process the selected image."));
}
};
image.onerror = () => {
URL.revokeObjectURL(objectUrl);
reject(new Error("The selected file is not a readable image."));
};
image.src = objectUrl;
});
}
function setAvatarImage(element, image, fallbackText) {
element.textContent = fallbackText;
element.style.backgroundImage = validProfileImage(image) ? `url("${image}")` : "";
element.classList.toggle("has-profile-photo", validProfileImage(image));
}
function normalizeAttendanceHistory(history, studentIds) {
if (!history || typeof history !== "object" || Array.isArray(history)) {
throw new Error("Saved attendance history has an invalid format.");
}

return Object.fromEntries(Object.entries(history).map(([date, day]) => {
if (!isValidDateKey(date) || !day || typeof day !== "object" || Array.isArray(day)) {
throw new Error("Saved attendance history contains an invalid day.");
}
const records = Object.entries(day);
if (records.some(([studentId, status]) =>
!studentIds.has(studentId) || !attendanceStatuses.includes(status)
)) {
throw new Error("Saved attendance history contains an invalid student record.");
}
return [date, Object.fromEntries(records)];
}));
}
function persistData() {
if (!storageReady) {
elements.saveIndicator.textContent = "Not saved";
showToast("This browser cannot save records. Your change is only temporary.", true);
return false;
}
try {
localStorage.setItem(storageKey, JSON.stringify(data));
elements.saveIndicator.textContent = "Saved on this device";
return true;
} catch (error) {
storageReady = false;
elements.saveIndicator.textContent = "Not saved";
console.error("Could not save StudentTrack records:", error);
showToast("Could not save this change on the device. Check browser storage settings.", true);
return false;
}
}
function showToast(message, isError = false) {
window.clearTimeout(toastTimeout);
elements.toast.textContent = message;
elements.toast.classList.toggle("error-toast", isError);
elements.toast.hidden = false;
toastTimeout = window.setTimeout(() => {
elements.toast.hidden = true;
}, 4200);
}
function readPreferences() {
try {
const saved = localStorage.getItem(settingsKey);
if (!saved) return { ...prefDefaults };
const p = JSON.parse(saved);
return {
theme: ["light", "dark", "system"].includes(p.theme) ? p.theme : "light",
reduceMotion: p.reduceMotion === true,
textSize: ["md", "lg", "xl"].includes(p.textSize) ? p.textSize : "md",
highContrast: p.highContrast === true,
easyFont: p.easyFont === true,
startView: Object.hasOwn(startTargets, p.startView) ? p.startView : "overview"
};

} catch (error) {
console.error("Could not read StudentTrack preferences:", error);
return { ...prefDefaults };
}
}
function savePreferences() {
try {
localStorage.setItem(settingsKey, JSON.stringify(preferences));
return true;
} catch (error) {
console.error("Could not save StudentTrack preferences:", error);
showToast("Your display preference could not be saved on this device.", true);
return false;
}
}
function applyPreferences() {
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const darkMode = preferences.theme === "dark" || (preferences.theme === "system" &&
systemPrefersDark);
document.documentElement.dataset.theme = darkMode ? "dark" : "light";
document.documentElement.classList.toggle("reduce-motion", preferences.reduceMotion);
const themeColor = document.querySelector('meta[name="theme-color"]');
if (themeColor) themeColor.content = darkMode ? "#1a2821" : "#193d35";
for (const option of elements.themeOptions) {
option.setAttribute("aria-pressed", String(option.dataset.themeChoice === preferences.theme));
}
elements.reduceMotionSetting.checked = preferences.reduceMotion;
applyExtraPreferences();
}
function renderSettingsAccount() {
if (!account) return;
elements.settingsAccountName.textContent = account.name;
elements.settingsAccountEmail.textContent = account.email;
elements.settingsAccountRole.textContent = account.role === "admin" ? "School administrator" :
"Teacher";
const twoFactorButton = byId("settings-2fa");
twoFactorButton.textContent = account.is2faEnabled ? "2FA is enabled" : "Set up 2FA";
twoFactorButton.disabled = Boolean(account.is2faEnabled);
}
function currentAttendance() {
if (!data.attendance[attendanceDate]) data.attendance[attendanceDate] = {};
return data.attendance[attendanceDate];
}
function nonSchoolDayEvent(date) {
return (data.calendar || []).find(event => event.date === date && event.type === "non-school-day") ||
null;
}
function calculateAttendanceRate(present, late, absent) {
const confirmedNonExcused = present + late + absent;
return confirmedNonExcused
? Math.round(((present + late) / confirmedNonExcused) * 100)
: 0;
}

function attendanceTrendData() {
const start = elements.trendStart.value;
const end = elements.trendEnd.value;
if (!isValidDateKey(start) || !isValidDateKey(end) || start > end) {
return { rows: [], error: "Choose a valid date range with the start date on or before the end date." };
}
const rangeLength = Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
86400000) + 1;
if (rangeLength > 366) {
return { rows: [], error: "Choose a date range of no more than 366 days." };
}
const rows = [];
const cursor = new Date(`${start}T12:00:00`);
const lastDay = new Date(`${end}T12:00:00`);
while (cursor <= lastDay) {
const date = localDateKey(cursor);
const day = data.attendanceHistory[date] || {};
const attendanceExpected = !nonSchoolDayEvent(date);
const counts = { present: 0, late: 0, absent: 0, excused: 0 };
for (const student of students) {
const status = day[student.id];
if (Object.hasOwn(counts, status)) counts[status] += 1;
}
const recorded = counts.present + counts.late + counts.absent + counts.excused;
rows.push({
date,
...counts,
unmarked: attendanceExpected ? Math.max(0, students.length - recorded) : 0,
rate: calculateAttendanceRate(counts.present, counts.late, counts.absent),
hasRecords: recorded > 0
});
cursor.setDate(cursor.getDate() + 1);
}
return { rows, error: "" };
}
function renderAttendanceTrends() {
const { rows, error } = attendanceTrendData();
elements.trendError.textContent = error;
elements.trendError.hidden = !error;
elements.trendChart.replaceChildren();
elements.trendSummary.replaceChildren();
if (error) {
elements.trendEmpty.hidden = true;
return;
}
const totals = rows.reduce((sum, row) => ({
present: sum.present + row.present,
late: sum.late + row.late,
absent: sum.absent + row.absent,
excused: sum.excused + row.excused,
unmarked: sum.unmarked + row.unmarked
}), { present: 0, late: 0, absent: 0, excused: 0, unmarked: 0 });

const hasRecords = rows.some(row => row.hasRecords);
const summaryRate = calculateAttendanceRate(totals.present, totals.late, totals.absent);
for (const [label, value] of [
["Attendance rate", `${summaryRate}%`],
["Present", String(totals.present)],
["Late", String(totals.late)],
["Absent", String(totals.absent)],
["Excused", String(totals.excused)],
["Unmarked", String(totals.unmarked)]
]) {
const item = createElement("span", "trend-summary-item");
item.append(createElement("small", "", label), createElement("strong", "", value));
elements.trendSummary.append(item);
}
for (const rowData of rows) {
const row = createElement("article", `attendance-trend-row${rowData.hasRecords ? "" : " no-trend-records"}`);
const date = createElement("time", "attendance-trend-date", formatDate(rowData.date));
date.dateTime = rowData.date;
const counts = createElement(
"span",
"attendance-trend-counts",
`${rowData.present} present  -  ${rowData.late} late  -  ${rowData.absent} absent  - 
${rowData.excused} excused  -  ${rowData.unmarked} unmarked`
);
const track = createElement("div", "attendance-trend-track");
const fill = createElement("span", "attendance-trend-fill");
fill.style.width = `${rowData.hasRecords ? rowData.rate : 0}%`;
track.setAttribute("role", "progressbar");
track.setAttribute("aria-label", `${formatDate(rowData.date)} attendance rate`);
track.setAttribute("aria-valuemin", "0");
track.setAttribute("aria-valuemax", "100");
track.setAttribute("aria-valuenow", String(rowData.rate));
track.append(fill);
row.append(date, counts, track, createElement("strong", "attendance-trend-rate", rowData.hasRecords
? `${rowData.rate}%` : "-- "));
elements.trendChart.append(row);
}
elements.trendEmpty.hidden = hasRecords;
}
function updateSummary() {
const attendance = currentAttendance();
const classValue = elements.classFilter.value;
const [selectedGrade, selectedSection] = classValue === "all" ? [null, null] : classValue.split("::");
elements.selectedClassLabel.textContent = selectedGrade && selectedSection
? `${selectedGrade}  -  ${selectedSection}`
: "All grades  -  all sections";
const classStudents = students.filter(student =>
(!selectedGrade || student.grade === selectedGrade) &&
(!selectedSection || student.section === selectedSection)
);
const countStatus = status => classStudents.filter(student => attendance[student.id] === status).length;
const present = countStatus("present");

const absent = countStatus("absent");
const late = countStatus("late");
const excused = countStatus("excused");
const attendanceExpected = !nonSchoolDayEvent(attendanceDate);
const unmarked = attendanceExpected ? classStudents.length - present - absent - late - excused : 0;
const schoolPresent = students.filter(student => attendance[student.id] === "present").length;
const schoolLate = students.filter(student => attendance[student.id] === "late").length;
const schoolAbsent = students.filter(student => attendance[student.id] === "absent").length;
const schoolExcused = students.filter(student => attendance[student.id] === "excused").length;
const schoolUnmarked = attendanceExpected
? students.length - schoolPresent - schoolLate - schoolAbsent - schoolExcused
: 0;
const schoolAttendanceRate = calculateAttendanceRate(schoolPresent, schoolLate, schoolAbsent);
const schoolStudentIds = new Set(students.map(student => student.id));
const schoolNotesToday = data.behavior.filter(note =>
note.date === attendanceDate && schoolStudentIds.has(note.studentId)
).length;
elements.total.textContent = String(students.length);
elements.present.textContent = String(schoolPresent);
elements.presentFoot.textContent = `${schoolAttendanceRate}% of marked, non-excused records`;
elements.absent.textContent = String(schoolAbsent);
elements.unmarkedStat.textContent = String(schoolUnmarked);
byId("stat-late").textContent = String(schoolLate);
byId("stat-excused").textContent = String(schoolExcused);
byId("late-count").textContent = String(late);
byId("excused-count").textContent = String(excused);
elements.behaviorCount.textContent = String(schoolNotesToday);
elements.presentCount.textContent = String(present);
elements.absentCount.textContent = String(absent);
elements.unmarkedCount.textContent = String(unmarked);
elements.unmarkedNav.textContent = String(unmarked);
renderAttendanceTrends();
renderSectionAttendance(attendance);
renderAttention();
renderArchive();
}
let showEmptySections = false;
function renderSectionAttendance(attendance) {
elements.sectionAttendanceDate.textContent = formatDate(attendanceDate);
elements.sectionAttendanceTotal.textContent =
`${students.length} student${students.length === 1 ? "" : "s"} school-wide`;
elements.sectionAttendanceList.replaceChildren();
const attendanceExpected = !nonSchoolDayEvent(attendanceDate);
let sectionCount = 0;
for (const grade of data.grades) {
const sections = data.sectionsByGrade[grade] || [];
if (!sections.length) continue;
const visibleSections = showEmptySections
? sections
: sections.filter(section => students.some(student => student.grade === grade && student.section
=== section));

if (!visibleSections.length) continue;
const gradeGroup = createElement("section", "section-attendance-grade");
const gradeHeading = createElement("h3", "section-attendance-grade-title", grade);
const sectionGrid = createElement("div", "section-attendance-grid");
gradeGroup.append(gradeHeading, sectionGrid);
for (const section of visibleSections) {
const sectionStudents = students.filter(student =>
student.grade === grade && student.section === section
);
const present = sectionStudents.filter(student => attendance[student.id] === "present").length;
const absent = sectionStudents.filter(student => attendance[student.id] === "absent").length;
const late = sectionStudents.filter(student => attendance[student.id] === "late").length;
const excused = sectionStudents.filter(student => attendance[student.id] === "excused").length;
const unmarked = attendanceExpected ? sectionStudents.length - present - absent - late - excused :
0;
const attendanceRate = calculateAttendanceRate(present, late, absent);
const card = createElement("article", "section-attendance-card");
const header = createElement("div", "section-attendance-card-heading");
header.append(
createElement("h4", "", section),
createElement("strong", "section-attendance-rate", `${attendanceRate}% attendance`)
);
const progressTrack = createElement("div", "section-attendance-progress");
progressTrack.setAttribute("role", "progressbar");
progressTrack.setAttribute("aria-label", `${grade}, ${section} attendance`);
progressTrack.setAttribute("aria-valuemin", "0");
progressTrack.setAttribute("aria-valuemax", "100");
progressTrack.setAttribute("aria-valuenow", String(attendanceRate));
const progressFill = createElement("span", "section-attendance-progress-fill");
progressFill.style.width = `${attendanceRate}%`;
progressTrack.append(progressFill);
const counts = createElement("div", "section-attendance-counts");
counts.append(
createElement("span", "section-count-present", `${present} present`),
createElement("span", "section-count-absent", `${absent} absent`),
createElement("span", "section-count-late", `${late} late`),
createElement("span", "section-count-excused", `${excused} excused`),
createElement("span", "section-count-unmarked", `${unmarked} not marked`)
);
const rosterSize = createElement(
"p",
"section-attendance-roster",
`${sectionStudents.length} student${sectionStudents.length === 1 ? "" : "s"} in roster`
);
card.append(header, progressTrack, counts, rosterSize);
sectionGrid.append(card);
sectionCount += 1;
}
elements.sectionAttendanceList.append(gradeGroup);
}

const totalSections = data.grades.reduce((sum, grade) => sum + (data.sectionsByGrade[grade] ||
[]).length, 0);
const hiddenCount = showEmptySections ? 0 : totalSections - sectionCount;
const bar = document.getElementById("empty-sections-bar");
const barLabel = document.getElementById("empty-sections-label");
const barToggle = document.getElementById("empty-sections-toggle");
if (bar && barLabel && barToggle) {
bar.hidden = students.length === 0 || !(hiddenCount > 0 || showEmptySections);
barLabel.textContent = hiddenCount > 0
? `${hiddenCount} section${hiddenCount === 1 ? "" : "s"} with no students ${hiddenCount === 1
? "is" : "are"} hidden.`
: "Showing every section, including empty ones.";
barToggle.textContent = showEmptySections ? "Hide empty sections" : "Show empty sections";
barToggle.setAttribute("aria-pressed", String(showEmptySections));
}
if (!sectionCount) {
const empty = createElement("div", "section-attendance-empty onboarding-empty");
if (totalSections === 0) {
empty.append(createElement("p", "", "No sections have been set up yet."));
} else {
empty.append(
createElement("strong", "", "No students on the roster yet"),
createElement("p", "", "Add your first class roster and today's attendance will appear here, section by section.")
);
const link = createElement("a", "button button-primary", "Add students");
link.href = "#student-management";
empty.append(link);
}
elements.sectionAttendanceList.append(empty);
}
}
function createElement(tag, className, text) {
const element = document.createElement(tag);
if (className) element.className = className;
if (text !== undefined) element.textContent = text;
return element;
}
function renderStudents() {
const attendance = currentAttendance();
const closure = nonSchoolDayEvent(attendanceDate);
elements.attendanceClosureWarning.hidden = !closure;
elements.attendanceClosureWarning.textContent = closure
? `${formatDate(attendanceDate)} is marked as a non-school day (${closure.title}); attendance
marking is disabled.`
: "";
const bulkMarkButton = byId("mark-all-present");
bulkMarkButton.disabled = Boolean(closure);
bulkMarkButton.title = closure ? "Attendance marking is disabled for this non-school day." : "";
const query = elements.search.value.trim().toLocaleLowerCase();
const statusFilter = elements.attendanceFilter.value;
const classValue = elements.classFilter.value;
const [selectedGrade, selectedSection] = classValue === "all" ? [null, null] : classValue.split("::");

const visibleStudents = students.filter(student => {
const status = attendance[student.id] || "unmarked";
const matchesQuery = `${student.name} ${student.id}`.toLocaleLowerCase().includes(query);
const matchesClass = (!selectedGrade || student.grade === selectedGrade) &&
(!selectedSection || student.section === selectedSection);
return matchesQuery && matchesClass && (statusFilter === "all" || statusFilter === status);
});
elements.studentRows.replaceChildren();
for (const student of visibleStudents) {
const status = attendance[student.id] || "unmarked";
const row = document.createElement("tr");
const studentCell = document.createElement("td");
const identity = createElement("button", "student-info student-profile-trigger");
identity.type = "button";
identity.setAttribute("aria-pressed", String(selectedRosterStudentId === student.id));
identity.setAttribute(
"aria-label",
`${selectedRosterStudentId === student.id ? "Close" : "View"} ${student.name}'s profile,
attendance, and behavior records`
);
identity.addEventListener("click", () => openStudentProfile(student.id));
const initials = createElement("span", "student-initials", student.initials || initialsFor(student.name));
initials.style.backgroundColor = student.color;
initials.style.color = student.ink;
setAvatarImage(initials, student.photo, student.initials || initialsFor(student.name));
const names = document.createElement("span");
names.append(createElement("strong", "", student.name), createElement("small", "", student.id));
identity.append(initials, names);
studentCell.append(identity);
const classCell = createElement("td", "", `${student.grade}  -  ${student.section}`);
const statusCell = document.createElement("td");
const statusLabel = createElement("span", `attendance-status ${status}`, attendanceLabels[status]);
statusLabel.prepend(createElement("i"));
statusCell.append(statusLabel);
const actionCell = document.createElement("td");
const actions = createElement("div", "mark-actions");
for (const choice of [...attendanceStatuses, "unmarked"]) {
actions.append(attendanceButton(student, choice, status === choice));
}
actionCell.append(actions);
row.append(studentCell, classCell, statusCell, actionCell);
elements.studentRows.append(row);
}
elements.emptyRoster.hidden = visibleStudents.length > 0;
}
function attendanceButton(student, status, active) {
const button = createElement("button", `mark-button ${status}-choice${active ? " is-active" : ""}`,
attendanceLabels[status]);
button.type = "button";
button.setAttribute("aria-pressed", String(active));
button.setAttribute("aria-label", status === "unmarked"
? `Clear attendance for ${student.name}`
: `Mark ${student.name} ${attendanceLabels[status]}`);
const closure = nonSchoolDayEvent(attendanceDate);
if (closure && status !== "unmarked") {
button.disabled = true;
button.title = `Attendance marking is disabled because ${formatDate(attendanceDate)} is a non-
school day.`;
}
button.addEventListener("click", () => {
if (status !== "unmarked" && nonSchoolDayEvent(attendanceDate)) {
showToast("Attendance cannot be marked on a non-school day.", true);
return;
}
const attendance = currentAttendance();
const previous = attendance[student.id] || "unmarked";
if (previous === status) return;
const isCorrection = previous !== "unmarked";
if (status === "unmarked") delete attendance[student.id];

else attendance[student.id] = status;
if (!data.attendanceHistory[attendanceDate]) data.attendanceHistory[attendanceDate] = {};
if (status === "unmarked") delete data.attendanceHistory[attendanceDate][student.id];
else data.attendanceHistory[attendanceDate][student.id] = status;
logAttendance(student.id, status, previous);
recordAudit(isCorrection ? "attendance-corrected" : "attendance-recorded", {
studentId: student.id,
date: attendanceDate,
previousStatus: previous,
status
});
updateSummary();
renderStudents();
const saved = persistData();
showToast(`${student.name}: ${attendanceLabels[status].toLowerCase()}${saved ? "  -  saved on this device" : "  -  not saved"}.`, !saved);
renderManagedStudents();
});
return button;
}
function populateStudentOptions() {
const selected = elements.behaviorStudent.value;
elements.behaviorStudent.replaceChildren(new Option("Choose a student", ""));
for (const student of students) {
const option = document.createElement("option");
option.value = student.id;
option.textContent = `${student.name}  -  ${student.id}`;
elements.behaviorStudent.append(option);
}
if (students.some(student => student.id === selected)) elements.behaviorStudent.value = selected;
}
function refreshClassControls() {
const selectedGrade = elements.rosterGrade.value;
const selectedSection = elements.rosterSection.value;
const selectedClass = elements.classFilter.value;
const setupGrade = elements.setupGrade.value;
elements.rosterGrade.replaceChildren();
elements.rosterGrade.add(new Option("Choose a grade", ""));
for (const grade of data.grades) elements.rosterGrade.add(new Option(grade, grade));
if (data.grades.includes(selectedGrade)) elements.rosterGrade.value = selectedGrade;
else if (data.grades.length) elements.rosterGrade.value = data.grades[0];
refreshRosterSections(selectedSection);
elements.setupGrade.replaceChildren();
for (const grade of data.grades) elements.setupGrade.add(new Option(grade, grade));
if (data.grades.includes(setupGrade)) elements.setupGrade.value = setupGrade;
else if (elements.rosterGrade.value && data.grades.includes(elements.rosterGrade.value))
elements.setupGrade.value = elements.rosterGrade.value;
if (!elements.setupGrade.value && data.grades.length) elements.setupGrade.selectedIndex = 0;
elements.classFilter.replaceChildren(new Option("All grades & sections", "all"));
for (const grade of data.grades) {
const group = document.createElement("optgroup");

group.label = grade;
for (const section of data.sectionsByGrade[grade] || []) {
const value = `${grade}::${section}`;
group.append(new Option(section, value));
}
if (group.children.length) elements.classFilter.append(group);
}
if ([...elements.classFilter.options].some(option => option.value === selectedClass)) {
elements.classFilter.value = selectedClass;
} else {
elements.classFilter.value = "all";
}
refreshBulkGradeChoices();
renderGradeList();
renderSectionList();
renderManagedStudents();
}
function refreshBulkGradeChoices() {
const gradeSelect = byId("bulk-grade");
const previousGrade = gradeSelect.value;
gradeSelect.replaceChildren(new Option("Choose a grade", ""));
for (const grade of data.grades) gradeSelect.add(new Option(grade, grade));
if (data.grades.includes(previousGrade)) gradeSelect.value = previousGrade;
else if (data.grades.includes(elements.rosterGrade.value)) gradeSelect.value =
elements.rosterGrade.value;
refreshBulkSectionChoices();
}
function refreshBulkSectionChoices(preferredSection = "") {
const grade = byId("bulk-grade").value;
const sectionSelect = byId("bulk-section");
const currentSection = preferredSection || sectionSelect.value;
const sections = data.sectionsByGrade[grade] || [];
sectionSelect.replaceChildren(new Option(grade ? "Choose a section" : "Choose a grade first", ""));
for (const section of sections) sectionSelect.add(new Option(section, section));
if (sections.includes(currentSection)) sectionSelect.value = currentSection;
else if (grade === elements.rosterGrade.value && sections.includes(elements.rosterSection.value))
sectionSelect.value = elements.rosterSection.value;
sectionSelect.disabled = !grade || sections.length === 0;
}
function refreshRosterSections(preferredSection = "") {
const grade = elements.rosterGrade.value;
const sections = data.sectionsByGrade[grade] || [];
elements.rosterSection.replaceChildren();
elements.rosterSection.add(new Option(grade ? "Choose a section" : "Choose a grade first", ""));
for (const section of sections) elements.rosterSection.add(new Option(section, section));
if (sections.includes(preferredSection)) elements.rosterSection.value = preferredSection;
else if (sections.length) elements.rosterSection.value = sections[0];
elements.rosterSection.disabled = !grade || sections.length === 0;
elements.rosterSectionHint.textContent = grade
? (sections.length ? `${sections.length} section${sections.length === 1 ? "" : "s"} in ${grade}` : `No
sections in ${grade} yet`)
: "Choose a grade first";
const submitButton = elements.studentForm.querySelector('button[type="submit"]');

submitButton.disabled = !grade || !elements.rosterSection.value;
submitButton.title = elements.rosterSection.value ? "" : "Choose a grade and section first.";
if (selectedRosterStudentId) {
const selected = students.find(student => student.id === selectedRosterStudentId);
if (!selected || selected.grade !== grade || selected.section !== elements.rosterSection.value) {
selectedRosterStudentId = "";
}
}
renderManagedStudents();
}
function renderGradeList() {
elements.gradeList.replaceChildren();
for (const grade of data.grades) {
const item = createElement("div", `grade-list-item${elements.setupGrade.value === grade ? " active" :
""}`);
const choose = createElement("button", "grade-choice", grade);
choose.type = "button";
choose.setAttribute("aria-pressed", String(elements.setupGrade.value === grade));
choose.addEventListener("click", () => {
elements.setupGrade.value = grade;
refreshClassControls();
});
const inUse = students.some(student => student.grade === grade) ||
(data.archive || []).some(entry => entry?.student?.grade === grade);
const remove = createElement("button", "remove-tag", "Remove");
remove.type = "button";
remove.setAttribute("aria-label", inUse ? `${grade} has roster or archived students` : `Remove
${grade}`);
remove.title = inUse ? "Move or permanently delete this grade's active and archived students first." :
`Remove ${grade}`;
remove.disabled = inUse;
if (!inUse) {
remove.addEventListener("click", () => {
if (!window.confirm(`Remove ${grade} and its sections?`)) return;
data.grades = data.grades.filter(item => item !== grade);
delete data.sectionsByGrade[grade];
delete data.sectionDetails[grade];
const saved = persistData();
refreshClassControls();
updateSummary();
renderStudents();
showToast(`${grade} and its sections were removed${saved ? "" : " for this session only; they were not saved"}.`, !saved);
});
}
item.append(choose, remove);
elements.gradeList.append(item);
}
}
function renderSectionList() {
const grade = elements.setupGrade.value;
elements.sectionGradeLabel.textContent = grade || "selected grade";
elements.sectionList.replaceChildren();
const sections = data.sectionsByGrade[grade] || [];

const previousSection = elements.sectionDetailSelect.value;
elements.sectionDetailSelect.replaceChildren(new Option("Choose a section", ""));
for (const section of sections) elements.sectionDetailSelect.add(new Option(section, section));
if (sections.includes(previousSection)) elements.sectionDetailSelect.value = previousSection;
else if (sections.length) elements.sectionDetailSelect.value = sections[0];
for (const section of sections) {
const chip = createElement("span", `setup-tag${elements.sectionDetailSelect.value === section ? " selected" : ""}`);
const choose = createElement("button", "section-choice", section);
choose.type = "button";
choose.setAttribute("aria-pressed", String(elements.sectionDetailSelect.value === section));
choose.addEventListener("click", () => {
elements.sectionDetailSelect.value = section;
renderSectionList();
});
const inUse = students.some(student => student.grade === grade && student.section === section) ||
(data.archive || []).some(entry => entry?.student?.grade === grade && entry.student.section ===
section);
const remove = createElement("button", "remove-tag", "Remove");
remove.type = "button";
remove.setAttribute("aria-label", inUse ? `${grade} ${section} has roster or archived students` :
`Remove ${section} from ${grade}`);
remove.title = inUse ? "Move or permanently delete this section's active and archived students first." :
`Remove ${section} from ${grade}`;
remove.disabled = inUse;
if (!inUse) {
remove.addEventListener("click", () => {
data.sectionsByGrade[grade] = data.sectionsByGrade[grade].filter(item => item !== section);
if (data.sectionDetails[grade]) delete data.sectionDetails[grade][section];
const saved = persistData();
refreshClassControls();
renderStudents();
updateSummary();
showToast(`${section} was removed from ${grade}${saved ? "" : " for this session only; it was not saved"}.`, !saved);
});
}
chip.append(choose, remove);
elements.sectionList.append(chip);
}
if (!grade || !sections.length) {
elements.sectionList.append(createElement("span", "section-list-empty", "No sections for this grade yet."));
}
renderSectionDetailFields();
}
function renderSectionDetailFields() {
const grade = elements.setupGrade.value;
const section = elements.sectionDetailSelect.value;
const details = data.sectionDetails?.[grade]?.[section] || {};
elements.sectionAdviser.value = details.adviser || "";
elements.sectionPhotoPreview.hidden = !validProfileImage(details.photo);
if (validProfileImage(details.photo)) elements.sectionPhotoPreview.src = details.photo;
const disabled = !grade || !section;
elements.sectionDetailForm.querySelector('button[type="submit"]').disabled = disabled;

elements.sectionDetailForm.querySelectorAll("input").forEach(input => { input.disabled = disabled; });
}
function renderManagedStudents() {
elements.managementRows.replaceChildren();
const grade = elements.rosterGrade.value;
const section = elements.rosterSection.value;
const classSelected = Boolean(grade && section);
const classStudents = students.filter(student => student.grade === grade && student.section ===
section);
elements.rosterClassTitle.textContent = classSelected ? `${grade}  -  ${section}` : "Choose a grade and section";
elements.rosterClassCount.textContent = `${classStudents.length} student${classStudents.length === 1
? "" : "s"}`;
const sectionDetails = data.sectionDetails?.[grade]?.[section] || {};
elements.rosterSectionAdviser.hidden = !classSelected || !sectionDetails.adviser;
elements.rosterSectionAdviser.textContent = sectionDetails.adviser ? `Classroom adviser:
${sectionDetails.adviser}` : "";
elements.rosterSectionPhoto.hidden = !classSelected || !validProfileImage(sectionDetails.photo);
elements.rosterSectionIcon.hidden = classSelected && validProfileImage(sectionDetails.photo);
if (validProfileImage(sectionDetails.photo)) elements.rosterSectionPhoto.src = sectionDetails.photo;
elements.noStudentsMessage.hidden = classSelected;
elements.emptyClassRoster.hidden = !classSelected || classStudents.length > 0;
elements.studentForm.hidden = !classSelected;
document.querySelector(".management-roster").hidden = !classSelected || classStudents.length === 0;
byId("section-archive-box").hidden = !classSelected;
renderArchive();
elements.studentProfile.hidden = !classStudents.some(student => student.id ===
selectedRosterStudentId);
if (!classSelected || classStudents.length === 0) {
selectedRosterStudentId = "";
return;
}
const attendance = currentAttendance();
for (const student of classStudents) {
const row = document.createElement("tr");
const identityCell = document.createElement("td");
const identity = createElement("button", "student-info student-profile-trigger");
identity.type = "button";
identity.setAttribute("aria-pressed", String(selectedRosterStudentId === student.id));
identity.setAttribute(
"aria-label",
`${selectedRosterStudentId === student.id ? "Close" : "View"} ${student.name}'s profile,
attendance, and behavior records`
);
identity.addEventListener("click", () => openStudentProfile(student.id));
const initials = createElement("span", "student-initials", student.initials || initialsFor(student.name));
initials.style.backgroundColor = student.color || "#eef0ff";
initials.style.color = student.ink || "#6772af";
setAvatarImage(initials, student.photo, student.initials || initialsFor(student.name));
const names = document.createElement("span");
names.append(createElement("strong", "", student.name), createElement("small", "", student.id));
identity.append(initials, names);
identityCell.append(identity);
const status = attendance[student.id] || "unmarked";

const attendanceCell = document.createElement("td");
const statusLabel = createElement(
"span",
`attendance-status ${status}`,
`${attendanceLabels[status]} today`
);
statusLabel.prepend(createElement("i"));
attendanceCell.append(statusLabel);
const actionCell = document.createElement("td");
const actionGroup = createElement("div", "student-row-actions");
const isSelected = student.id === selectedRosterStudentId;
const chooseButton = createElement("button", "choose-student-button", isSelected ? "Close profile" :
"View profile");
chooseButton.type = "button";
chooseButton.setAttribute("aria-pressed", String(isSelected));
chooseButton.setAttribute("aria-label", `${isSelected ? "Close" : "View"} ${student.name}'s profile`);
chooseButton.addEventListener("click", () => openStudentProfile(student.id));
const hasHistory = data.behavior.some(note => note.studentId === student.id) ||
Object.values(data.attendance).some(day => day && Object.prototype.hasOwnProperty.call(day,
student.id));
const removeButton = createElement("button", "remove-student", "Archive student");
removeButton.type = "button";
removeButton.title = hasHistory
? `Archive ${student.name}; their records are kept`
: `Remove ${student.name} from the roster`;
removeButton.addEventListener("click", () => {
const message = hasHistory
? `Remove ${student.name} from the roster? Their attendance and behavior records are kept
permanently and can be restored from the archived students list in this section.`
: `Remove ${student.name} from the roster?`;
if (!window.confirm(message)) return;
archiveStudent(student);
const saved = persistData();
if (selectedRosterStudentId === student.id) selectedRosterStudentId = "";
renderManagedStudents();
renderStudents();
populateStudentOptions();
updateSummary();
refreshClassControls();
renderBehavior();
showToast(
`${student.name} was archived. Their records are kept in this section and can be restored
here${saved ? "" : " (this session only; the change was not saved)"}.`,
!saved
);
});
actionGroup.append(chooseButton, removeButton);
actionCell.append(actionGroup);
row.append(identityCell, attendanceCell, actionCell);
if (student.id === selectedRosterStudentId) row.classList.add("selected-student-row");
elements.managementRows.append(row);
}
if (selectedRosterStudentId) renderStudentProfile(students.find(student => student.id ===
selectedRosterStudentId));

else elements.studentProfile.hidden = true;
}
function openStudentProfile(studentId) {
const student = students.find(item => item.id === studentId);
if (!student) return;
const closingProfile = selectedRosterStudentId === studentId;
elements.rosterGrade.value = student.grade;
refreshRosterSections(student.section);
selectedRosterStudentId = closingProfile ? "" : studentId;
renderManagedStudents();
if (location.hash !== "#student-management") {
history.pushState(null, "", "#student-management");
showTeacherView("students");
}
if (closingProfile) return;
elements.studentProfile.scrollIntoView({
behavior: preferences.reduceMotion ? "auto" : "smooth",
block: "start"
});
}
function renderStudentAttendanceCalendar(student, studentAudit) {
const year = profileCalendarMonth.getFullYear();
const month = profileCalendarMonth.getMonth();
const firstWeekday = new Date(year, month, 1).getDay();
const daysInMonth = new Date(year, month + 1, 0).getDate();
const selectedDate = elements.studentProfileFrom.value &&
elements.studentProfileFrom.value === elements.studentProfileTo.value
? new Date(`${elements.studentProfileFrom.value}T12:00:00`)
: null;
const selectedMonthDay = selectedDate && selectedDate.getFullYear() === year &&
selectedDate.getMonth() === month
? selectedDate.getDate()
: 1;
elements.studentCalendarMonth.textContent = new Intl.DateTimeFormat("en-PH", {
month: "long",
year: "numeric"
}).format(profileCalendarMonth);
elements.studentAttendanceCalendar.replaceChildren();
for (let weekday = 0; weekday < 7; weekday += 1) {
const header = createElement(
"span",
"student-calendar-weekday",
new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(2023, 0, 1 + weekday))
);
elements.studentAttendanceCalendar.append(header);
}
for (let blank = 0; blank < firstWeekday; blank += 1) {
const spacer = createElement("span", "student-calendar-spacer");
spacer.setAttribute("aria-hidden", "true");
elements.studentAttendanceCalendar.append(spacer);
}
const latestByDate = new Map();

for (const entry of studentAudit) {
if (!latestByDate.has(entry.date) || latestByDate.get(entry.date).at < entry.at) {
latestByDate.set(entry.date, entry);
}
}
for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth += 1) {
const date = localDateKey(new Date(year, month, dayOfMonth));
const audit = latestByDate.get(date);
const auditStatus = audit?.status === "cleared" || audit?.status === "unmarked" ? "unmarked" :
audit?.status;
const status = auditStatus || data.attendanceHistory[date]?.[student.id] || "";
const button = createElement(
"button",
`student-calendar-day ${status || "no-record"}`,
String(dayOfMonth)
);
button.type = "button";
button.setAttribute(
"aria-label",
`${formatDate(date)}: ${status ? attendanceLabels[status] : "No record"}`
);
button.title = status ? attendanceLabels[status] : "No attendance record";
const isSelectedDate = elements.studentProfileFrom.value === date &&
elements.studentProfileTo.value === date;
button.setAttribute("aria-pressed", String(isSelectedDate));
button.tabIndex = dayOfMonth === selectedMonthDay ? 0 : -1;
button.addEventListener("click", () => {
elements.studentProfileFrom.value = date;
elements.studentProfileTo.value = date;
renderStudentProfile(student);
});
button.addEventListener("keydown", event => {
const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
if (!Object.hasOwn(offsets, event.key)) return;
event.preventDefault();
const days = [...elements.studentAttendanceCalendar.querySelectorAll(".student-calendar-day")];
const currentIndex = days.indexOf(button);
const targetIndex = Math.max(0, Math.min(days.length - 1, currentIndex + offsets[event.key]));
days[targetIndex].focus();
});
elements.studentAttendanceCalendar.append(button);
}
}
function renderStudentProfile(student) {
if (!student) {
elements.studentProfile.hidden = true;
return;
}
const [color, ink] = [student.color || "#eef0ff", student.ink || "#6772af"];
setAvatarImage(elements.studentProfileAvatar, student.photo, student.initials ||
initialsFor(student.name));
elements.studentProfileAvatar.style.backgroundColor = color;
elements.studentProfileAvatar.style.color = ink;
elements.studentProfileName.textContent = student.name;

elements.studentProfileClass.textContent = `${student.grade}  -  ${student.section}  - 
${student.id}`;
const status = currentAttendance()[student.id] || "unmarked";
elements.studentProfileAttendance.textContent = attendanceLabels[status];
elements.studentProfileAttendance.className = `profile-attendance ${status}`;
const rangeStart = elements.studentProfileFrom.value;
const rangeEnd = elements.studentProfileTo.value;
const invalidRange = Boolean(rangeStart && rangeEnd && rangeStart > rangeEnd);
const hasDateFilter = Boolean(rangeStart || rangeEnd);
elements.studentProfileFilterError.textContent = invalidRange
? "The start date must be on or before the end date."
: "";
elements.studentProfileFilterError.hidden = !invalidRange;
const dateInRange = date => !invalidRange && (!rangeStart || date >= rangeStart) && (!rangeEnd || date
<= rangeEnd);
const latestNote = data.behavior
.filter(note => note.studentId === student.id && dateInRange(note.date))
.sort((left, right) => right.createdAt - left.createdAt)[0];
elements.studentProfileNote.textContent = latestNote
? `${behaviorTypeLabel(latestNote.type)}  -  ${latestNote.category}: ${latestNote.description}`
: "No behavior notes recorded.";
const studentAudit = auditLog().filter(entry => entry.studentId === student.id);
renderStudentAttendanceCalendar(student, studentAudit);
const historyDates = new Set([
...Object.entries(data.attendanceHistory)
.filter(([, dailyAttendance]) => dailyAttendance &&
attendanceStatuses.includes(dailyAttendance[student.id]))
.map(([date]) => date),
...studentAudit.map(entry => entry.date)
]);
const attendanceHistory = [...historyDates].filter(dateInRange).sort((left, right) =>
right.localeCompare(left)).map(date => {
const entries = studentAudit.filter(entry => entry.date === date);
const latest = entries[entries.length - 1];
const auditStatus = latest?.status === "cleared" || latest?.status === "unmarked" ? "unmarked" :
latest?.status;
return [date, data.attendanceHistory[date] || {}, auditStatus || data.attendanceHistory[date]?.[student.id]
|| "unmarked"];
});
const statusForDate = ([, , status]) => status;
const presentDays = attendanceHistory.filter(record => statusForDate(record) === "present").length;
const lateDays = attendanceHistory.filter(record => statusForDate(record) === "late").length;
const absentDays = attendanceHistory.filter(record => statusForDate(record) === "absent").length;
const excusedDays = attendanceHistory.filter(record => statusForDate(record) === "excused").length;
const attendanceDays = presentDays + lateDays;
elements.studentAttendanceSummary.textContent =
`${calculateAttendanceRate(presentDays, lateDays, absentDays)}% attendance, ${presentDays}
present, ${lateDays} late, ${absentDays} absent, ${excusedDays} excused`;
elements.studentAttendanceList.replaceChildren();
for (const [date, , dayStatus] of attendanceHistory) {
const item = createElement("li", `student-attendance-record ${dayStatus}`);
const dateLabel = createElement("time", "", formatDate(date));
dateLabel.dateTime = date;
const statusLabel = createElement("span", `attendance-history-status ${dayStatus}`,
attendanceLabels[dayStatus]);

const entries = studentAudit.filter(entry => entry.date === date);
const last = entries[entries.length - 1];
const main = createElement("div", "attendance-record-main");
main.append(dateLabel);
if (last) {
const changes = entries.length - 1;
const historyText = entries.map(entry =>
`${attendanceLabels[entry.previousStatus] || (entry.previousStatus === "cleared" ? "Unmarked" :
entry.previousStatus) || "Unmarked"}  ->  ${attendanceLabels[entry.status] || (entry.status === "cleared" ||
entry.status === "unmarked" ? "Unmarked" : entry.status)}`
).join("; ");
const reasonText = last?.reason ? `  -  Reason: ${last.reason}` : "";
main.append(createElement("small", "attendance-record-meta",
`${historyText ? `${historyText}. ` : ""}Last recorded ${formatTime(last.at)}${last.by ? ` by
${last.by}` : ""}${changes ? `  -  ${changes} correction${changes === 1 ? "" : "s"}` :
""}${reasonText}`));
}
item.append(main, statusLabel);
elements.studentAttendanceList.append(item);
}
elements.studentAttendanceEmpty.hidden = attendanceHistory.length > 0;
elements.studentAttendanceEmpty.textContent = hasDateFilter
? "No attendance records match this date range."
: "No attendance records yet. Mark this student present or absent to start their history.";
const behaviorHistory = data.behavior
.filter(note => note.studentId === student.id && dateInRange(note.date))
.sort((left, right) =>
(Number.isFinite(right.createdAt) ? right.createdAt : 0) -
(Number.isFinite(left.createdAt) ? left.createdAt : 0)
);
const meritNotes = behaviorHistory.filter(note => normalizeBehaviorType(note.type) ===
"merit").length;
const demeritNotes = behaviorHistory.length - meritNotes;
elements.studentBehaviorSummary.textContent =
`${meritNotes} merit  -  ${demeritNotes} demerit${demeritNotes === 1 ? "" : "s"}`;
elements.studentBehaviorList.replaceChildren();
for (const note of behaviorHistory) {
const noteType = normalizeBehaviorType(note.type);
const item = createElement("li", `student-behavior-record ${legacyBehaviorTypeClass(noteType)}`);
const heading = createElement("div", "student-behavior-record-heading");
const category = createElement("strong", "", typeof note.category === "string" ? note.category :
"Behavior note");
const type = createElement(
"span",
`behavior-history-status ${legacyBehaviorTypeClass(noteType)}`,
behaviorTypeLabel(noteType)
);
const noteActions = createElement("div", "student-behavior-actions");
noteActions.append(type, createBehaviorRemoveButton(note, student.name));
heading.append(category, noteActions);
const description = createElement("p", "student-behavior-description", note.description);
const metadata = createElement("div", "student-behavior-meta");
if (typeof note.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(note.date)) {
const date = createElement("time", "", formatDate(note.date));
date.dateTime = note.date;

metadata.append(date);
}
if (Number.isFinite(note.createdAt)) {
const recordedTime = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" })
.format(new Date(note.createdAt));
metadata.append(createElement("span", "", `Recorded ${recordedTime}${note.by ? ` by
${note.by}` : ""}`));
}
item.append(heading, description);
if (metadata.childElementCount) item.append(metadata);
elements.studentBehaviorList.append(item);
}
elements.studentBehaviorEmpty.hidden = behaviorHistory.length > 0;
elements.studentBehaviorEmpty.textContent = hasDateFilter
? "No behavior records match this date range."
: "No behavior notes recorded for this student.";
elements.studentProfile.hidden = false;
}
function initialsFor(name) {
return name.trim().split(/\s+/).slice(0, 2).map(part => part[0].toLocaleUpperCase()).join("");
}
function studentColors(index) {
const colors = [
["#ffede4", "#ad7156"], ["#e9efff", "#6176b1"], ["#e8f6ef", "#4c9876"],
["#f3ebff", "#8063ab"], ["#fff2df", "#b17e37"], ["#e6f4f5", "#48898d"],
["#ffeaf0", "#af6580"], ["#eef0ff", "#6772af"]
];
return colors[index % colors.length];
}
function updateSignedInUser() {
if (!account) return;
elements.sidebarUserName.textContent = account.name;
elements.sidebarUserRole.textContent = account.role === "admin" ? "School administrator" : "Teacher";
setAvatarImage(elements.userAvatar, account.profilePhoto, initialsFor(account.name));
elements.userAvatar.setAttribute("aria-label", account.name);
const sidebarAvatar = document.querySelector(".teacher-avatar");
setAvatarImage(sidebarAvatar, account.profilePhoto, initialsFor(account.name));
sidebarAvatar.setAttribute("aria-label", `${account.name} profile photo`);
renderSettingsAccount();
updateWelcomeTitle();
elements.authScreen.hidden = true;
elements.portal.hidden = false;
}
function enterPortal() {
elements.portalChoiceScreen.hidden = true;
elements.authScreen.hidden = true;
if (account.role === "parent") {
elements.portal.hidden = true;
elements.parentPortal.hidden = false;
showParentPortalView("overview");
renderParentPortal();
return;
}
elements.parentPortal.hidden = true;
elements.portal.hidden = false;
updateSignedInUser();
refreshClassControls();
populateStudentOptions();
updateSummary();
renderStudents();
renderBehavior();
renderCalendar();
renderParentRequests();
showTeacherView(viewFromHash(location.hash) || "overview");
}
function updateWelcomeTitle() {
const title = document.getElementById("welcome-title");
if (!title || !account) return;
const hour = new Date().getHours();
const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
const first = account.name.trim().split(/\s+/)[0] || "teacher";
title.textContent = `${part}, ${first} `;
const spark = document.createElement("span");
spark.setAttribute("aria-hidden", "true");

spark.textContent = "*  ";
title.append(spark);
}
function showAuthError(message) {
elements.authError.textContent = message;
elements.authError.hidden = false;
}
const passwordToggleButtons = document.querySelectorAll("[data-password-toggle]");
function setPasswordVisibility(toggle, visible) {
const input = byId(toggle.dataset.passwordToggle);
input.type = visible ? "text" : "password";
toggle.setAttribute("aria-label", visible ? "Hide password" : "Show password");
toggle.setAttribute("aria-pressed", String(visible));
}
function hidePasswords() {
for (const toggle of passwordToggleButtons) setPasswordVisibility(toggle, false);
}
for (const toggle of passwordToggleButtons) {
const input = byId(toggle.dataset.passwordToggle);
toggle.addEventListener("click", () => setPasswordVisibility(toggle, input.type === "password"));
input.form.addEventListener("reset", () => setPasswordVisibility(toggle, false));
}
function switchAuthTab(mode) {
hidePasswords();
const isLogin = mode === "login";
elements.loginTab.classList.toggle("active", isLogin);
elements.registerTab.classList.toggle("active", !isLogin);
elements.loginTab.setAttribute("aria-selected", String(isLogin));
elements.registerTab.setAttribute("aria-selected", String(!isLogin));
elements.loginForm.hidden = !isLogin;
elements.registerForm.hidden = isLogin;
elements.authError.hidden = true;
}
function choosePortal(portal) {
selectedPortal = portal;
elements.authScreen.dataset.portal = portal;
account = null;
elements.portalChoiceScreen.hidden = true;
elements.authScreen.hidden = false;
elements.portal.hidden = true;
elements.parentPortal.hidden = true;
const isParent = portal === "parent";
elements.authPortalLabel.textContent = isParent ? "PARENT PORTAL" : "TEACHER PORTAL";
elements.authTitle.textContent = isParent ? "Welcome, parent" : "Welcome to StudentTrack";
elements.authCopy.textContent = isParent
? "Log in or register with a server-backed account to view updates for children linked in this browser."
: "Log in or register with a server-backed account to manage class data stored in this browser.";
elements.registerNameLabel.textContent = isParent ? "Parent's name" : "Your name";
elements.registerName.placeholder = isParent ? "Parent's name" : "Teacher name";
byId("login-email").placeholder = isParent ? "user@example.test" : "you@school.edu";
byId("register-email").placeholder = isParent ? "user@example.test" : "you@school.edu";
elements.teacherRoleFields.forEach(field => { field.hidden = isParent; });
elements.parentChildrenFields.forEach(field => { field.hidden = !isParent; });
elements.parentRegisterLrn.disabled = !isParent;
elements.registerSubmit.textContent = isParent ? "Create parent account" : "Create teacher account";
switchAuthTab("login");
}
function readAccounts() {
try {
const raw = localStorage.getItem(accountsKey);
if (raw === null) return [];
const accounts = JSON.parse(raw);
if (!Array.isArray(accounts)) throw new Error("Local account storage has an invalid format.");
return accounts;
} catch (error) {
console.error("Could not read local prototype accounts:", error);
throw new Error("Saved accounts could not be read. Check browser storage and try again.");
}

}
async function apiRequest(path, options = {}) {
let response;
try {
response = await fetch(path, { credentials: "same-origin", ...options });
} catch (error) {
console.error("Could not reach the authentication server:", error);
throw new Error("Cannot reach the authentication server. Run the app with `npm start` and open http://localhost:3000.");
}
let result;
try {
result = await response.json();
} catch (error) {
console.error("Authentication server returned a non-JSON response:", error);
throw new Error(`The authentication server returned an invalid response (HTTP ${response.status}).`);
}
if (!response.ok) {
const requestError = new Error(result.message || `Authentication request failed (HTTP ${response.status}).`);
requestError.status = response.status;
throw requestError;
}
return result;
}
function saveLocalProfile(user, initialChild) {
const accounts = readAccounts();
const email = user.email.toLocaleLowerCase();
const index = accounts.findIndex(item =>
item && typeof item.email === "string" && item.email.toLocaleLowerCase() === email
);
const saved = index < 0 ? null : accounts[index];
const sameRole = saved && saved.role === user.role;
const profile = {
...(sameRole ? saved : {}),
name: user.name,
email,
role: user.role,
is2faEnabled: Boolean(user.is2faEnabled),
childIds: user.role === "parent"
? (sameRole && Array.isArray(saved.childIds) ? saved.childIds : initialChild ? [initialChild.id] : [])
: [],
notifications: sameRole && Array.isArray(saved.notifications) ? saved.notifications : [],
notificationPreferences: sameRole && saved.notificationPreferences
? saved.notificationPreferences
: { attendance: true, behavior: true, calendar: true }
};
delete profile.passwordSalt;
delete profile.passwordHash;
delete profile.salt;
delete profile.hash;
if (index < 0) accounts.push(profile);
else accounts[index] = { ...accounts[index], ...profile };
try {
localStorage.setItem(accountsKey, JSON.stringify(accounts));
} catch (error) {
console.error("Could not save local account profile:", error);
throw new Error("The server account is valid, but this browser could not save its local profile. Check browser storage and try again.");
}
return profile;
}
async function activateServerUser(user, initialChild) {
account = saveLocalProfile(user, initialChild);
selectedPortal = user.role === "parent" ? "parent" : "teacher";
enterPortal();
}
async function registerAccount(event) {
event.preventDefault();
elements.authError.hidden = true;
try {
const name = document.getElementById("register-name").value.trim();
const email = document.getElementById("register-email").value.trim().toLocaleLowerCase();
const password = document.getElementById("register-password").value;
const role = selectedPortal === "parent" ? "parent" : "teacher";
const childLrn = selectedPortal === "parent" ? elements.parentRegisterLrn.value.trim() : "";
if (!name || !email || password.length < 8 || !["teacher", "parent"].includes(role)) {
throw new Error("Enter a name, valid email, and password of at least 8 characters.");
}
if (role === "parent" && !/^\d{12}$/.test(childLrn)) {
throw new Error("Enter your child's 12-digit LRN.");
}
const child = role === "parent" ? students.find(student => student.id === childLrn) : null;
if (role === "parent" && !child) {
throw new Error("No student with that LRN was found. Check the number with the school and try again.");
}
const result = await apiRequest("/api/register", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ name, email, password, role })
});
await activateServerUser(result.user, child);
elements.registerForm.reset();
} catch (error) {
showAuthError(error.message || "Could not create the account.");
}
}
async function loginAccount(event) {
event.preventDefault();
elements.authError.hidden = true;
try {
const email = document.getElementById("login-email").value.trim().toLocaleLowerCase();
const password = document.getElementById("login-password").value;
const role = selectedPortal === "parent" ? "parent" : "teacher";
const credentials = { email, password, role };
let result = await apiRequest("/api/login", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(credentials)
});
if (result.requires2fa) {
const token = window.prompt("Enter the 6-digit authenticator code or one of your recovery codes.");
if (token === null) return;
result = await apiRequest("/api/login", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ ...credentials, token: token.trim() })
});
}
await activateServerUser(result.user);
elements.loginForm.reset();
} catch (error) {
showAuthError(error.message || "Could not sign in.");
}

}
async function restoreSession() {
try {
const result = await apiRequest("/api/session");
if (!result.authenticated) return false;
await activateServerUser(result.user);
return true;
} catch (error) {
console.error("Could not restore the server session:", error);
showToast(error.message || "Could not verify the server session.", true);
return false;
}
}
function showTeacherView(viewName) {
const views = [...document.querySelectorAll(".teacher-view")];
const targetView = views.find(view => view.dataset.view === viewName) ||
views.find(view => view.dataset.view === "overview");
if (!targetView) return;
for (const view of views) view.hidden = view !== targetView;
const navLinks = [...document.querySelectorAll(".side-nav .nav-link")];
for (const link of navLinks) {
const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
const linkView = target?.closest(".teacher-view");
const active = linkView === targetView;
link.classList.toggle("selected", active);
if (active) link.setAttribute("aria-current", "page");
else link.removeAttribute("aria-current");
}
const labels = {
overview: "Overview",
attendance: "Attendance",
students: "Students",
"class-settings": "Class setup",
behavior: "Behavior log",
activity: "Recent activity",
settings: "Settings"
};
elements.breadcrumbCurrent.textContent = labels[targetView.dataset.view] || "Overview";
window.scrollTo({ top: 0, behavior: "smooth" });
}
function viewFromHash(hash) {
if (!hash || hash === "#") return "overview";
let target;
try {
target = document.getElementById(decodeURIComponent(hash.slice(1)));

} catch {
return null;
}
return target?.closest(".teacher-view")?.dataset.view || null;
}
function renderParentPortal() {
if (!account || account.role !== "parent") return;
account.notifications ||= [];
account.notificationPreferences ||= { attendance: true, behavior: true, calendar: true };
const childIds = Array.isArray(account.childIds) ? [...new Set(account.childIds)] : [];
account.childIds = childIds.filter(id => students.some(student => student.id === id));
elements.parentAccountName.textContent = account.name;
elements.parentGreetingName.textContent = account.name.split(/\s+/)[0];
elements.parentAvatar.textContent = initialsFor(account.name);
elements.parentAvatar.setAttribute("aria-label", account.name);
updateParentTwoFactorButton();
byId("pref-parent-attendance").checked = account.notificationPreferences?.attendance !== false;
byId("pref-parent-behavior").checked = account.notificationPreferences?.behavior !== false;
byId("pref-parent-calendar").checked = account.notificationPreferences?.calendar !== false;
elements.parentChildList.replaceChildren();
const linkedIds = new Set(account.childIds);
updateParentNotificationButton();
const linkedStudents = students.filter(student => linkedIds.has(student.id));
elements.parentNoChildren.hidden = linkedStudents.length > 0;
byId("parent-link-pending").hidden = true;
byId("parent-link-pending").textContent = "";
for (const student of linkedStudents) {
const child = createElement("article", "parent-child-card");
const avatar = createElement("span", "student-initials", student.initials || initialsFor(student.name));
avatar.style.backgroundColor = student.color || "#eef0ff";
avatar.style.color = student.ink || "#6772af";
const details = createElement("span", "parent-child-details");
details.append(
createElement("strong", "", student.name),
createElement("small", "", `${student.grade}  -  ${student.section}`)
);
const unlink = createElement("button", "unlink-child-button", "Remove");
unlink.type = "button";
unlink.setAttribute("aria-label", `Remove ${student.name} from your linked children`);
unlink.addEventListener("click", () => {
if (!window.confirm(`Remove ${student.name} from the children linked to your parent account?`))
return;
account.childIds = account.childIds.filter(id => id !== student.id);
saveCurrentAccount();
renderParentPortal();
showToast(`${student.name} was removed from your parent view.`);
});
child.append(avatar, details, unlink);
elements.parentChildList.append(child);
}
renderParentUpdates(linkedStudents);
}
function showParentPortalView(view) {
const settingsActive = view === "settings";
elements.parentOverviewView.hidden = settingsActive;
elements.parentSettingsView.hidden = !settingsActive;
elements.parentOverviewTab.setAttribute("aria-pressed", String(!settingsActive));
elements.parentSettingsTab.setAttribute("aria-pressed", String(settingsActive));
}
function updateParentTwoFactorButton() {
if (!account || account.role !== "parent") return;
const button = byId("parent-settings-2fa");
button.textContent = account.is2faEnabled ? "2FA is enabled" : "Set up 2FA";
button.disabled = Boolean(account.is2faEnabled);
}
function renderParentUpdates(linkedStudents) {
if (!account || account.role !== "parent") return;

const linked = new Set(linkedStudents.map(student => student.id));
const notifications = (account.notifications || [])
.filter(notification => !notification.studentId || linked.has(notification.studentId))
.sort((left, right) => right.createdAt - left.createdAt);
elements.parentUpdatesList.replaceChildren();
elements.parentUpdateCount.textContent = `${notifications.length} ${notifications.length === 1 ?
"update" : "updates"}`;
elements.parentNoUpdates.hidden = notifications.length > 0;
for (const notification of notifications) {
const student = linkedStudents.find(item => item.id === notification.studentId) || null;
const item = createElement("article", `parent-update-card ${notification.kind}`);
const iconText = notification.kind === "calendar" ? "C  "
: notification.kind === "attendance" ? (notification.status === "present" || notification.status ===
"late" ? "P  " : "!")
: (normalizeBehaviorType(notification.note?.type) === "merit" ? "+  " : "!");
const icon = createElement("span", "parent-update-icon", iconText);
icon.setAttribute("aria-hidden", "true");
const content = createElement("div", "parent-update-content");
const title = createElement("h3", "", notification.title || "School update");
const meta = createElement("div", "parent-update-meta");
if (student) meta.append(createElement("span", "parent-update-student", student.name));
meta.append(createElement("span", "parent-update-date", formatDate(notification.date ||
notification.createdAt && new Date(notification.createdAt).toISOString().slice(0, 10))));
if (Number.isFinite(notification.eventAt) || Number.isFinite(notification.createdAt)) {
meta.append(createElement("span", "parent-update-date", formatTime(notification.eventAt ||
notification.createdAt)));
}
if (notification.read) meta.append(createElement("span", "parent-update-read-state", "Read"));
else meta.append(createElement("span", "parent-update-read-state unread", "Unread"));
const description = createElement("p", "parent-update-description", notification.body || "School update");
const readButton = createElement("button", "button small-button", notification.read ? "Mark unread" :
"Mark read");
readButton.type = "button";
readButton.addEventListener("click", () => {
const wasRead = notification.read;
notification.read = !notification.read;
if (!saveCurrentAccount()) notification.read = wasRead;
renderParentUpdates(linkedStudents);
});
content.append(title, meta, description);
item.append(icon, content, readButton);
elements.parentUpdatesList.append(item);
}
}
function newParentNotifications(previousData, nextData, parentAccount) {
const childIds = new Set(Array.isArray(parentAccount?.childIds) ? parentAccount.childIds : []);
const previousHistory = previousData.attendanceHistory || previousData.attendance || {};
const nextHistory = nextData.attendanceHistory || nextData.attendance || {};
const notifications = [];
const previousAudit = previousData.attendanceAudit || [];
const nextAudit = nextData.attendanceAudit || [];

const auditKey = entry =>
`${entry.studentId}|${entry.date}|${entry.at}|${entry.previousStatus}|${entry.status}|${entry.reason || ""}`;
const previousAuditKeys = new Set(previousAudit.map(auditKey));
const addedAudit = nextAudit.filter(entry => !previousAuditKeys.has(auditKey(entry)));
const addedAuditDates = new Set(addedAudit.map(entry => `${entry.studentId}|${entry.date}`));
const seen = new Set();
const addNotification = (item) => {
const dedupeKey = item.tag || `${item.kind}|${item.studentId}|${item.date}|${item.status ||
""}|${item.noteId || ""}`;
if (seen.has(dedupeKey)) return;
seen.add(dedupeKey);
notifications.push({
...item,
read: false,
createdAt: Date.now(),
kind: item.kind || "attendance"
});
};
for (const [date, records] of Object.entries(nextHistory)) {
for (const [studentId, status] of Object.entries(records || {})) {
if (!childIds.has(studentId) || !attendanceStatuses.includes(status) ||
parentAccount.notificationPreferences?.attendance === false) continue;
if (previousHistory[date]?.[studentId] === status ||
addedAuditDates.has(`${studentId}|${date}`)) continue;
const student = nextData.students.find(item => item.id === studentId);
if (student) {
addNotification({
kind: "attendance",
studentId,
date,
status,
title: `${student.name} marked ${attendanceLabels[status].toLowerCase()}`,
body: `${formatDate(date)}  -  Attendance recorded as
${attendanceLabels[status].toLowerCase()}.`,
tag: `attendance-${studentId}-${date}-${status}`
});
}
}
}
for (const entry of addedAudit) {
if (!childIds.has(entry.studentId) || parentAccount.notificationPreferences?.attendance === false)
continue;
const student = nextData.students.find(item => item.id === entry.studentId);
if (student) {
const isCleared = entry.status === "cleared" || entry.status === "unmarked";
const statusText = attendanceLabels[entry.status] || (isCleared ? "Unmarked" : entry.status);
const previousStatus = attendanceLabels[entry.previousStatus] ||
(entry.previousStatus === "cleared" || entry.previousStatus === "unmarked"
? "Unmarked"
: entry.previousStatus);
const isCorrection = entry.previousStatus !== undefined &&
entry.previousStatus !== "unmarked" && entry.previousStatus !== "cleared";
addNotification({
kind: "attendance",

studentId: entry.studentId,
date: entry.date,
status: entry.status,
eventAt: entry.at,
title: isCorrection
? `${student.name}'s attendance corrected`
: `${student.name} marked ${statusText.toLowerCase()}`,
body: isCorrection
? `${formatDate(entry.date)}  -  ${previousStatus} to ${statusText}.`
: `${formatDate(entry.date)}  -  Attendance recorded as ${statusText.toLowerCase()}.`,
tag: `attendance-${entry.studentId}-${entry.date}-${entry.at}`
});
}
}
const previousNotes = new Set((previousData.behavior || []).map(note =>
note.id ||
`${note.studentId}|${note.date}|${note.createdAt}|${note.type}|${note.category}|${note.description}`
));
for (const note of nextData.behavior || []) {
const key = note.id ||
`${note.studentId}|${note.date}|${note.createdAt}|${note.type}|${note.category}|${note.description}`;
if (!childIds.has(note.studentId) || previousNotes.has(key) ||
parentAccount.notificationPreferences?.behavior === false) continue;
const student = nextData.students.find(item => item.id === note.studentId);
if (student) {
addNotification({
kind: "behavior",
studentId: note.studentId,
date: note.date,
noteId: key,
title: `${normalizeBehaviorType(note.type) === "merit" ? "Merit note" : "Demerit note"} for
${student.name}`,
body: `${note.category}: ${note.description}`,
tag: `behavior-${key}`
});
}
}
const previousCalendar = new Set((previousData.calendar || []).map(event => event.id));
for (const event of nextData.calendar || []) {
if (!previousCalendar.has(event.id) && parentAccount.notificationPreferences?.calendar !== false) {
addNotification({
kind: "calendar",
studentId: null,
date: event.date,
title: event.type === "non-school-day" ? "Holiday / non-school day" : "New school calendar event",
body: `${formatDate(event.date)}  -  ${event.type === "non-school-day" ? "Attendance is closed: " : ""}${event.title}`,
tag: `calendar-${event.id}`
});
}
}
return notifications;

}
function updateParentNotificationButton() {
const supported = window.isSecureContext && "Notification" in window;
elements.parentNotificationsEnable.hidden = !supported;
if (!supported) return;
const unreadCount = account?.role === "parent" ? (account.notifications || []).filter(item =>
!item.read).length : 0;
const label = Notification.permission === "granted"
? "Browser alerts on"
: Notification.permission === "denied"
? "Browser alerts blocked"
: "Enable alerts";
const displayLabel = window.matchMedia("(max-width: 420px)").matches ? "Alerts" : label;
elements.parentNotificationsEnable.textContent = unreadCount > 0 ? `${displayLabel}
(${unreadCount})` : displayLabel;
elements.parentNotificationsEnable.disabled = Notification.permission === "denied";
elements.parentNotificationsEnable.setAttribute(
"aria-label",
Notification.permission === "granted"
? "Browser alerts are enabled"
: Notification.permission === "denied"
? "Browser alerts are blocked in browser settings"
: "Enable browser alerts"
);
}
window.addEventListener("resize", () => {
if (account?.role === "parent") updateParentNotificationButton();
});
function notifyParentOfUpdates(notifications) {
if (!notifications.length || !account || account.role !== "parent") return;
const summary = notifications.length === 1
? notifications[0].title
: `${notifications.length} new updates for your children`;
const seenKeys = new Set((account.notifications || []).map(notification => notification.tag ||
notification.id));
const newRecords = notifications.filter(notification => !seenKeys.has(notification.tag ||
notification.title));
if (!newRecords.length) return;
for (const notification of newRecords) {
notification.id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
notification.read = false;
notification.createdAt = Date.now();
notification.studentId = notification.studentId || null;
}
const previousNotifications = account.notifications || [];
account.notifications = [
...previousNotifications,
...newRecords
].sort((left, right) => right.createdAt - left.createdAt).slice(0, 200);
if (!saveCurrentAccount()) {
account.notifications = previousNotifications;

renderParentPortal();
return;
}
renderParentPortal();
showToast(summary);
if (!document.hidden || !("Notification" in window) || Notification.permission !== "granted") return;
for (const update of newRecords) {
try {
new Notification(update.title, { body: update.body, tag: update.tag });
} catch (error) {
console.error("Could not show a browser notification:", error);
showToast("The live update arrived, but the browser notification could not be shown.", true);
}
}
}
function saveCurrentAccount() {
try {
const accounts = readAccounts();
const index = accounts.findIndex(item =>
item && typeof item.email === "string" && item.email.toLocaleLowerCase() === account.email.toLocaleLowerCase()
);
const profile = { ...account };
delete profile.passwordSalt;
delete profile.passwordHash;
delete profile.salt;
delete profile.hash;
if (index < 0) accounts.push(profile);
else accounts[index] = { ...accounts[index], ...profile };
localStorage.setItem(accountsKey, JSON.stringify(accounts));
return true;
} catch (error) {
console.error("Could not save local account changes:", error);
showToast(error.message || "Could not save the account changes.", true);
return false;
}
}
function renderBehavior() {
const filter = elements.behaviorFilter.value;
const isArchivedView = filter === "archived";
const entries = isArchivedView
? (data.behaviorArchive || []).filter(entry => entry && entry.note)
.slice().sort((left, right) => right.archivedAt - left.archivedAt)
: data.behavior
.filter(note => filter === "all" || normalizeBehaviorType(note.type) === filter)
.slice().sort((left, right) => right.createdAt - left.createdAt)
.map(note => ({ note }));
elements.activityList.replaceChildren();
for (const entry of entries) {
const note = entry.note;
const student = students.find(item => item.id === note.studentId) ||
(data.archive || []).find(item => item.student.id === note.studentId)?.student;
const noteType = normalizeBehaviorType(note.type);
const item = createElement("article", "activity-item");
const marker = createElement("span", `activity-marker ${legacyBehaviorTypeClass(noteType)}`,
noteType === "merit" ? "+  " : "!");
marker.setAttribute("aria-hidden", "true");
const body = createElement("div", "activity-body");
const title = createElement("p", "activity-title");

title.append(createElement("strong", "", student.name), createElement("span", "category-pill",
note.category));
const description = createElement("p", "activity-description", note.description);
const meta = createElement("div", "activity-meta");
const time = new Date(note.createdAt);
const timeText = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit"
}).format(time);
meta.append(
createElement("span", "", `${behaviorTypeLabel(noteType)} note`),
createElement("span", "", formatDate(note.date)),
createElement("span", "", `Recorded ${timeText}${note.by ? ` by ${note.by}` : ""}`)
);
if (isArchivedView) {
meta.append(createElement(
"span",
"",
`Archived ${formatDate(localDateKey(new Date(entry.archivedAt)))}${entry.archivedBy ? ` by
${entry.archivedBy}` : ""}`
));
}
body.append(title, description, meta);
item.append(marker, body, isArchivedView
? createBehaviorRestoreButton(entry, student?.name || "this student")
: createBehaviorRemoveButton(note, student?.name || "this student"));
elements.activityList.append(item);
}
elements.emptyActivity.textContent = isArchivedView
? "No archived behavior notes."
: "No behavior notes yet. Add a note above to get started.";
elements.emptyActivity.hidden = entries.length > 0;
}
function createBehaviorRemoveButton(note, studentName) {
if (!canManageBehaviorArchive()) return createElement("span", "record-lock", "Permanent");
const button = createElement("button", "behavior-delete-button", "Remove");
button.type = "button";
button.setAttribute("aria-label", `Remove behavior record for ${studentName}`);
button.addEventListener("click", () => removeBehaviorNote(note, studentName));
return button;
}
function createBehaviorRestoreButton(entry, studentName) {
if (!canManageBehaviorArchive()) return createElement("span", "record-lock", "Archived");
const button = createElement("button", "behavior-delete-button", "Restore");
button.type = "button";
button.setAttribute("aria-label", `Restore behavior record for ${studentName}`);
button.addEventListener("click", () => restoreBehaviorNote(entry, studentName));
return button;
}
function removeBehaviorNote(note, studentName) {
if (!canManageBehaviorArchive() || !data.behavior.includes(note)) return;
const recordType = normalizeBehaviorType(note.type) === "merit" ? "merit note" : "demerit note";
const description = note.description.length > 80 ? `${note.description.slice(0, 77)}...` : note.description;
const category = typeof note.category === "string" ? note.category : "Behavior note";

if (!window.confirm(`Remove this ${recordType} for ${studentName}?\n${category}:
${description}\nIt will move to Archived notes and can be restored later.`)) return;
const archivedEntry = { note, archivedAt: Date.now(), archivedBy: actor() };
data.behavior = data.behavior.filter(item => item !== note);
(data.behaviorArchive ||= []).push(archivedEntry);
recordAudit("behavior-note-archived", { studentId: note.studentId, date: note.date, category:
note.category });
const saved = persistData();
updateSummary();
renderBehavior();
renderManagedStudents();
showToast(
`Behavior record moved to Archived notes${saved ? " and saved on this device" : " for this session only; it was not saved"}.`,
!saved
);
}
function restoreBehaviorNote(entry, studentName) {
if (!canManageBehaviorArchive() || !(data.behaviorArchive || []).includes(entry)) return;
if (data.behavior.some(note => note === entry.note)) {
showToast("This behavior note is already active.", true);
return;
}
data.behaviorArchive = data.behaviorArchive.filter(item => item !== entry);
data.behavior.push(entry.note);
recordAudit("behavior-note-restored", { studentId: entry.note.studentId, date: entry.note.date, category:
entry.note.category });
const saved = persistData();
updateSummary();
renderBehavior();
renderManagedStudents();
showToast(
`Behavior record for ${studentName} restored${saved ? " and saved on this device" : " for this session only; it was not saved"}.`,
!saved
);
}
function initializeDate() {
const now = new Date();
elements.today.textContent = new Intl.DateTimeFormat("en-PH", {
weekday: "short",
month: "short",
day: "numeric"
}).format(now);
const start = new Date(now);
start.setDate(start.getDate() - 6);
elements.trendStart.value = localDateKey(start);
elements.trendEnd.value = attendanceDate;
const hour = now.getHours();
elements.greeting.textContent = hour < 12 ? "GOOD MORNING  -  TEACHER DASHBOARD" :
hour < 18 ? "GOOD AFTERNOON  -  TEACHER DASHBOARD" : "GOOD EVENING  -TEACHER DASHBOARD";
}

elements.trendPeriod.addEventListener("change", () => {
const days = Number(elements.trendPeriod.value);
if (Number.isInteger(days) && days > 0) {
const start = new Date();
start.setDate(start.getDate() - (days - 1));
elements.trendStart.value = localDateKey(start);
elements.trendEnd.value = attendanceDate;
}
renderAttendanceTrends();
});
for (const input of [elements.trendStart, elements.trendEnd]) {
input.addEventListener("change", () => {
elements.trendPeriod.value = "custom";
renderAttendanceTrends();
});
}
elements.search.addEventListener("input", renderStudents);
elements.attendanceFilter.addEventListener("change", renderStudents);
for (const input of [elements.studentProfileFrom, elements.studentProfileTo]) {
input.addEventListener("change", () => {
const student = students.find(item => item.id === selectedRosterStudentId);
if (student) renderStudentProfile(student);
});
}
byId("clear-student-profile-dates").addEventListener("click", () => {
elements.studentProfileFrom.value = "";
elements.studentProfileTo.value = "";
const student = students.find(item => item.id === selectedRosterStudentId);
if (student) renderStudentProfile(student);
});
for (const [id, offset] of [["student-calendar-previous", -1], ["student-calendar-next", 1]]) {
byId(id).addEventListener("click", () => {
profileCalendarMonth = new Date(
profileCalendarMonth.getFullYear(),
profileCalendarMonth.getMonth() + offset,
1
);
const student = students.find(item => item.id === selectedRosterStudentId);
if (student) renderStudentProfile(student);
});
}
elements.sectionAttendanceToggle.addEventListener("click", () => {
const isExpanded = elements.sectionAttendanceToggle.getAttribute("aria-expanded") === "true";
elements.sectionAttendanceToggle.setAttribute("aria-expanded", String(!isExpanded));
elements.sectionAttendanceToggle.textContent = isExpanded ? "Open" : "Close";
elements.sectionAttendanceList.hidden = isExpanded;
});
elements.classFilter.addEventListener("change", () => {
updateSummary();
renderStudents();
});
document.getElementById("empty-sections-toggle")?.addEventListener("click", () => {
showEmptySections = !showEmptySections;
renderSectionAttendance(currentAttendance());
});

elements.behaviorFilter.addEventListener("change", renderBehavior);
elements.loginTab.addEventListener("click", () => switchAuthTab("login"));
elements.registerTab.addEventListener("click", () => switchAuthTab("register"));
elements.loginForm.addEventListener("submit", loginAccount);
elements.registerForm.addEventListener("submit", registerAccount);
function signOut() {
return apiRequest("/api/logout", { method: "POST" }).then(() => {
account = null;
elements.portal.hidden = true;
elements.parentPortal.hidden = true;
elements.authScreen.hidden = true;
elements.portalChoiceScreen.hidden = false;
selectedPortal = "teacher";
showToast("You have signed out.");
}).catch(error => {
console.error("Could not sign out:", error);
showToast(error.message || "Could not sign out securely. Please try again.", true);
});
}
elements.signOut.addEventListener("click", signOut);
elements.topSignOut.addEventListener("click", signOut);
elements.parentSignOut.addEventListener("click", signOut);
elements.parentOverviewTab.addEventListener("click", () => showParentPortalView("overview"));
elements.parentSettingsTab.addEventListener("click", () => showParentPortalView("settings"));
elements.chooseTeacher.addEventListener("click", () => choosePortal("teacher"));
elements.chooseParent.addEventListener("click", () => choosePortal("parent"));
elements.backToPortals.addEventListener("click", () => {
elements.authScreen.hidden = true;
elements.portalChoiceScreen.hidden = false;
elements.authError.hidden = true;
});
elements.parentLinkForm.addEventListener("submit", event => {
event.preventDefault();
if (!account || account.role !== "parent") return;
const studentId = elements.parentAddChild.value.trim();
if (!/^\d{12}$/.test(studentId)) {
showToast("Enter the child's 12-digit LRN.", true);
elements.parentAddChild.focus();
return;
}
const student = students.find(item => item.id === studentId);
if (!student) {
showToast("No student with that LRN was found. Check the number with the school and try again.",
true);
return;
}
if (!Array.isArray(account.childIds)) account.childIds = [];
const isAlreadyLinked = account.childIds.includes(studentId);
if (isAlreadyLinked) {
showToast("This child is already linked to your account.", true);
return;
}
account.childIds.push(studentId);
recordAudit("parent-link-approved", { parentEmail: account.email, studentId });
if (!saveCurrentAccount()) return;
elements.parentAddChild.value = "";
renderParentPortal();
showToast(`${student.name} was added to your linked children.`);
});

for (const [preference, control] of [
["attendance", byId("pref-parent-attendance")],
["behavior", byId("pref-parent-behavior")],
["calendar", byId("pref-parent-calendar")]
]) {
control.addEventListener("change", () => {
if (!account || account.role !== "parent") return;
account.notificationPreferences ||= {};
account.notificationPreferences[preference] = control.checked;
if (saveCurrentAccount()) {
renderParentPortal();
showToast("Notification preferences saved on this device.");
}
});
}
elements.exportBackup.addEventListener("click", () => {
const backup = {
app: "Partida StudentTrack",
version: 1,
exportedAt: new Date().toISOString(),
data
};
const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = `partida-studenttrack-backup-${localDateKey(new Date())}.json`;
document.body.append(link);
link.click();
link.remove();
window.setTimeout(() => URL.revokeObjectURL(url), 1000);
showToast("Backup downloaded. Keep the file somewhere safe.");
});
elements.importBackup.addEventListener("change", async () => {
const file = elements.importBackup.files?.[0];
if (!file) return;
try {
const backup = JSON.parse(await file.text());
const imported = backup?.data;
if (
backup?.app !== "Partida StudentTrack" ||
!imported ||
!Array.isArray(imported.students) ||
!Array.isArray(imported.grades) ||
!Array.isArray(imported.behavior) ||
!imported.attendance ||
typeof imported.attendance !== "object"
) {
throw new Error("This file is not a valid StudentTrack backup.");
}
if (imported.staff !== undefined && !Array.isArray(imported.staff)) {
throw new Error("The backup contains an invalid staff list.");
}
const staff = (imported.staff || []).filter(member =>

member && typeof member.id === "string" && member.id &&
typeof member.name === "string" && member.name.trim() && member.name.length <= 100 &&
typeof member.position === "string" && member.position.trim() && member.position.length <=
80 &&
typeof member.section === "string" && member.section.length <= 100 &&
(member.photo === undefined || validProfileImage(member.photo))
).map(member => ({
id: member.id,
name: member.name.trim(),
position: member.position.trim(),
section: member.section.trim(),
...(validProfileImage(member.photo) ? { photo: member.photo } : {})
}));
if (staff.length !== (imported.staff || []).length) {
throw new Error("The backup contains invalid staff records.");
}
if (new Set(staff.map(member => member.id)).size !== staff.length) {
throw new Error("The backup contains duplicate staff record IDs.");
}
const sectionsByGrade = migrateSections(imported);
const sectionDetails = migrateSectionDetails(imported, sectionsByGrade);
const grades = imported.grades.filter(grade => typeof grade === "string" && grade.trim());
const studentsInBackup = imported.students.filter(student =>
student && typeof student.id === "string" && /^\d{12}$/.test(student.id) &&
typeof student.name === "string" && student.name.trim() && student.name.length <= 100 &&
typeof student.grade === "string" && grades.includes(student.grade) &&
typeof student.section === "string" && (sectionsByGrade[student.grade] ||
[]).includes(student.section)
);
if (studentsInBackup.length !== imported.students.length) {
throw new Error("The backup contains students with missing or invalid grade/section assignments.");
}
const studentIds = new Set(studentsInBackup.map(student => student.id));
if (studentIds.size !== studentsInBackup.length) {
throw new Error("The backup contains duplicate student numbers.");
}
const behavior = imported.behavior.filter(note =>
note && typeof note.studentId === "string" && studentIds.has(note.studentId) &&
typeof note.description === "string" && isValidBehaviorType(note.type) &&
note.description.trim() && note.description.length <= 300 &&
typeof note.category === "string" && note.category.length <= 80 &&
isValidDateKey(note.date) &&
Number.isFinite(note.createdAt)
).map(note => ({ ...note, type: normalizeBehaviorType(note.type) }));
if (behavior.length !== imported.behavior.length) {
throw new Error("The backup contains invalid behavior notes.");
}
const attendance = imported.attendance;
for (const day of Object.values(attendance)) {
if (!day || typeof day !== "object" || Array.isArray(day) ||
Object.entries(day).some(([studentId, status]) =>
!studentIds.has(studentId) || !attendanceStatuses.includes(status)
)) {
throw new Error("The backup contains invalid attendance records.");

}
}
const attendanceHistory = normalizeAttendanceHistory(
imported.attendanceHistory === undefined ? attendance : imported.attendanceHistory,
studentIds
);
const calendar = Array.isArray(imported.calendar)
? imported.calendar.filter(event => event && typeof event.id === "string" &&
isValidDateKey(event.date) && typeof event.title === "string" &&
event.title.trim() && event.title.length <= 100 &&
(event.type === undefined || ["event", "non-school-day"].includes(event.type)))
: [];
if (calendar.length !== (imported.calendar || []).length) throw new Error("The backup contains invalid school calendar events.");
const parentLinkRequests = Array.isArray(imported.parentLinkRequests)
? imported.parentLinkRequests.filter(request => request &&
typeof request.parentEmail === "string" &&
studentIds.has(request.studentId) &&
["pending", "approved", "denied"].includes(request.status))
: [];
if (parentLinkRequests.length !== (imported.parentLinkRequests || []).length) throw new Error("The backup contains invalid parent link requests.");
const auditEntries = Array.isArray(imported.auditLog)
? imported.auditLog.filter(entry => entry && typeof entry.action === "string" &&
Number.isFinite(entry.at))
: [];
if (auditEntries.length !== (imported.auditLog || []).length) throw new Error("The backup contains invalid audit records.");
const attendanceAudit = Array.isArray(imported.attendanceAudit)
? imported.attendanceAudit.filter(entry =>
entry && studentIds.has(entry.studentId) && isValidDateKey(entry.date) &&
(attendanceStatuses.includes(entry.status) || entry.status === "cleared" || entry.status ===
"unmarked") &&
(entry.previousStatus === undefined || attendanceStatuses.includes(entry.previousStatus) ||
entry.previousStatus === "cleared" || entry.previousStatus === "unmarked") &&
Number.isFinite(entry.at) &&
(entry.by === undefined || typeof entry.by === "string") &&
(entry.reason === undefined || typeof entry.reason === "string")
)
: [];
if (attendanceAudit.length !== (imported.attendanceAudit || []).length) {
throw new Error("The backup contains invalid attendance correction history.");
}
const archiveInput = imported.archive === undefined ? [] : imported.archive;
if (!Array.isArray(archiveInput)) throw new Error("The backup contains an invalid student archive.");
const archiveIds = new Set(studentIds);
const archive = archiveInput.map(entry => {
const archivedStudent = entry?.student;
const archivedAttendance = entry?.attendance === undefined ? {} : entry.attendance;
const archivedBehavior = entry?.behavior === undefined ? [] : entry.behavior;
const archivedAudit = entry?.audit === undefined ? [] : entry.audit;
if (
!archivedStudent || typeof archivedStudent.id !== "string" ||
!/^\d{12}$/.test(archivedStudent.id) || archiveIds.has(archivedStudent.id) ||
typeof archivedStudent.name !== "string" || !archivedStudent.name.trim() ||
archivedStudent.name.length > 100 ||

!grades.includes(archivedStudent.grade) ||
!(sectionsByGrade[archivedStudent.grade] || []).includes(archivedStudent.section) ||
!archivedAttendance || typeof archivedAttendance !== "object" ||
Array.isArray(archivedAttendance) ||
!Array.isArray(archivedBehavior) || !Array.isArray(archivedAudit) ||
!Number.isFinite(entry.archivedAt) ||
(entry.archivedBy !== undefined && typeof entry.archivedBy !== "string")
) return null;
if (Object.entries(archivedAttendance).some(([date, status]) =>
!isValidDateKey(date) || !attendanceStatuses.includes(status)
)) return null;
if (archivedBehavior.some(note =>
!note || note.studentId !== archivedStudent.id ||
typeof note.description !== "string" || !note.description.trim() || note.description.length > 300 ||
!isValidBehaviorType(note.type) ||
typeof note.category !== "string" || note.category.length > 80 ||
!isValidDateKey(note.date) || !Number.isFinite(note.createdAt)
)) return null;
if (archivedAudit.some(record =>
!record || record.studentId !== archivedStudent.id || !isValidDateKey(record.date) ||
!(attendanceStatuses.includes(record.status) || record.status === "cleared" || record.status ===
"unmarked") ||
(record.previousStatus !== undefined && !attendanceStatuses.includes(record.previousStatus)
&&
record.previousStatus !== "cleared" && record.previousStatus !== "unmarked") ||
!Number.isFinite(record.at)
)) return null;
archiveIds.add(archivedStudent.id);
return { ...entry, attendance: archivedAttendance, behavior: archivedBehavior, audit: archivedAudit
};
});
if (archive.some(entry => !entry)) throw new Error("The backup contains invalid or duplicate archived student records.");
const behaviorArchiveInput = imported.behaviorArchive === undefined ? [] :
imported.behaviorArchive;
if (!Array.isArray(behaviorArchiveInput)) throw new Error("The backup contains an invalid behavior archive.");
const knownBehaviorStudentIds = new Set([...studentIds, ...archive.map(entry => entry.student.id)]);
const behaviorArchive = behaviorArchiveInput.filter(entry =>
entry && entry.note && knownBehaviorStudentIds.has(entry.note.studentId) &&
typeof entry.note.description === "string" && entry.note.description.trim() &&
entry.note.description.length <= 300 &&
typeof entry.note.category === "string" && entry.note.category.length <= 80 &&
isValidBehaviorType(entry.note.type) &&
isValidDateKey(entry.note.date) && Number.isFinite(entry.note.createdAt) &&
Number.isFinite(entry.archivedAt) &&
(entry.archivedBy === undefined || typeof entry.archivedBy === "string")
).map(entry => ({
...entry,
note: { ...entry.note, type: normalizeBehaviorType(entry.note.type) }
}));
if (behaviorArchive.length !== behaviorArchiveInput.length) {
throw new Error("The backup contains invalid archived behavior notes.");
}
if (!window.confirm("Restore this backup? It will replace the roster, archives, class setup, attendance, attendance history, school calendar, and behavior records currently saved in this browser.")) {

elements.importBackup.value = "";
return;
}
const previousData = data;
data = {
students: studentsInBackup,
staff,
grades,
sectionsByGrade,
sectionDetails,
attendance,
attendanceHistory,
behavior,
behaviorArchive,
calendar,
parentLinkRequests,
auditLog: auditEntries,
attendanceAudit,
archive
};
students = data.students;
if (!persistData()) {
data = previousData;
students = data.students;
throw new Error("The backup could not be saved. Your existing browser data has been kept.");
}
refreshClassControls();
populateStudentOptions();
updateSummary();
renderStudents();
renderManagedStudents();
renderBehavior();
renderCalendar();
showToast("Backup restored successfully.");
} catch (error) {
console.error("Could not restore StudentTrack backup:", error);
showToast(error.message || "Could not restore this backup.", true);
} finally {
elements.importBackup.value = "";
}
});
elements.studentForm.addEventListener("submit", async event => {
event.preventDefault();
if (!account) return;
const name = elements.studentName.value.trim();
const requestedId = elements.studentId.value.trim();
const grade = elements.rosterGrade.value;
const section = elements.rosterSection.value;
if (!name || !/^\d{12}$/.test(requestedId) || !data.grades.includes(grade) || !(data.sectionsByGrade[grade]
|| []).includes(section)) {
showToast("Enter a student name, a valid 12-digit LRN, and choose a valid grade and section.", true);
return;
}
const id = requestedId;

if (students.some(student => student.id === id)) {
showToast("That student LRN is already in use.", true);
elements.studentId.focus();
return;
}
let photo;
try {
if (elements.newStudentPhoto.files?.[0]) photo = await
imageFileToDataUrl(elements.newStudentPhoto.files[0]);
} catch (error) {
showToast(error.message || "Could not read the student profile photo.", true);
return;
}
const [color, ink] = studentColors(students.length);
students.push({ id, name, grade, section, initials: initialsFor(name), color, ink, ...(photo ? { photo } : {})
});
data.students = students;
recordAudit("student-added", { studentId: id, date: attendanceDate });
const saved = persistData();
elements.studentForm.reset();
elements.classFilter.value = `${grade}::${section}`;
populateStudentOptions();
updateSummary();
renderStudents();
renderManagedStudents();
selectedRosterStudentId = id;
renderManagedStudents();
showToast(`${name} added to ${grade}  -  ${section}${saved ? " and saved on this device" : " for this session only"}.`, !saved);
});
function parseBulkStudentRows(value) {
const rows = [];
const errors = [];
const seenIds = new Set(students.map(student => student.id));
const lines = value.split(/\r?\n/);
for (const [index, rawLine] of lines.entries()) {
const line = rawLine.trim();
if (!line) continue;
const hyphenFormat = line.match(/^(.*?)\s*-\s*(\d{12})$/);
const legacyDelimiter = line.includes("\t") ? "\t" : ",";
const legacyFields = line.split(legacyDelimiter).map(field => field.trim());
if (
rows.length === 0 &&
legacyFields.some(field => ["name", "student name"].includes(field.toLocaleLowerCase())) &&
legacyFields.some(field => field.toLocaleLowerCase() === "lrn")
) continue;
const lrnFields = legacyFields.filter(field => /^\d{12}$/.test(field));
const lrn = hyphenFormat?.[2] || (lrnFields.length === 1 ? lrnFields[0] : "");
const name = (hyphenFormat
? hyphenFormat[1]
: lrn ? legacyFields.filter(field => field !== lrn).join(legacyDelimiter === "\t" ? " " : ", ") : ""
).trim();
if (!name || name.length > 100 || !lrn) {
errors.push(`Line ${index + 1}: enter a name (up to 100 characters) and exactly one 12-digit
LRN.`);

continue;
}
if (seenIds.has(lrn)) {
errors.push(`Line ${index + 1}: this LRN is already on the roster or repeated in the pasted list.`);
continue;
}
seenIds.add(lrn);
rows.push({ id: lrn, name });
}
if (!rows.length && !errors.length) errors.push("Paste at least one student name and LRN.");
return { rows, errors };
}
byId("bulk-add-students").addEventListener("click", () => {
const error = byId("bulk-student-error");
error.hidden = true;
error.textContent = "";
const grade = byId("bulk-grade").value;
const section = byId("bulk-section").value;
if (!data.grades.includes(grade) || !(data.sectionsByGrade[grade] || []).includes(section)) {
error.textContent = "Choose a valid grade and section before adding students.";
error.hidden = false;
return;
}
const { rows, errors } = parseBulkStudentRows(byId("bulk-student-list").value);
if (errors.length) {
error.textContent = `${errors.slice(0, 5).join(" ")}${errors.length > 5 ? ` ${errors.length - 5} more
error(s).` : ""} No students were added.`;
error.hidden = false;
return;
}
for (const [index, row] of rows.entries()) {
const [color, ink] = studentColors(students.length + index);
students.push({ ...row, grade, section, initials: initialsFor(row.name), color, ink });
recordAudit("student-added", { studentId: row.id, date: attendanceDate });
}
data.students = students;
const saved = persistData();
byId("bulk-student-list").value = "";
elements.rosterGrade.value = grade;
refreshRosterSections(section);
populateStudentOptions();
updateSummary();
renderStudents();
renderManagedStudents();
showToast(`${rows.length} student${rows.length === 1 ? "" : "s"} added to ${grade}  - 
${section}${saved ? " and saved on this device" : " for this session only"}.`, !saved);
});
byId("bulk-grade").addEventListener("change", () => refreshBulkSectionChoices());
byId("remove-roster-students").addEventListener("click", () => {
const scope = byId("student-removal-scope").value;
const grade = elements.rosterGrade.value;
const section = elements.rosterSection.value;
if (!["section", "grade", "school"].includes(scope)) {

showToast("Choose a valid roster removal scope.", true);
return;
}
if (scope !== "school" && !data.grades.includes(grade)) {
showToast("Choose a valid grade level first.", true);
return;
}
if (scope === "section" && !(data.sectionsByGrade[grade] || []).includes(section)) {
showToast("Choose a valid section first.", true);
return;
}
const studentsToArchive = students.filter(student =>
scope === "school" ||
(student.grade === grade && (scope === "grade" || student.section === section))
);
if (!studentsToArchive.length) {
showToast("There are no students in that roster to remove.", true);
return;
}
const description = scope === "school"
? "the whole school"
: scope === "grade" ? grade : `${grade}  -  ${section}`;
if (!window.confirm(`Archive all ${studentsToArchive.length} student${studentsToArchive.length ===
1 ? "" : "s"} in ${description}? Their attendance and behavior records will be kept and can be restored.`))
return;
for (const student of studentsToArchive) archiveStudent(student);
data.students = students;
recordAudit("students-bulk-archived", {
scope,
grade: scope === "school" ? undefined : grade,
section: scope === "section" ? section : undefined,
count: studentsToArchive.length
});
const saved = persistData();
refreshClassControls();
populateStudentOptions();
updateSummary();
renderStudents();
renderManagedStudents();
renderBehavior();
renderCalendar();
renderParentRequests();
renderArchive();
showToast(`${studentsToArchive.length} student${studentsToArchive.length === 1 ? "" : "s"} archived
from ${description}${saved ? "." : " for this session only; changes were not saved."}`, !saved);
});
function addClassLabel(event, kind) {
event.preventDefault();
if (!account) return;
const input = kind === "grade" ? elements.newGrade : elements.newSection;
const value = input.value.trim();
if (!value) return;
const grade = elements.setupGrade.value;
const existing = kind === "grade" ? data.grades : (data.sectionsByGrade[grade] || []);

if (kind === "section" && !grade) {
showToast("Add a grade level before adding a section.", true);
return;
}
if (existing.some(item => item.toLocaleLowerCase() === value.toLocaleLowerCase())) {
showToast(`"${value}" already exists.`, true);
input.focus();
return;
}
if (kind === "grade") {
data.grades.push(value);
data.sectionsByGrade[value] = [];
} else {
data.sectionsByGrade[grade].push(value);
}
const saved = persistData();
input.value = "";
refreshClassControls();
if (kind === "grade") {
elements.setupGrade.value = value;
elements.rosterGrade.value = value;
refreshRosterSections();
renderGradeList();
renderSectionList();
}
renderStudents();
updateSummary();
showToast(
kind === "grade"
? `${value} added. Add its sections on the right${saved ? "  -  saved on this device" : "  -  this session only"}.`
: `${value} added to ${grade}${saved ? "  -  saved on this device" : "  -  this session only"}.`,
!saved
);
}
elements.gradeForm.addEventListener("submit", event => addClassLabel(event, "grade"));
elements.sectionForm.addEventListener("submit", event => addClassLabel(event, "section"));
elements.sectionDetailSelect.addEventListener("change", renderSectionList);
elements.sectionDetailForm.addEventListener("submit", async event => {
event.preventDefault();
const grade = elements.setupGrade.value;
const section = elements.sectionDetailSelect.value;
if (!data.grades.includes(grade) || !(data.sectionsByGrade[grade] || []).includes(section)) {
showToast("Choose a valid grade and section before saving section details.", true);
return;
}
const previous = data.sectionDetails?.[grade]?.[section] || {};
let photo = previous.photo;
try {
if (elements.sectionPhoto.files?.[0]) photo = await
imageFileToDataUrl(elements.sectionPhoto.files[0]);
} catch (error) {
showToast(error.message || "Could not read the section photo.", true);
return;
}

data.sectionDetails ||= {};
data.sectionDetails[grade] ||= {};
data.sectionDetails[grade][section] = {
adviser: elements.sectionAdviser.value.trim(),
...(photo ? { photo } : {})
};
const saved = persistData();
elements.sectionPhoto.value = "";
renderSectionList();
renderManagedStudents();
showToast(`Details saved for ${grade}  -  ${section}${saved ? "." : " for this session only; they were not saved."}`, !saved);
});
byId("teacher-profile-photo").addEventListener("change", async event => {
const input = event.currentTarget;
const file = input.files?.[0];
if (!file || !account) return;
const previous = account.profilePhoto;
try {
account.profilePhoto = await imageFileToDataUrl(file);
if (!saveCurrentAccount()) account.profilePhoto = previous;
updateSignedInUser();
} catch (error) {
showToast(error.message || "Could not read the teacher profile photo.", true);
} finally {
input.value = "";
}
});
byId("student-profile-photo").addEventListener("change", async event => {
const input = event.currentTarget;
const file = input.files?.[0];
const student = students.find(item => item.id === selectedRosterStudentId);
if (!file || !student) return;
const previous = student.photo;
try {
student.photo = await imageFileToDataUrl(file);
data.students = students;
const saved = persistData();
if (!saved) student.photo = previous;
renderManagedStudents();
renderStudents();
showToast(saved ? `${student.name}'s profile photo was saved.` : `${student.name}'s profile photo
was not saved.`, !saved);
} catch (error) {
showToast(error.message || "Could not read the student profile photo.", true);
} finally {
input.value = "";
}
});
elements.rosterGrade.addEventListener("change", () => {
selectedRosterStudentId = "";
refreshRosterSections();
});
elements.rosterSection.addEventListener("change", () => {
selectedRosterStudentId = "";
refreshRosterSections(elements.rosterSection.value);

});
elements.setupGrade.addEventListener("change", () => {
renderGradeList();
renderSectionList();
});
elements.classAttendanceLink.addEventListener("click", () => {
const grade = elements.rosterGrade.value;
const section = elements.rosterSection.value;
if (!grade || !section) {
showToast("Choose a grade and section first.", true);
return;
}
elements.classFilter.value = `${grade}::${section}`;
elements.attendanceFilter.value = "all";
elements.search.value = "";
updateSummary();
renderStudents();
history.pushState(null, "", "#attendance");
showTeacherView("attendance");
});
elements.studentProfileBehavior.addEventListener("click", () => {
const student = students.find(item => item.id === selectedRosterStudentId);
if (!student) return;
behaviorProfileReturnStudentId = student.id;
elements.behaviorStudent.value = student.id;
history.pushState(null, "", "#behavior");
showTeacherView("behavior");
elements.behaviorNote.focus();
});
elements.behaviorStudent.addEventListener("change", () => {
if (elements.behaviorStudent.value !== behaviorProfileReturnStudentId) {
behaviorProfileReturnStudentId = "";
}
});
elements.behaviorNote.addEventListener("input", () => {
elements.characterCount.textContent = `${elements.behaviorNote.value.length}/300`;
});
elements.behaviorForm.addEventListener("submit", event => {
event.preventDefault();
elements.formError.hidden = true;
const studentId = elements.behaviorStudent.value;
const description = elements.behaviorNote.value.trim();
const selectedType = elements.behaviorForm.querySelector('input[name="behavior-type"]:checked');
if (!students.some(student => student.id === studentId) || !selectedType || !description) {
elements.formError.textContent = "Choose a student, select a note type, and enter a brief description.";
elements.formError.hidden = false;
return;
}
const category = document.getElementById("behavior-category").value;
const note = {
id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
studentId,

type: normalizeBehaviorType(selectedType.value),
category,
description,
date: attendanceDate,
createdAt: Date.now(),
by: actor()
};
const returnToProfile = behaviorProfileReturnStudentId === studentId;
behaviorProfileReturnStudentId = "";
data.behavior.push(note);
recordAudit("behavior-note-added", { studentId, date: note.date, category: note.category, status:
note.type });
updateSummary();
renderBehavior();
const saved = persistData();
elements.behaviorForm.reset();
elements.characterCount.textContent = "0/300";
renderManagedStudents();
showToast(`Behavior note saved${saved ? " on this device" : " for this session only"}.`, !saved);
if (returnToProfile) {
history.pushState(null, "", "#student-management");
showTeacherView("students");
elements.studentProfile.scrollIntoView({
behavior: preferences.reduceMotion ? "auto" : "smooth",
block: "start"
});
} else {
document.getElementById("activity").scrollIntoView({
behavior: preferences.reduceMotion ? "auto" : "smooth",
block: "nearest"
});
}
});
elements.resetAttendance.addEventListener("click", () => {
if (!isAdmin()) {
showToast("Attendance records are permanent. Only a school administrator can clear marks. You can still change a student's status.", true);
return;
}
const attendance = currentAttendance();
const classValue = elements.classFilter.value;
const [selectedGrade, selectedSection] = classValue === "all" ? [null, null] : classValue.split("::");
const classStudents = students.filter(student =>
(!selectedGrade || student.grade === selectedGrade) &&
(!selectedSection || student.section === selectedSection)
);
const markedStudents = classStudents.filter(student => attendance[student.id]);
if (markedStudents.length === 0) {
showToast("No attendance has been marked today yet.");
return;
}
for (const student of markedStudents) {
const previousStatus = attendance[student.id];
delete attendance[student.id];

if (data.attendanceHistory[attendanceDate]) delete
data.attendanceHistory[attendanceDate][student.id];
logAttendance(student.id, "unmarked", previousStatus);
recordAudit("attendance-corrected", {
studentId: student.id,
date: attendanceDate,
previousStatus,
status: "unmarked"
});
}
updateSummary();
renderStudents();
renderManagedStudents();
const saved = persistData();
showToast(`Today's attendance has been cleared${saved ? " and saved" : " for this session only"}.`,
!saved);
});
for (const option of elements.themeOptions) {
option.addEventListener("click", () => {
preferences.theme = option.dataset.themeChoice;
applyPreferences();
if (savePreferences()) {
const themeName = preferences.theme === "system" ? "system theme" : `${preferences.theme}
theme`;
showToast(`Using the ${themeName}. Preference saved on this device.`);
}
});
}
elements.reduceMotionSetting.addEventListener("change", () => {
preferences.reduceMotion = elements.reduceMotionSetting.checked;
applyPreferences();
if (savePreferences()) {
showToast(`Reduced motion ${preferences.reduceMotion ? "enabled" : "disabled"}.`);
}
});
elements.settingsSignOut.addEventListener("click", signOut);
byId("settings-2fa").addEventListener("click", () => {
if (!account) return;
if (account.is2faEnabled) {
showToast("Two-Factor Authentication is already enabled on your account.");
return;
}
elements.totpInstructions.textContent = "Confirm your current password to start setup.";
elements.totpPasswordLabel.hidden = false;
elements.totpPasswordInput.hidden = false;
elements.totpPasswordInput.value = "";
elements.totpPasswordInput.disabled = false;
elements.totpCodeLabel.hidden = true;
elements.totpCodeInput.hidden = true;
elements.totpCodeInput.value = "";
elements.totpQr.hidden = true;
elements.totpError.hidden = true;
elements.recoveryCodePanel.hidden = true;
elements.recoveryCodeList.replaceChildren();
elements.totpStartButton.hidden = false;
elements.totpStartButton.disabled = false;
elements.totpVerifyButton.hidden = true;
elements.totpVerifyButton.disabled = false;
elements.totpDoneButton.hidden = true;
elements.totpCancelButton.hidden = false;
elements.totpDialog.showModal();
elements.totpPasswordInput.focus();
});
elements.totpStartButton.addEventListener("click", async () => {
const password = elements.totpPasswordInput.value;
if (!password) {
elements.totpError.textContent = "Enter your current password.";
elements.totpError.hidden = false;
return;
}
elements.totpStartButton.disabled = true;
elements.totpError.hidden = true;
try {
const data = await apiRequest("/api/2fa/setup", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ password })
});
if (!data.qrCode) throw new Error("Could not generate QR code.");
elements.totpPasswordInput.value = "";
elements.totpInstructions.textContent = "Scan this QR code with your authenticator app, then enter its 6-digit code.";
elements.totpPasswordLabel.hidden = true;
elements.totpPasswordInput.hidden = true;
elements.totpQr.src = data.qrCode;
elements.totpQr.hidden = false;
elements.totpCodeInput.hidden = false;
elements.totpCodeInput.value = "";
elements.totpCodeLabel.hidden = false;
elements.totpCodeInput.disabled = false;
elements.totpStartButton.hidden = true;
elements.totpVerifyButton.hidden = false;
elements.totpVerifyButton.disabled = false;
elements.totpCodeInput.focus();
} catch (error) {
elements.totpError.textContent = error.message || "Could not start 2FA setup.";
elements.totpError.hidden = false;
elements.totpStartButton.disabled = false;
}
});
elements.totpCancelButton.addEventListener("click", () => elements.totpDialog.close());
elements.totpDialog.addEventListener("cancel", event => {
if (!elements.recoveryCodePanel.hidden) event.preventDefault();
});
elements.totpDialog.addEventListener("close", () => {
elements.totpPasswordInput.value = "";
elements.totpCodeInput.value = "";
elements.recoveryCodeList.replaceChildren();
elements.recoveryCodePanel.hidden = true;
});
elements.totpDoneButton.addEventListener("click", () => {
elements.totpDialog.close();
showToast("Two-Factor Authentication is now enabled.");
});
byId("parent-settings-2fa").addEventListener("click", () => {
if (!account || account.role !== "parent" || account.is2faEnabled) return;
const teacherSetupButton = byId("settings-2fa");
const wasDisabled = teacherSetupButton.disabled;
teacherSetupButton.disabled = false;
teacherSetupButton.click();
teacherSetupButton.disabled = wasDisabled;
});
elements.totpDialog.addEventListener("close", updateParentTwoFactorButton);
elements.totpVerifyButton.addEventListener("click", async () => {
const token = elements.totpCodeInput.value.trim();
if (!/^\d{6}$/.test(token)) {
elements.totpError.textContent = "Enter a valid 6-digit code.";
elements.totpError.hidden = false;
return;
}
elements.totpVerifyButton.disabled = true;
elements.totpError.hidden = true;
try {
const verifyData = await apiRequest("/api/2fa/verify", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ token })
});
if (verifyData.verified && Array.isArray(verifyData.recoveryCodes)) {
account.is2faEnabled = true;
saveCurrentAccount();
renderSettingsAccount();
elements.totpQr.hidden = true;
elements.totpCodeInput.hidden = true;
elements.totpCodeLabel.hidden = true;
elements.totpVerifyButton.hidden = true;
elements.totpCancelButton.hidden = true;
elements.totpDoneButton.hidden = false;
elements.totpInstructions.textContent = "Two-factor authentication is enabled. Save these recovery codes now; each can only be used once.";
elements.recoveryCodeList.replaceChildren(...verifyData.recoveryCodes.map(code => {
const item = document.createElement("li");
item.textContent = code;
return item;
}));
elements.recoveryCodePanel.hidden = false;
} else {
throw new Error(verifyData.message || "Could not enable two-factor authentication.");
}
} catch (error) {
elements.totpError.textContent = error.message || "Could not verify the code.";
elements.totpError.hidden = false;
elements.totpVerifyButton.disabled = false;
}
});
elements.parentNotificationsEnable.addEventListener("click", async () => {
if (!window.isSecureContext || !("Notification" in window)) {
showToast("Browser alerts require a supported browser on HTTPS or localhost.", true);

return;
}
if (Notification.permission === "granted") {
showToast("Browser alerts are enabled for this device.");
return;
}
if (Notification.permission === "denied") {
showToast("Browser alerts are blocked. Allow notifications for this site in your browser settings.",
true);
return;
}
try {
const permission = await Notification.requestPermission();
updateParentNotificationButton();
showToast(permission === "granted"
? "Browser alerts enabled for this device."
: "Browser alerts were not enabled. Live updates still appear while the parent portal is open.");
} catch (error) {
console.error("Could not request browser notification permission:", error);
showToast("Could not enable browser alerts. Live updates still appear while the parent portal is open.", true);
}
});
const colorSchemePreference = window.matchMedia("(prefers-color-scheme: dark)");
colorSchemePreference.addEventListener("change", () => {
if (preferences.theme === "system") applyPreferences();
});
elements.portal.addEventListener("click", event => {
const link = event.target.closest('a[href^="#"]');
if (!link) return;
const destination = viewFromHash(link.hash);
if (!destination) return;
event.preventDefault();
if (destination !== "behavior") behaviorProfileReturnStudentId = "";
history.pushState(null, "", link.hash);
showTeacherView(destination);
});
window.addEventListener("hashchange", () => {
if (!account || account.role === "parent" || elements.portal.hidden) return;
const destination = viewFromHash(location.hash);
if (destination) {
if (destination !== "behavior") behaviorProfileReturnStudentId = "";
showTeacherView(destination);
}
});
window.addEventListener("popstate", () => {
if (!account || account.role === "parent" || elements.portal.hidden) return;
const destination = viewFromHash(location.hash);
if (destination) {
if (destination !== "behavior") behaviorProfileReturnStudentId = "";
showTeacherView(destination);
}

});
window.addEventListener("storage", event => {
if (event.key === storageKey) {
const previousData = data;
data = readSavedData();
students = data.students;
if (account?.role === "parent") {
renderParentPortal();
notifyParentOfUpdates(newParentNotifications(previousData, data, account));
} else if (account) {
refreshClassControls();
populateStudentOptions();
updateSummary();
renderStudents();
renderManagedStudents();
renderBehavior();
renderCalendar();
renderParentRequests();
} else {
showToast("Student records were updated in another open tab.");
}
}
if (event.key === accountsKey && account) {
const latest = readAccounts().find(item =>
item && typeof item.email === "string" && item.email.toLocaleLowerCase() === account.email.toLocaleLowerCase()
);
if (latest && latest.role === account.role) {
account.childIds = Array.isArray(latest.childIds) ? latest.childIds : account.childIds;
account.notifications = Array.isArray(latest.notifications) ? latest.notifications : account.notifications;
account.notificationPreferences = latest.notificationPreferences || account.notificationPreferences;
account.profilePhoto = latest.profilePhoto || account.profilePhoto;
if (account.role === "parent") {
renderParentPortal();
} else {
updateSignedInUser();
}
}
}
});
/* ===== v4: permanent records, search, exports, accessibility ===== */
const prefDefaults = { theme: "light", reduceMotion: false, textSize: "md", highContrast: false, easyFont:
false, startView: "overview" };
const startTargets = { overview: "view-overview", attendance: "attendance", students: "student-management", behavior: "behavior" };
const isAdmin = () => account?.role === "admin";
const canReviewParentLinks = () => account?.role === "admin" || account?.role === "teacher";
const canManageBehaviorArchive = () => account?.role === "admin" || account?.role === "teacher";
const actor = () => account?.name || "Teacher";
const auditLog = () => (data.attendanceAudit ||= []);
const formatTime = ms => new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit"
}).format(new Date(ms));
function readSavedData() {
const base = readSavedDataCore();
try {
const raw = JSON.parse(localStorage.getItem(storageKey) || "{}");
const validStudents = new Set(base.students.map(student => student.id));
base.attendanceAudit = Array.isArray(raw.attendanceAudit)

? raw.attendanceAudit.filter(e => e && validStudents.has(e.studentId) && isValidDateKey(e.date)
&&
(attendanceStatuses.includes(e.status) || e.status === "cleared" || e.status === "unmarked") &&
(e.previousStatus === undefined || attendanceStatuses.includes(e.previousStatus) ||
e.previousStatus === "cleared" || e.previousStatus === "unmarked") &&
Number.isFinite(e.at))
: [];
base.archive = Array.isArray(raw.archive)
? raw.archive.filter(e => e && e.student && typeof e.student.id === "string")
: [];
const behaviorStudentIds = new Set([
...base.students.map(student => student.id),
...base.archive.map(entry => entry.student.id)
]);
base.behaviorArchive = Array.isArray(raw.behaviorArchive)
? raw.behaviorArchive.filter(entry =>
entry && entry.note && behaviorStudentIds.has(entry.note.studentId) &&
typeof entry.note.description === "string" && entry.note.description.trim() &&
entry.note.description.length <= 300 &&
typeof entry.note.category === "string" && isValidDateKey(entry.note.date) &&
Number.isFinite(entry.note.createdAt) &&
isValidBehaviorType(entry.note.type) &&
Number.isFinite(entry.archivedAt) &&
(entry.archivedBy === undefined || typeof entry.archivedBy === "string")
).map(entry => ({
...entry,
note: { ...entry.note, type: normalizeBehaviorType(entry.note.type) }
}))
: [];
} catch {
base.attendanceAudit = [];
base.archive = [];
base.behaviorArchive = [];
}
return base;
}
function logAttendance(studentId, status, previousStatus = "unmarked", reason = "") {
auditLog().push({
studentId,
date: attendanceDate,
status,
previousStatus,
reason,
at: Date.now(),
by: actor()
});
}
function recordAudit(action, details = {}) {
data.auditLog ||= [];
data.auditLog.push({ action, ...details, at: Date.now(), by: actor() });
}
/* ---- Preferences ---- */
function applyExtraPreferences() {

const root = document.documentElement;
root.dataset.text = preferences.textSize || "md";
root.dataset.contrast = preferences.highContrast ? "high" : "normal";
root.dataset.font = preferences.easyFont ? "easy" : "default";
document.querySelectorAll("[data-text-size]").forEach(button =>
button.setAttribute("aria-pressed", String(button.dataset.textSize === root.dataset.text)));
if (byId("pref-contrast")) byId("pref-contrast").checked = !!preferences.highContrast;
if (byId("pref-font")) byId("pref-font").checked = !!preferences.easyFont;
if (byId("pref-start")) byId("pref-start").value = preferences.startView || "overview";
}
function setPreference(key, value, message) {
preferences[key] = value;
applyPreferences();
showToast(savePreferences() ? message : "Your setting could not be saved on this device.", false);
}
function applyRoleUI() {
const admin = isAdmin();
const canManageArchive = canManageBehaviorArchive();
elements.resetAttendance.hidden = !admin;
byId("record-permanence").textContent = admin
? "Attendance and behavior records are dated and signed. Teachers and administrators can move behavior notes to Archived notes and restore them later."
: "Attendance and behavior records are dated and signed with the recorder's name. Teachers can move behavior notes to Archived notes and restore them later.";
const archivedBehaviorFilter = byId("behavior-filter-archived");
archivedBehaviorFilter.hidden = !canManageArchive;
if (!canManageArchive && elements.behaviorFilter.value === "archived") elements.behaviorFilter.value
= "all";
renderParentRequests();
}
document.querySelectorAll("[data-text-size]").forEach(button =>
button.addEventListener("click", () => setPreference("textSize", button.dataset.textSize, "Display size updated.")));
byId("pref-contrast").addEventListener("change", event => setPreference("highContrast",
event.target.checked, event.target.checked ? "High contrast turned on." : "High contrast turned off."));
byId("pref-font").addEventListener("change", event => setPreference("easyFont", event.target.checked,
event.target.checked ? "Easy-to-read font turned on." : "Default font restored."));
byId("pref-start").addEventListener("change", event => setPreference("startView", event.target.value,
"Start page saved."));
byId("reset-prefs").addEventListener("click", () => {
preferences = { ...prefDefaults };
applyPreferences();
savePreferences();
showToast("Display settings restored to their defaults.");
});
byId("calendar-form").addEventListener("submit", event => {
event.preventDefault();
const date = byId("calendar-date").value;
const title = byId("calendar-title-input").value.trim();
const type = byId("calendar-kind").value;
if (!date || !title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
showToast("Enter a valid school event date and title.", true);

return;
}
if (!["event", "non-school-day"].includes(type)) {
showToast("Choose a valid school calendar event type.", true);
return;
}
data.calendar ||= [];
data.calendar.push({ id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, date, title,
type, createdAt: Date.now(), by: actor() });
recordAudit("calendar-event-added", { date, title, type });
if (!persistData()) return;
byId("calendar-title-input").value = "";
renderCalendar();
renderStudents();
updateSummary();
showToast("School calendar event saved on this device.");
});
/* ---- Archive instead of delete ---- */
function archiveStudent(student) {
const attendance = {};
for (const [date, day] of Object.entries(data.attendanceHistory)) if (day?.[student.id]) attendance[date] =
day[student.id];
(data.archive ||= []).push({
student: { ...student },
attendance,
behavior: data.behavior.filter(note => note.studentId === student.id),
audit: auditLog().filter(entry => entry.studentId === student.id),
archivedAt: Date.now(),
archivedBy: actor()
});
students = students.filter(item => item.id !== student.id);
data.students = students;
for (const day of Object.values(data.attendance)) if (day) delete day[student.id];
for (const day of Object.values(data.attendanceHistory)) if (day) delete day[student.id];
data.behavior = data.behavior.filter(note => note.studentId !== student.id);
data.attendanceAudit = auditLog().filter(entry => entry.studentId !== student.id);
recordAudit("student-archived", { studentId: student.id, date: attendanceDate });
}
function restoreStudent(index) {
const entry = data.archive[index];
if (!entry) return;
const student = entry.student;
if (students.some(item => item.id === student.id)) {
showToast("A student with this LRN is already on the roster.", true);
return;
}
if (!data.grades.includes(student.grade)) data.grades.push(student.grade);
const sections = (data.sectionsByGrade[student.grade] ||= []);
if (!sections.includes(student.section)) sections.push(student.section);
students.push(student);
data.students = students;
for (const [date, status] of Object.entries(entry.attendance || {})) {
(data.attendanceHistory[date] ||= {})[student.id] = status;
(data.attendance[date] ||= {})[student.id] = status;

}
data.behavior.push(...(entry.behavior || []));
auditLog().push(...(entry.audit || []));
data.archive.splice(index, 1);
const saved = persistData();
refreshClassControls();
populateStudentOptions();
updateSummary();
renderStudents();
renderManagedStudents();
renderBehavior();
showToast(`${student.name} was restored with all records${saved ? "" : " (this session only)"}.`,
!saved);
}
function deleteArchivedStudent(index) {
const entry = data.archive[index];
if (!entry) return;
const student = entry.student;
const studentName = student?.name || "This student";
if (!window.confirm(`Permanently delete ${studentName} from archived students?\nThis removes the
archived record and all saved attendance and behavior history for this student. This cannot be undone.`))
return;
data.archive.splice(index, 1);
data.behaviorArchive = (data.behaviorArchive || []).filter(existing => existing?.note?.studentId !==
student.id);
recordAudit("archived-student-deleted", { studentId: student.id, date: attendanceDate });
const saved = persistData();
renderArchive();
renderBehavior();
showToast(`${studentName} was permanently deleted${saved ? "" : " for this session only"}.`, !saved);
}
function deleteAllArchivedStudents() {
const grade = elements.rosterGrade.value;
const section = elements.rosterSection.value;
const removedEntries = (data.archive || []).filter(entry =>
entry?.student?.grade === grade && entry.student.section === section
);
if (!removedEntries.length) return;
const archivedCount = removedEntries.length;
if (!window.confirm(`Permanently remove all ${archivedCount} archived student${archivedCount ===
1 ? "" : "s"} from ${grade}  -  ${section}?\nThis removes their saved attendance and behavior history.
This cannot be undone.`)) return;
const studentIds = new Set(removedEntries.map(entry => entry.student.id));
data.archive = data.archive.filter(entry => !studentIds.has(entry?.student?.id));
data.behaviorArchive = (data.behaviorArchive || []).filter(existing =>
!studentIds.has(existing?.note?.studentId));
recordAudit("section-archived-students-deleted-all", { grade, section, count: archivedCount, date:
attendanceDate });
const saved = persistData();
renderArchive();
renderBehavior();
showToast(`${archivedCount} archived student${archivedCount === 1 ? "" : "s"} permanently removed
from ${grade}  -  ${section}${saved ? "" : " for this session only"}.`, !saved);
}

function bindArchiveControls() {
const archiveDeleteAllButton = byId("archive-delete-all");
if (archiveDeleteAllButton && !archiveDeleteAllButton.dataset.bound) {
archiveDeleteAllButton.addEventListener("click", deleteAllArchivedStudents);
archiveDeleteAllButton.dataset.bound = "true";
}
}
function renderArchive() {
const list = byId("archive-list");
if (!list) return;
const grade = elements.rosterGrade.value;
const section = elements.rosterSection.value;
const archive = (data.archive || []).map((entry, index) => ({ entry, index }))
.filter(({ entry }) => entry?.student?.grade === grade && entry.student.section === section);
const deleteAllButton = byId("archive-delete-all");
if (deleteAllButton) {
deleteAllButton.disabled = archive.length === 0;
deleteAllButton.title = archive.length === 0 ? "No archived students in this section" : `Remove
archived students from ${grade}  -  ${section}`;
}
list.replaceChildren();
byId("archive-empty").hidden = archive.length > 0;
for (const { entry, index } of archive) {
const item = createElement("li", "archive-item");
const info = createElement("span", "archive-info");
info.append(
createElement("strong", "", entry.student.name),
createElement("small", "", `Keeps ${Object.keys(entry.attendance || {}).length} attendance days
and ${(entry.behavior || []).length} behavior notes. Archived ${formatDate(localDateKey(new
Date(entry.archivedAt)))}.`)
);
const actions = createElement("div", "archive-actions");
const restoreButton = createElement("button", "button", "Restore");
restoreButton.type = "button";
restoreButton.setAttribute("aria-label", `Restore ${entry.student.name}`);
restoreButton.addEventListener("click", () => restoreStudent(index));
const deleteButton = createElement("button", "remove-student archive-delete-button", "Delete");
deleteButton.type = "button";
deleteButton.setAttribute("aria-label", `Delete ${entry.student.name} permanently`);
deleteButton.addEventListener("click", () => deleteArchivedStudent(index));
actions.append(restoreButton, deleteButton);
item.append(info, actions);
list.append(item);
}
}
function renderCalendar() {
const list = byId("calendar-list");
if (!list) return;
const events = (data.calendar || []).slice().sort((a, b) => a.date.localeCompare(b.date) ||
a.title.localeCompare(b.title));
list.replaceChildren();
byId("calendar-empty").hidden = events.length > 0;
for (const event of events) {

const item = createElement("li", "calendar-event");
const details = createElement("span", "calendar-event-details");
const date = createElement("time", "", formatDate(event.date));
date.dateTime = event.date;
details.append(
createElement("strong", "", event.title),
createElement("span", "calendar-event-kind", event.type === "non-school-day" ? "Holiday  -attendance closed" : "School event"),
date
);
const remove = createElement("button", "button calendar-remove", "Remove");
remove.type = "button";
remove.setAttribute("aria-label", `Remove school calendar event ${event.title}`);
remove.addEventListener("click", () => {
if (!window.confirm(`Remove "${event.title}" from the school calendar?`)) return;
data.calendar = data.calendar.filter(item => item.id !== event.id);
recordAudit("calendar-event-removed", { eventId: event.id, title: event.title, date: event.date });
if (!persistData()) return;
renderCalendar();
renderStudents();
updateSummary();
if (account?.role === "parent") renderParentPortal();
showToast("School calendar event removed.");
});
item.append(details, remove);
list.append(item);
}
}
function renderParentRequests() {
const box = byId("parent-verification-box");
if (box) box.hidden = true;
}
/* ---- Needs attention ---- */
function renderAttention() {
const list = byId("attention-list");
if (!list) return;
const cutoff = localDateKey(new Date(Date.now() - 13 * 86400000));
const flagged = [];
for (const student of students) {
let absences = 0;
for (const [date, day] of Object.entries(data.attendanceHistory)) if (date >= cutoff &&
day?.[student.id] === "absent") absences++;
const concerns = data.behavior.filter(note => note.studentId === student.id &&
normalizeBehaviorType(note.type) === "demerit" && note.date >= cutoff).length;
if (absences >= 3 || concerns >= 2) flagged.push({ student, absences, concerns, score: absences +
concerns * 2 });
}
flagged.sort((a, b) => b.score - a.score);
list.replaceChildren();
for (const { student, absences, concerns } of flagged.slice(0, 8)) {
const item = createElement("li", "attention-item");
const button = createElement("button", "attention-button");
button.type = "button";
button.setAttribute("aria-label", `Open record for ${student.name}`);

const name = createElement("span", "attention-name");
name.append(createElement("strong", "", student.name), createElement("small", "",
`${student.grade}, ${student.section}`));
const chips = createElement("span", "attention-chips");
if (absences) chips.append(createElement("span", "attention-chip", `${absences} absence${absences
=== 1 ? "" : "s"}`));
if (concerns) chips.append(createElement("span", "attention-chip concern", `${concerns}
demerit${concerns === 1 ? "" : "s"}`));
button.append(name, chips);
button.addEventListener("click", () => { selectedRosterStudentId = ""; openStudentProfile(student.id);
});
item.append(button);
list.append(item);
}
byId("attention-empty").hidden = flagged.length > 0;
}
/* ---- Find a student ---- */
const findDialog = byId("find-dialog");
const findInput = byId("find-input");
function renderFind() {
const query = findInput.value.trim().toLowerCase();
const matches = students
.filter(s => !query || s.name.toLowerCase().includes(query) || s.id.includes(query))
.sort((a, b) => a.name.localeCompare(b.name))
.slice(0, 8);
const list = byId("find-results");
list.replaceChildren();
for (const student of matches) {
const item = createElement("li");
const button = createElement("button", "find-result");
button.type = "button";
const text = createElement("span", "find-result-text");
text.append(createElement("strong", "", student.name), createElement("small", "", `${student.grade},
${student.section}, LRN ${student.id}`));
button.append(text, createElement("span", "find-result-go", "Open record"));
button.addEventListener("click", () => { findDialog.close(); selectedRosterStudentId = "";
openStudentProfile(student.id); });
item.append(button);
list.append(item);
}
byId("find-empty").hidden = matches.length > 0;
byId("find-status").textContent = `${matches.length} student${matches.length === 1 ? "" : "s"} found`;
}
function openFind() {
if (elements.portal.hidden || findDialog.open) return;
findInput.value = "";
renderFind();
findDialog.showModal();
findInput.focus();
}
byId("open-find").addEventListener("click", openFind);
findInput.addEventListener("input", renderFind);
findInput.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault();
byId("find-results").querySelector("button")?.click(); } });
findDialog.addEventListener("click", event => { if (event.target === findDialog) findDialog.close(); });

const shortcutViews = { Digit1: ["view-overview", "overview"], Digit2: ["attendance", "attendance"],
Digit3: ["student-management", "students"], Digit4: ["behavior", "behavior"], Digit5: ["app-settings",
"settings"] };
document.addEventListener("keydown", event => {
if (elements.portal.hidden) return;
if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "k") {
event.preventDefault(); openFind(); return; }
const target = event.altKey && !event.ctrlKey && !event.metaKey ? shortcutViews[event.code] : null;
if (target) { event.preventDefault(); history.pushState(null, "", `#${target[0]}`);
showTeacherView(target[1]); }
});
/* ---- Bulk attendance and CSV export ---- */
function selectedClassStudents() {
const value = elements.classFilter.value;
const [grade, section] = value === "all" ? [null, null] : value.split("::");
return students.filter(s => (!grade || s.grade === grade) && (!section || s.section === section));
}
byId("mark-all-present").addEventListener("click", () => {
const attendance = currentAttendance();
const todo = selectedClassStudents().filter(s => !attendance[s.id]);
if (!todo.length) { showToast("Everyone in this class is already marked."); return; }
if (nonSchoolDayEvent(attendanceDate)) {
showToast("Attendance cannot be marked on a non-school day.", true);
return;
}
if (!data.attendanceHistory[attendanceDate]) data.attendanceHistory[attendanceDate] = {};
for (const s of todo) {
attendance[s.id] = "present";
data.attendanceHistory[attendanceDate][s.id] = "present";
logAttendance(s.id, "present", "unmarked");
recordAudit("attendance-recorded", { studentId: s.id, date: attendanceDate, previousStatus:
"unmarked", status: "present" });
}
updateSummary();
renderStudents();
renderManagedStudents();
const saved = persistData();
showToast(`${todo.length} student${todo.length === 1 ? "" : "s"} marked present${saved ? " and saved"
: " (not saved)"}.`, !saved);
});
function csvCell(value) {
let text = String(value ?? "");
if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
return `"${text.replace(/"/g, '""')}"`;
}
function downloadCsv(name, rows) {
const blob = new Blob(["\ufeff" + rows.map(row => row.map(csvCell).join(",")).join("\r\n")], { type:
"text/csv;charset=utf-8" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = name;
document.body.append(link);

link.click();
link.remove();
setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const stamp = entry => (entry ? new Date(entry.at).toLocaleString("en-PH") : "");
function lastAudit(studentId, date) {
const entries = auditLog().filter(e => e.studentId === studentId && e.date === date);
return entries[entries.length - 1];
}
function attendanceRows(list) {
const rows = [["Date", "LRN", "Student", "Grade", "Section", "Status", "Recorded at", "Recorded by",
"Previous status", "Correction count", "Correction reason"]];
const items = [];
for (const [date, day] of Object.entries(data.attendanceHistory)) for (const s of list) if (day?.[s.id])
items.push([date, s]);
items.sort((a, b) => b[0].localeCompare(a[0]) || a[1].name.localeCompare(b[1].name));
for (const [date, s] of items) {
const entry = lastAudit(s.id, date);
const audit = auditLog().filter(item => item.studentId === s.id && item.date === date);
rows.push([date, s.id, s.name, s.grade, s.section, data.attendanceHistory[date][s.id], stamp(entry),
entry?.by || "", entry?.previousStatus || "", Math.max(0, audit.length - 1), entry?.reason || ""]);
}
return rows;
}
function behaviorRows(list) {
const rows = [["Date", "LRN", "Student", "Grade", "Section", "Type", "Category", "Note", "Recorded at", "Recorded by"]];
const byStudent = new Map(list.map(s => [s.id, s]));
const notes = data.behavior.filter(n => byStudent.has(n.studentId)).sort((a, b) => (b.createdAt || 0) -
(a.createdAt || 0));
for (const n of notes) {
const s = byStudent.get(n.studentId);
rows.push([n.date, s.id, s.name, s.grade, s.section, n.type, n.category, n.description, n.createdAt ? new
Date(n.createdAt).toLocaleString("en-PH") : "", n.by || ""]);
}
return rows;
}
byId("export-attendance").addEventListener("click", () => downloadCsv(`studenttrack-attendance-
${attendanceDate}.csv`, attendanceRows(selectedClassStudents())));
byId("export-attendance-csv").addEventListener("click", () => downloadCsv(`studenttrack-attendance-
${attendanceDate}.csv`, attendanceRows(students)));
byId("export-behavior-csv").addEventListener("click", () => downloadCsv(`studenttrack-behavior-
${attendanceDate}.csv`, behaviorRows(students)));
byId("export-trend-report").addEventListener("click", () => {
const { rows, error } = attendanceTrendData();
if (error) {
showToast(error, true);
return;
}
const report = [["Date", "Present", "Late", "Absent", "Excused", "Unmarked", "Attendance rate (%)"]];
for (const row of rows) {
report.push([row.date, row.present, row.late, row.absent, row.excused, row.unmarked, row.hasRecords
? row.rate : ""]);
}
downloadCsv(`studenttrack-attendance-trend-${elements.trendStart.value}-
${elements.trendEnd.value}.csv`, report);

});
byId("print-trend-report").addEventListener("click", () => {
if (!elements.trendError.hidden) {
showToast(elements.trendError.textContent, true);
return;
}
document.body.classList.add("print-trend-report");
window.print();
});
window.addEventListener("afterprint", () => document.body.classList.remove("print-trend-report"));
byId("export-audit-csv").addEventListener("click", () => {
const rows = [["Action", "Date", "Student LRN", "Previous status", "New status", "Details", "Recorded at", "Recorded by", "Reason"]];
for (const entry of data.auditLog || []) {
rows.push([
entry.action,
entry.date || "",
entry.studentId || "",
entry.previousStatus || "",
entry.status || "",
entry.title || entry.parentEmail || "",
new Date(entry.at).toLocaleString("en-PH"),
entry.by || "",
entry.reason || ""
]);
}
for (const entry of auditLog()) {
const student = students.find(item => item.id === entry.studentId);
rows.push(["attendance-correction", entry.date, student?.id || entry.studentId, entry.previousStatus || "",
entry.status, "", stamp(entry), entry.by || "", entry.reason || ""]);
}
downloadCsv(`studenttrack-audit-${attendanceDate}.csv`, rows);
});
/* ---- Student record: CSV + print ---- */
byId("student-export").addEventListener("click", () => {
const student = students.find(s => s.id === selectedRosterStudentId);
if (!student) return;
const rows = [["Record", "Date", "Status or type", "Detail", "Recorded at", "Recorded by"]];
for (const row of attendanceRows([student]).slice(1)) rows.push(["Attendance", row[0], row[5], "",
row[6], row[7]]);
for (const row of behaviorRows([student]).slice(1)) rows.push(["Behavior", row[0], row[5], `${row[6]}:
${row[7]}`, row[8], row[9]]);
downloadCsv(`record-${student.id}.csv`, rows);
});
byId("student-print").addEventListener("click", () => {
const student = students.find(s => s.id === selectedRosterStudentId);
if (!student) return;
byId("print-heading").textContent = `Partida National High School, student record for ${student.name}.
Printed ${new Date().toLocaleDateString("en-PH", { dateStyle: "long" })}.`;
document.body.classList.add("print-profile");
window.print();
});
window.addEventListener("afterprint", () => document.body.classList.remove("print-profile"));
data = readSavedData();

students = data.students;
preferences = readPreferences();
applyPreferences();
initializeDate();
bindArchiveControls();
elements.portalChoiceScreen.hidden = false;
elements.authScreen.hidden = true;
elements.portal.hidden = true;
elements.parentPortal.hidden = true;
restoreSession();
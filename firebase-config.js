/* ============================================================
   격몽요결 수업 앱 · 공통 Firebase 모듈
   ------------------------------------------------------------
   ★ 선생님 설정 위치 ★
   아래 firebaseConfig 의 값들을 본인의 Firebase 프로젝트 값으로
   바꿔주세요. (설치_안내서.md 참고)
   설정 전에는 자동으로 '기기 저장(localStorage)' 모드로 작동합니다.
   ============================================================ */

const firebaseConfig = {
  apiKey:            "AIzaSyD2OJDUATy9kKmI4vV76ft0RNrpaqldhS4",
  authDomain:        "gyeokmong.firebaseapp.com",
  projectId:         "gyeokmong",
  storageBucket:     "gyeokmong.firebasestorage.app",
  messagingSenderId: "57303018666",
  appId:             "1:57303018666:web:d56f23af06f9442b1274d3",
  measurementId:     "G-2J4JP0X907"
};

// 관리자(선생님) 코드 — 팀 설정·대시보드 접근용. 원하는 값으로 바꾸세요.
const ADMIN_CODE = "1234";

/* ------------------------------------------------------------
   아래는 수정하지 않아도 됩니다.
   ------------------------------------------------------------ */
let _db = null;
let _useFirebase = false;

function _isConfigured() {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("여기에");
}

async function gmykInit() {
  if (!_isConfigured()) {
    console.warn("[격몽요결] Firebase 미설정 → 기기 저장(localStorage) 모드로 작동합니다.");
    _useFirebase = false;
    return;
  }
  try {
    // Firebase CDN (compat) 가 로드되어 있어야 함
    if (typeof firebase === "undefined") {
      console.warn("[격몽요결] firebase SDK 미로드 → 기기 저장 모드");
      _useFirebase = false;
      return;
    }
    firebase.initializeApp(firebaseConfig);
    _db = firebase.firestore();
    _useFirebase = true;
    console.log("[격몽요결] Firebase 연결됨 ✓");
  } catch (e) {
    console.error("[격몽요결] Firebase 초기화 실패 → 기기 저장 모드", e);
    _useFirebase = false;
  }
}

/* 학생 데이터 저장 (장별)
   key 예: "gmyk_ch1_홍길동"  →  컬렉션 students / 문서 {key} */
async function gmykSave(key, dataObj) {
  // 항상 localStorage 에도 백업
  try { localStorage.setItem(key, JSON.stringify(dataObj)); } catch (e) {}
  if (_useFirebase && _db) {
    try {
      await _db.collection("students").doc(key).set({
        ...dataObj,
        _updatedAt: new Date().toISOString()
      });
    } catch (e) { console.error("[격몽요결] 저장 실패(서버)", e); }
  }
}

async function gmykLoad(key) {
  if (_useFirebase && _db) {
    try {
      const snap = await _db.collection("students").doc(key).get();
      if (snap.exists) return snap.data();
    } catch (e) { console.error("[격몽요결] 불러오기 실패(서버)", e); }
  }
  // 폴백: localStorage
  try {
    const v = localStorage.getItem(key);
    if (v) return JSON.parse(v);
  } catch (e) {}
  return null;
}

/* 팀 명단 (공유 데이터) */
async function gmykSaveRoster(rosterObj) {
  try { localStorage.setItem("gmyk_roster", JSON.stringify(rosterObj)); } catch (e) {}
  if (_useFirebase && _db) {
    try { await _db.collection("config").doc("roster").set(rosterObj); }
    catch (e) { console.error("[격몽요결] 명단 저장 실패", e); }
  }
}

async function gmykLoadRoster() {
  if (_useFirebase && _db) {
    try {
      const snap = await _db.collection("config").doc("roster").get();
      if (snap.exists) return snap.data();
    } catch (e) { console.error("[격몽요결] 명단 불러오기 실패", e); }
  }
  try {
    const v = localStorage.getItem("gmyk_roster");
    if (v) return JSON.parse(v);
  } catch (e) {}
  return {};
}

/* 교사 대시보드용 — 전체 학생 데이터 가져오기 */
async function gmykLoadAll() {
  if (_useFirebase && _db) {
    try {
      const snap = await _db.collection("students").get();
      const out = {};
      snap.forEach(doc => { out[doc.id] = doc.data(); });
      return out;
    } catch (e) { console.error("[격몽요결] 전체 불러오기 실패", e); }
  }
  // 폴백: 이 기기의 localStorage 에서 gmyk_ch 로 시작하는 것 모으기
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("gmyk_ch")) out[k] = JSON.parse(localStorage.getItem(k));
    }
  } catch (e) {}
  return out;
}

function gmykIsServerMode() { return _useFirebase; }

/**
 * Digital Culture Box - Google Apps Script Backend (Hardened)
 *
 * Setup:
 * 1) Set SPREADSHEET_ID
 * 2) Apps Script > Project Settings > Script properties:
 *    - ADMIN_USERNAME
 *    - ADMIN_PASSWORD
 * 3) Deploy as Web App (Execute as: Me, Access: Anyone)
 *
 * Security notes:
 * - Admin credentials are verified SERVER-SIDE only.
 * - Admin session token is stored in CacheService with TTL.
 */

// ====== CONFIGURATION ======
const SPREADSHEET_ID = '1eLN5rHcPntDsSL1E5qzthXQHFjmUCH065bfhoWyMdxM';
const ADMIN_SESSION_TTL_SEC = 60 * 60 * 8; // 8h

// ====== HELPERS ======

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet: ' + name);
  return sheet;
}

function sheetToArray(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow(sheetName, obj) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '');
  sheet.appendRow(row);
  return obj;
}

function updateRow(sheetName, id, updates) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  const headers = data[0];
  const idCol = headers.indexOf('id');
  if (idCol < 0) return null;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      Object.keys(updates).forEach((key) => {
        const col = headers.indexOf(key);
        if (col >= 0) sheet.getRange(i + 1, col + 1).setValue(updates[key]);
      });
      // Build and return the full row object (not just the updated fields)
      const fullRow = {};
      headers.forEach((h, hi) => { fullRow[h] = data[i][hi]; });
      Object.keys(updates).forEach(k => { fullRow[k] = updates[k]; });
      return fullRow;
    }
  }
  return null;
}

function deleteRow(sheetName, id) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return false;
  const headers = data[0];
  const idCol = headers.indexOf('id');
  if (idCol < 0) return false;

  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function generateId(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

function normalize(v) {
  return v === undefined || v === null ? '' : String(v);
}

function jsonResponse(result) {
  return ContentService.createTextOutput(JSON.stringify({ result }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({ error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseParams(params) {
  // Frontend may send JSON-serialized fields via query params.
  const parsed = {};
  Object.keys(params || {}).forEach((k) => {
    const v = params[k];
    if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) {
      try { parsed[k] = JSON.parse(v); } catch (_) { parsed[k] = v; }
    } else {
      parsed[k] = v;
    }
  });
  return parsed;
}

// ====== AUTH HELPERS ======

function getAdminCredentials() {
  const props = PropertiesService.getScriptProperties();
  return {
    username: props.getProperty('ADMIN_USERNAME') || '',
    password: props.getProperty('ADMIN_PASSWORD') || '',
  };
}

function createAdminSession() {
  const token = generateId('adm');
  const cache = CacheService.getScriptCache();
  cache.put('admin_session_' + token, '1', ADMIN_SESSION_TTL_SEC);
  return token;
}

function isAdminTokenValid(token) {
  if (!token) return false;
  const cache = CacheService.getScriptCache();
  return Boolean(cache.get('admin_session_' + token));
}

function requireAdmin(params) {
  const token = normalize(params.admin_token);
  if (!isAdminTokenValid(token)) throw new Error('Unauthorized: admin session required');
}

function canViewBox(box, params) {
  const token = normalize(params.admin_token);
  if (isAdminTokenValid(token)) return true;

  const requesterSchoolId = normalize(params.requester_school_id);
  if (!requesterSchoolId) return false;

  return requesterSchoolId === normalize(box.from_school_id) || requesterSchoolId === normalize(box.to_school_id);
}

// ====== MAIN REQUEST HANDLER ======

function handleRequest(rawParams) {
  const params = parseParams(rawParams || {});
  const action = normalize(params.action);

  switch (action) {
    // ===== AUTH =====
    case 'adminLogin': {
      const creds = getAdminCredentials();
      if (!creds.username || !creds.password) {
        throw new Error('Admin credentials are not configured in Script Properties');
      }
      const user = normalize(params.username).trim();
      const pass = normalize(params.password);
      if (user !== creds.username || pass !== creds.password) throw new Error('Invalid admin credentials');

      const token = createAdminSession();
      return jsonResponse({ ok: true, admin_token: token, expires_in_sec: ADMIN_SESSION_TTL_SEC });
    }

    case 'adminLogout': {
      const token = normalize(params.admin_token);
      if (token) CacheService.getScriptCache().remove('admin_session_' + token);
      return jsonResponse({ ok: true });
    }

    case 'validateAdminSession': {
      return jsonResponse({ ok: isAdminTokenValid(normalize(params.admin_token)) });
    }

    case 'userLogin': {
      const role = normalize(params.role);
      const code = normalize(params.code).trim().toUpperCase();
      const school_id = normalize(params.school_id);

      if (!role || !code || !school_id) throw new Error('Missing login parameters');

      const users = sheetToArray('Users');
      const match = users.find(function(u) {
        return normalize(u.role) === role &&
               normalize(u.email).trim().toUpperCase() === code &&
               normalize(u.school_id) === school_id;
      });

      if (!match) throw new Error('Invalid credentials');

      return jsonResponse({
        ok: true,
        user: {
          id: normalize(match.id),
          name: normalize(match.name),
          school_id: normalize(match.school_id),
          role: normalize(match.role),
          lang_pref: normalize(match.lang_pref) || 'ko',
        },
      });
    }

    // ===== READ =====
    case 'getSchools':
      return jsonResponse(sheetToArray('Schools'));

    case 'getBoxes': {
      let boxes = sheetToArray('Boxes');

      // Admin can see all; others must filter by requester school
      if (!isAdminTokenValid(normalize(params.admin_token))) {
        const sid = normalize(params.requester_school_id || params.school_id);
        if (!sid) throw new Error('Unauthorized: requester_school_id required');
        boxes = boxes.filter(b => normalize(b.from_school_id) === sid || normalize(b.to_school_id) === sid);
      }

      if (params.status && params.status !== 'all') {
        boxes = boxes.filter(b => normalize(b.status) === normalize(params.status));
      }
      if (params.search) {
        const q = normalize(params.search).toLowerCase();
        boxes = boxes.filter(b =>
          normalize(b.title).toLowerCase().includes(q) ||
          normalize(b.title_en).toLowerCase().includes(q) ||
          normalize(b.title_ja).toLowerCase().includes(q) ||
          normalize(b.description).toLowerCase().includes(q)
        );
      }
      return jsonResponse(boxes);
    }

    case 'getBox': {
      const boxes = sheetToArray('Boxes');
      const box = boxes.find(b => normalize(b.id) === normalize(params.id));
      if (!box) return jsonResponse(null);
      if (!canViewBox(box, params)) throw new Error('Unauthorized: cannot access this box');
      return jsonResponse(box);
    }

    case 'getItems': {
      const boxId = normalize(params.box_id);
      const boxes = sheetToArray('Boxes');
      const box = boxes.find(b => normalize(b.id) === boxId);
      if (!box) return jsonResponse([]);
      if (!canViewBox(box, params)) throw new Error('Unauthorized: cannot access this box');

      const items = sheetToArray('Items')
        .filter(i => normalize(i.box_id) === boxId)
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
      return jsonResponse(items);
    }

    case 'getMessages': {
      const boxId = normalize(params.box_id);
      const boxes = sheetToArray('Boxes');
      const box = boxes.find(b => normalize(b.id) === boxId);
      if (!box) return jsonResponse([]);
      if (!canViewBox(box, params)) throw new Error('Unauthorized: cannot access this box');

      const msgs = sheetToArray('Messages')
        .filter(m => normalize(m.box_id) === boxId && normalize(m.status) === 'approved')
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return jsonResponse(msgs);
    }

    case 'getStats': {
      const schools = sheetToArray('Schools');
      const boxes = sheetToArray('Boxes').filter(b => normalize(b.status) !== 'draft');
      const items = sheetToArray('Items');
      return jsonResponse({ schools: schools.length, boxes: boxes.length, items: items.length });
    }

    case 'getUsers':
      requireAdmin(params);
      return jsonResponse(sheetToArray('Users'));

    case 'translate': {
      const text = normalize(params.text);
      const to = normalize(params.to || 'en');
      if (!text) return jsonResponse('');
      const translated = LanguageApp.translate(text, '', to);
      return jsonResponse(translated);
    }

    // ===== SCHOOLS (admin) =====
    case 'createSchool': {
      requireAdmin(params);
      const school = {
        id: generateId('sch'),
        name_ko: normalize(params.name_ko),
        name_en: normalize(params.name_en),
        name_ja: normalize(params.name_ja),
        country: normalize(params.country),
        logo_url: normalize(params.logo_url),
        created_at: new Date().toISOString(),
      };
      appendRow('Schools', school);
      return jsonResponse(school);
    }

    case 'updateSchool': {
      requireAdmin(params);
      const updates = {};
      ['name_ko', 'name_en', 'name_ja', 'country', 'logo_url'].forEach(f => {
        if (params[f] !== undefined) updates[f] = params[f];
      });
      return jsonResponse(updateRow('Schools', params.id, updates));
    }

    case 'deleteSchool':
      requireAdmin(params);
      return jsonResponse(deleteRow('Schools', params.id));

    // ===== USERS (admin) =====
    case 'createUser': {
      requireAdmin(params);
      const user = {
        id: generateId('usr'),
        school_id: normalize(params.school_id),
        role: normalize(params.role),
        name: normalize(params.name),
        email: normalize(params.email || params.code),
        lang_pref: normalize(params.lang_pref),
        created_at: new Date().toISOString(),
      };
      appendRow('Users', user);
      return jsonResponse(user);
    }

    case 'updateUser': {
      requireAdmin(params);
      const updates = {};
      ['school_id', 'role', 'name', 'email', 'lang_pref'].forEach(f => {
        if (params[f] !== undefined) updates[f] = params[f];
      });
      return jsonResponse(updateRow('Users', params.id, updates));
    }

    case 'deleteUser':
      requireAdmin(params);
      return jsonResponse(deleteRow('Users', params.id));

    // ===== BOXES =====
    case 'createBox': {
      // admin or authenticated school-side requester
      if (!isAdminTokenValid(normalize(params.admin_token)) && !normalize(params.requester_school_id || params.from_school_id)) {
        throw new Error('Unauthorized: requester_school_id required');
      }
      const box = {
        id: generateId('box'),
        title: normalize(params.title),
        title_en: normalize(params.title_en),
        title_ja: normalize(params.title_ja),
        description: normalize(params.description),
        description_en: normalize(params.description_en),
        description_ja: normalize(params.description_ja),
        from_school_id: normalize(params.from_school_id),
        to_school_id: normalize(params.to_school_id),
        status: normalize(params.status || 'draft'),
        cover_image_url: normalize(params.cover_image_url),
        created_by: normalize(params.created_by),
        created_at: new Date().toISOString().split('T')[0],
        sent_at: '',
        opened_at: '',
      };
      appendRow('Boxes', box);
      return jsonResponse(box);
    }

    case 'updateBox': {
      const boxes = sheetToArray('Boxes');
      const box = boxes.find(b => normalize(b.id) === normalize(params.id));
      if (!box) return jsonResponse(null);
      if (!canViewBox(box, params) && !isAdminTokenValid(normalize(params.admin_token))) {
        throw new Error('Unauthorized');
      }

      const updates = {};
      ['title','title_en','title_ja','description','description_en','description_ja','from_school_id','to_school_id','status','cover_image_url','sent_at','opened_at']
        .forEach(f => { if (params[f] !== undefined) updates[f] = params[f]; });
      return jsonResponse(updateRow('Boxes', params.id, updates));
    }

    case 'sendBox': {
      const boxes = sheetToArray('Boxes');
      const box = boxes.find(b => normalize(b.id) === normalize(params.id));
      if (!box) return jsonResponse(null);
      if (!canViewBox(box, params) && !isAdminTokenValid(normalize(params.admin_token))) {
        throw new Error('Unauthorized');
      }
      return jsonResponse(updateRow('Boxes', params.id, { status: 'sent', sent_at: new Date().toISOString().split('T')[0] }));
    }

    case 'openBox': {
      const boxes = sheetToArray('Boxes');
      const box = boxes.find(b => normalize(b.id) === normalize(params.id));
      if (!box) return jsonResponse(null);
      if (!canViewBox(box, params)) throw new Error('Unauthorized');
      return jsonResponse(updateRow('Boxes', params.id, { status: 'opened', opened_at: new Date().toISOString().split('T')[0] }));
    }

    case 'deleteBox': {
      requireAdmin(params);
      const bid = normalize(params.id);
      deleteRow('Boxes', bid);
      sheetToArray('Items').filter(i => normalize(i.box_id) === bid).forEach(i => deleteRow('Items', i.id));
      sheetToArray('Messages').filter(m => normalize(m.box_id) === bid).forEach(m => deleteRow('Messages', m.id));
      return jsonResponse(true);
    }

    // ===== ITEMS =====
    case 'addItem': {
      const boxes = sheetToArray('Boxes');
      const box = boxes.find(b => normalize(b.id) === normalize(params.box_id));
      if (!box) throw new Error('Box not found');
      if (!canViewBox(box, params) && !isAdminTokenValid(normalize(params.admin_token))) throw new Error('Unauthorized');

      const item = {
        id: generateId('itm'),
        box_id: normalize(params.box_id),
        type: normalize(params.type || 'text'),
        title: normalize(params.title),
        title_en: normalize(params.title_en),
        title_ja: normalize(params.title_ja),
        content: normalize(params.content),
        content_en: normalize(params.content_en),
        content_ja: normalize(params.content_ja),
        file_url: normalize(params.file_url),
        order: Number(params.order || 0),
        created_by: normalize(params.created_by),
        created_at: new Date().toISOString(),
        trans_ko: '',
        trans_en: '',
        trans_ja: '',
      };
      appendRow('Items', item);
      return jsonResponse(item);
    }

    case 'removeItem': {
      requireAdmin(params);
      return jsonResponse(deleteRow('Items', params.id));
    }

    // ===== MESSAGES =====
    case 'addMessage': {
      const boxes = sheetToArray('Boxes');
      const box = boxes.find(b => normalize(b.id) === normalize(params.box_id));
      if (!box) throw new Error('Box not found');
      if (!canViewBox(box, params)) throw new Error('Unauthorized');

      const msg = {
        id: generateId('msg'),
        box_id: normalize(params.box_id),
        user_id: normalize(params.user_id),
        user_name: normalize(params.user_name),
        user_school: normalize(params.user_school),
        content: normalize(params.content),
        type: normalize(params.type || 'text'),
        media_url: normalize(params.media_url),
        parent_id: normalize(params.parent_id),
        status: normalize(params.status || 'approved') || 'approved',
        created_at: new Date().toISOString(),
      };
      appendRow('Messages', msg);
      return jsonResponse(msg);
    }

    case 'updateMessage':
      requireAdmin(params);
      return jsonResponse(updateRow('Messages', params.id, { content: normalize(params.content) }));

    case 'deleteMessage':
      requireAdmin(params);
      return jsonResponse(deleteRow('Messages', params.id));

    case 'updateMessageStatus':
      requireAdmin(params);
      return jsonResponse(updateRow('Messages', params.id, { status: normalize(params.status) }));

    // ===== REACTIONS =====
    case 'addReaction': {
      const reaction = {
        id: generateId('rct'),
        target_type: normalize(params.target_type),
        target_id: normalize(params.target_id),
        user_id: normalize(params.user_id),
        type: normalize(params.type || 'heart'),
        created_at: new Date().toISOString(),
      };
      appendRow('Reactions', reaction);
      return jsonResponse(reaction);
    }

    // ===== FILE UPLOAD =====
    case 'uploadFileInit': {
      const uploadId = generateId('upl');
      const cache = CacheService.getScriptCache();
      cache.put('upload_' + uploadId + '_meta', JSON.stringify({
        fileName: normalize(params.fileName || 'file'),
        mimeType: normalize(params.mimeType || 'application/octet-stream'),
        totalChunks: parseInt(params.totalChunks, 10) || 1,
      }), 600);
      return jsonResponse({ uploadId: uploadId });
    }

    case 'uploadFileChunk': {
      const cache = CacheService.getScriptCache();
      cache.put('upload_' + normalize(params.uploadId) + '_chunk_' + normalize(params.chunkIndex), normalize(params.data), 600);
      return jsonResponse({ ok: true });
    }

    case 'uploadFileFinalize': {
      const cache = CacheService.getScriptCache();
      const uploadId = normalize(params.uploadId);
      const metaStr = cache.get('upload_' + uploadId + '_meta');
      if (!metaStr) throw new Error('Upload session expired');

      const meta = JSON.parse(metaStr);
      let base64 = '';
      for (let i = 0; i < Number(meta.totalChunks || 0); i++) {
        const chunkData = cache.get('upload_' + uploadId + '_chunk_' + i);
        if (!chunkData) throw new Error('Missing chunk ' + i);
        base64 += chunkData;
      }

      let folder;
      const folders = DriveApp.getFoldersByName('CultureBox');
      folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('CultureBox');

      const blob = Utilities.newBlob(Utilities.base64Decode(base64), meta.mimeType, meta.fileName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const fileUrl = 'https://drive.google.com/uc?id=' + file.getId();

      cache.remove('upload_' + uploadId + '_meta');
      for (let j = 0; j < Number(meta.totalChunks || 0); j++) cache.remove('upload_' + uploadId + '_chunk_' + j);

      return jsonResponse({ fileUrl: fileUrl });
    }

    default:
      throw new Error('Unknown action: ' + action);
  }
}

// ====== WEB APP ENTRY POINTS ======

function doGet(e) {
  try {
    return handleRequest((e && e.parameter) || {});
  } catch (err) {
    return errorResponse(err.message || String(err));
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    return handleRequest(body);
  } catch (err) {
    return errorResponse('doPost error: ' + (err.message || String(err)));
  }
}

// ====== SETUP (run once) ======

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const schemas = {
    Schools: ['id', 'name_ko', 'name_en', 'name_ja', 'country', 'logo_url', 'created_at'],
    Users: ['id', 'school_id', 'role', 'name', 'email', 'lang_pref', 'created_at'],
    Boxes: ['id', 'title', 'title_en', 'title_ja', 'description', 'description_en', 'description_ja', 'from_school_id', 'to_school_id', 'status', 'cover_image_url', 'created_by', 'created_at', 'sent_at', 'opened_at'],
    Items: ['id', 'box_id', 'type', 'title', 'title_en', 'title_ja', 'content', 'content_en', 'content_ja', 'file_url', 'order', 'created_by', 'created_at', 'trans_ko', 'trans_en', 'trans_ja'],
    Messages: ['id', 'box_id', 'user_id', 'user_name', 'user_school', 'content', 'type', 'media_url', 'parent_id', 'status', 'created_at'],
    Reactions: ['id', 'target_type', 'target_id', 'user_id', 'type', 'created_at'],
  };

  Object.keys(schemas).forEach((name) => {
    const headers = schemas[name];
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);

    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4A6CF7');
    headerRange.setFontColor('#FFFFFF');

    headers.forEach((_, i) => sheet.autoResizeColumn(i + 1));
    sheet.setFrozenRows(1);
  });

  const schoolsSheet = ss.getSheetByName('Schools');
  if (schoolsSheet.getLastRow() < 2) {
    const sampleSchools = [
      ['sch_01', '서울 하늘초등학교', 'Seoul Sky Elementary', 'ソウルスカイ小学校', 'KR', '', new Date().toISOString()],
      ['sch_02', '도쿄 사쿠라 초등학교', 'Tokyo Sakura Elementary', '東京さくら小学校', 'JP', '', new Date().toISOString()],
      ['sch_03', '뉴욕 브루클린 초등학교', 'Brooklyn Elementary', 'ブルックリン小学校', 'US', '', new Date().toISOString()],
      ['sch_04', '부산 바다초등학교', 'Busan Ocean Elementary', '釜山オーシャン小学校', 'KR', '', new Date().toISOString()],
    ];
    sampleSchools.forEach((row) => schoolsSheet.appendRow(row));
  }

  Logger.log('Setup complete');
}

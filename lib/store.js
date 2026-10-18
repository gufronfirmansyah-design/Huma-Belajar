import { upgradeDemo } from './demo-catalog.js';
import { seed } from './demo-data.js';
export let config, client, user, data;
const KEY = 'huma-belajar-demo-v1';
export const isDemo = () => config?.mode === 'demo';
export async function init() {
  config = await fetch('./config.public.json', { cache: 'no-store' }).then((r) => {
    if (!r.ok) throw Error('Konfigurasi tidak ditemukan.');
    return r.json();
  });
  if (isDemo()) {
    try {
      data = JSON.parse(localStorage.getItem(KEY)) || seed();
    } catch {
      data = seed();
    }
    data = upgradeDemo(data);
    upgradeSchoolsDemo();
    setDemoRole(sessionStorage.getItem('huma-demo-role') || 'student');
    return;
  }
  if (!config.supabaseUrl || !config.supabasePublishableKey)
    throw Error('Koneksi belum diatur. Jalankan ATUR-KONFIGURASI.bat.');
  if (!window.supabase) throw Error('Pustaka login tidak tersedia. Periksa paket website.');
  client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: sessionStorage
    }
  });
  const health = await client.rpc('public_status');
  if (health.error || health.data?.schema_version !== '1.5.0')
    throw Error(
      'Database belum siap untuk versi 1.5. Buka panduan kategori 01: instalasi baru atau upgrade 06-upgrade-1.5.sql.'
    );
  const { data: auth, error } = await client.auth.getSession();
  if (error) throw error;
  if (auth.session) await refresh();
}
export async function login() {
  location.hash = '/login';
}
export async function logout() {
  if (client) {
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }
  user = null;
  data = null;
  sessionStorage.removeItem('huma-class');
  location.reload();
}
export function setDemoRole(role) {
  if (!['student', 'teacher', 'admin', 'editor', 'observer'].includes(role)) return;
  sessionStorage.setItem('huma-demo-role', role);
  user = data.profiles.find((p) => p.role === role);
  if (user) user.central_admin = role === 'admin';
}
export async function refresh() {
  if (isDemo()) return;
  const { data: result, error } = await client.rpc('bootstrap');
  if (error) throw Error(error.message);
  data = result.data;
  user = result.user;
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    throw Error('Penyimpanan demo penuh/tidak tersedia. Perubahan belum tersimpan.');
  }
}
export async function action(name, args = {}) {
  if (user?.role === 'observer')
    throw Error('Admin sekolah hanya dapat membaca progres dan nilai.');
  if (!isDemo()) {
    const { data: result, error } = await client.rpc('app_action', {
      action_name: name,
      payload: { ...args, school_id: data.school_id }
    });
    if (error) throw Error(error.message);
    await refresh();
    return result;
  }
  const before = structuredClone(data);
  try {
    let result;
    if (name === 'import_questions') {
      if (!['admin', 'editor', 'teacher'].includes(user.role))
        throw Error('Akses tidak diizinkan.');
      let inserted = 0,
        skipped = 0;
      for (const row of args.rows) {
        if (data.questions.some((q) => q.course_id === args.course_id && q.code === row.code)) {
          skipped++;
          continue;
        }
        data.questions.push({
          ...row,
          id: crypto.randomUUID(),
          course_id: args.course_id,
          status: 'draft'
        });
        inserted++;
      }
      result = { inserted, skipped };
    } else if (name === 'save') {
      const row = { ...args.record, id: args.record.id || crypto.randomUUID() };
      const list = data[args.entity];
      const index = list.findIndex((x) => x.id === row.id);
      if (index < 0) list.push(row);
      else list[index] = { ...list[index], ...row };
      data.audit.unshift({
        id: crypto.randomUUID(),
        actor_id: user.id,
        action: 'save:' + args.entity,
        created_at: new Date().toISOString()
      });
      result = row;
    } else if (name === 'archive') {
      const row = data[args.entity].find((x) => x.id === args.id);
      if (row) row.status = 'archived';
    } else if (name === 'progress') {
      const old = data.progress.find(
        (x) => x.student_id === user.id && x.material_id === args.material_id
      );
      if (old) old.completed = args.completed;
      else
        data.progress.push({
          id: crypto.randomUUID(),
          student_id: user.id,
          material_id: args.material_id,
          completed: args.completed
        });
    } else if (name === 'start') {
      let attempt = data.attempts.find(
        (x) => x.student_id === user.id && x.quiz_id === args.quiz_id && x.status === 'active'
      );
      if (!attempt) {
        const quiz = data.quizzes.find((q) => q.id === args.quiz_id);
        attempt = {
          id: crypto.randomUUID(),
          student_id: user.id,
          quiz_id: quiz.id,
          course_id: quiz.course_id,
          title: quiz.title,
          started_at: new Date().toISOString(),
          status: 'active',
          questions: quiz.question_ids.map((id) =>
            structuredClone(data.questions.find((q) => q.id === id))
          ),
          answers: {}
        };
        data.attempts.push(attempt);
      }
      result = publicAttempt(attempt);
    } else if (name === 'answer') {
      const a = data.attempts.find((x) => x.id === args.attempt_id && x.student_id === user.id);
      if (!a || a.status !== 'active') throw Error('Pengerjaan sudah selesai atau tidak tersedia.');
      a.answers[args.question_id] = args.answer;
    } else if (name === 'submit') {
      const a = data.attempts.find((x) => x.id === args.attempt_id && x.student_id === user.id);
      if (!a) throw Error('Pengerjaan tidak ditemukan.');
      if (a.status !== 'submitted') {
        a.status = 'submitted';
        a.submitted_at = new Date().toISOString();
        a.correct = a.questions.filter((q) => a.answers[q.id] === q.answer).length;
        a.score = Math.round((a.correct / a.questions.length) * 100);
      }
      result = publicAttempt(a);
    } else if (name === 'attempt') {
      result = publicAttempt(
        data.attempts.find((x) => x.id === args.id && x.student_id === user.id)
      );
    } else throw Error('Tindakan tidak dikenali.');
    persist();
    return result;
  } catch (error) {
    data = before;
    throw error;
  }
}
function upgradeSchoolsDemo() {
  data.schools ||= [{ id: 'sekolah-demo', name: 'Sekolah Contoh Huma', active: true }];
  data.school_id ||= 'sekolah-demo';
  data.my_schools ||= [];
  data.demo_codes ||= {};
  data.demo_spaces ||= {};
  data.course_links ||= data.courses.map((c) => ({ class_id: c.class_id, course_id: c.id }));
  data.course_previews ||= data.courses.flatMap((c) => {
    const chapter = data.chapters.find(
      (ch) => ch.course_id === c.id && Number(ch.position || 1) === 1
    );
    const lesson = data.lessons.find(
      (l) => l.chapter_id === chapter?.id && Number(l.position || 1) === 1
    );
    return lesson ? [{ course_id: c.id, lesson_id: lesson.id }] : [];
  });
  for (const role of ['editor', 'observer'])
    if (!data.profiles.some((p) => p.role === role))
      data.profiles.push({
        id: role + '-demo',
        role,
        name: role === 'editor' ? 'Tim Konten' : 'Pemantau Sekolah',
        email: role + '@example.test',
        active: true
      });
  data.courses.forEach((c) => (c.grade ||= 'SMA/SMK · X'));
}
export async function schoolAction(operation, payload = {}) {
  if (user?.role === 'observer' && !['select', 'profile_name'].includes(operation))
    throw Error('Admin sekolah hanya dapat memantau. Hubungi tim aplikasi.');
  if (!isDemo()) {
    const { data: result, error } = await client.rpc('school_action', { operation, payload });
    if (error) throw Error(error.message);
    if (result?.error) throw Error(result.error);
    await refresh();
    sessionStorage.removeItem('huma-class');
    return result;
  }
  const before = structuredClone(data);
  try {
    let result = {};
    if (operation === 'profile_name') {
      user.name = payload.name;
    } else if (operation === 'team_role') {
      const p = data.profiles.find((p) => p.id === payload.user_id);
      if (p) p.role = payload.role === 'none' ? 'student' : payload.role;
    } else if (operation === 'link_course') {
      data.course_links = data.course_links.filter(
        (l) => l.class_id !== payload.class_id || l.course_id !== payload.course_id
      );
      if (payload.active)
        data.course_links.push({ class_id: payload.class_id, course_id: payload.course_id });
    } else if (operation === 'preview') {
      data.course_previews = data.course_previews.filter((p) => p.course_id !== payload.course_id);
      data.course_previews.push({ course_id: payload.course_id, lesson_id: payload.lesson_id });
    } else if (operation === 'save_school') {
      if (user.role !== 'admin') throw Error('Hanya admin pusat.');
      const school = data.schools.find((s) => s.id === payload.school_id);
      if (school) Object.assign(school, { name: payload.name, active: payload.active ?? true });
      else data.schools.push({ id: crypto.randomUUID(), name: payload.name, active: true });
    } else if (operation === 'select') {
      const keys = ['classes', 'memberships', 'progress', 'attempts', 'audit'];
      data.demo_spaces[data.school_id] = Object.fromEntries(keys.map((k) => [k, data[k]]));
      const next =
        data.demo_spaces[payload.school_id] || Object.fromEntries(keys.map((k) => [k, []]));
      for (const key of keys) data[key] = next[key] || [];
      data.school_id = payload.school_id;
      sessionStorage.removeItem('huma-class');
    } else if (operation === 'create_code') {
      if (user.role !== 'admin') throw Error('Hanya admin.');
      const code = 'DEMO-' + crypto.randomUUID().replaceAll('-', '').toUpperCase();
      data.demo_codes[payload.class_id] = {
        code,
        school_id: data.school_id,
        expires: Date.now() + Number(payload.days) * 86400000
      };
      result = { code };
    } else if (operation === 'revoke_code') {
      if (user.role !== 'admin') throw Error('Hanya admin.');
      delete data.demo_codes[payload.class_id];
    } else if (operation === 'join') {
      const found = Object.entries(data.demo_codes).find(
        ([, v]) =>
          v.school_id === data.school_id &&
          v.code === payload.code.trim().toUpperCase() &&
          v.expires > Date.now()
      );
      if (!found) throw Error('Kode demo tidak valid atau kedaluwarsa.');
      if (!data.memberships.some((m) => m.student_id === user.id && m.class_id === found[0]))
        data.memberships.push({
          id: crypto.randomUUID(),
          student_id: user.id,
          class_id: found[0],
          active: true
        });
      data.my_schools = [{ school_id: data.school_id, role: 'student', status: 'active' }];
    } else if (operation === 'request_teacher')
      data.my_schools = [{ school_id: data.school_id, role: 'teacher', status: 'pending' }];
    else if (operation === 'review') {
      if (user.role !== 'admin') throw Error('Hanya admin.');
      const p = data.profiles.find((p) => p.id === payload.user_id);
      if (p) {
        p.role = payload.role;
        p.school_status = payload.status;
        p.active = payload.status === 'active';
      }
    }
    persist();
    return result;
  } catch (e) {
    data = before;
    throw e;
  }
}
function publicAttempt(a) {
  if (!a) throw Error('Pengerjaan tidak tersedia.');
  const copy = structuredClone(a);
  if (copy.status !== 'submitted')
    copy.questions.forEach((q) => {
      delete q.answer;
      delete q.explanation;
    });
  return copy;
}
export function currentClass() {
  const id = sessionStorage.getItem('huma-class');
  return data?.classes.find((c) => c.id === id) || data?.classes[0];
}
export function setClass(id) {
  sessionStorage.setItem('huma-class', id);
}
export function visibleCourses() {
  const c = currentClass();
  return (data?.courses || []).filter(
    (x) =>
      x.status !== 'archived' &&
      (['teacher', 'admin', 'editor'].includes(user?.role) ||
        data.course_links?.some((l) => l.class_id === c?.id && l.course_id === x.id))
  );
}
export function completion(courseId) {
  const materials = (data?.materials || []).filter(
    (m) => m.course_id === courseId && m.status === 'published'
  );
  const done = materials.filter((m) =>
    data.progress.some((p) => p.student_id === user.id && p.material_id === m.id && p.completed)
  ).length;
  return {
    done,
    total: materials.length,
    percent: materials.length ? Math.round((done / materials.length) * 100) : 0
  };
}
export function resetDemo() {
  localStorage.removeItem(KEY);
  location.reload();
}
export async function fileUrl(path) {
  const { data: result, error } = await client.storage.from('learning').createSignedUrl(path, 120);
  if (error) throw error;
  return result.signedUrl;
}
export async function upload(file, courseId) {
  if (isDemo())
    throw Error(
      'Unggahan berkas nyata hanya tersedia setelah Supabase terhubung. Gunakan materi teks untuk mencoba demo.'
    );
  const { data: result, error } = await client.functions.invoke('upload-material', {
    body: await toUpload(file, courseId)
  });
  if (error) throw Error('Unggah gagal. Periksa koneksi, izin, dan fungsi backend.');
  if (result.error) throw Error(result.error);
  return result.path;
}
async function toUpload(file, courseId) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192)
    bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return { course_id: courseId, name: file.name, type: file.type, content: btoa(bin) };
}

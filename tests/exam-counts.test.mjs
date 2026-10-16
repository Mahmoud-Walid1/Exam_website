import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const asModule = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const academicUrl = asModule(readFileSync(new URL('../js/academic.js', import.meta.url), 'utf8'));
const countsUrl = asModule(readFileSync(new URL('../js/exam-counts.js', import.meta.url), 'utf8').replace("'./academic.js?v=20261016-types'", JSON.stringify(academicUrl)));
const { changeExamCounts, resolveExamCounts } = await import(countsUrl);
assert.deepEqual(resolveExamCounts(), { periodic: 74, central: 8, centralFinal: 18, total: 217 });
assert.equal(resolveExamCounts({ central: 8 }).central, 8, 'Original periodic-central counts stay separate');
assert.equal(resolveExamCounts({ central: 26, centralCategoryVersion: 2 }).central, 8, 'Merged schema is corrected');
assert.equal(resolveExamCounts({ central: 8, centralCategoryVersion: 3 }).central, 8, 'Correction cannot repeat');
assert.deepEqual(changeExamCounts({ periodic: 10, central: 3, centralFinal: 2, total: 30, centralCategoryVersion: 3 }, null, { examType: 'اختبار فتري' }), { periodic: 11, central: 3, centralFinal: 2, total: 31 });
assert.deepEqual(changeExamCounts({ periodic: 10, central: 3, centralFinal: 2, total: 30, centralCategoryVersion: 3 }, { examType: 'اختبار فتري' }, { examType: 'اختبار فتري مركزي' }), { periodic: 9, central: 4, centralFinal: 2, total: 30 });
assert.deepEqual(changeExamCounts({ periodic: 10, central: 3, centralFinal: 2, total: 30, centralCategoryVersion: 3 }, { examType: 'اختبار فتري مركزي' }, { examType: 'اختبار مركزي' }), { periodic: 10, central: 2, centralFinal: 3, total: 30 });
assert.deepEqual(changeExamCounts({ periodic: 10, central: 3, centralFinal: 2, total: 30, centralCategoryVersion: 3 }, { examType: 'اختبار قصير' }, null), { periodic: 10, central: 3, centralFinal: 2, total: 29 });

// Exercise the actual write functions with an atomic in-memory Firestore adapter.
const adapterUrl = asModule(`
export const state = { records: new Map(), reads: [], failCommit: false, retry: false, id: 0 };
export const collection = (db, name) => ({ path: name });
export function doc(...args) {
    const path = args.length === 1 ? args[0].path + '/auto-' + (++state.id) : args[1] + '/' + args[2];
    return { path, id: path.split('/').at(-1) };
}
const snapshot = (map, ref) => ({ exists: () => map.has(ref.path), data: () => structuredClone(map.get(ref.path)) });
export async function getDoc(ref) { state.reads.push(ref.path); return snapshot(state.records, ref); }
export async function runTransaction(db, callback) {
    async function attempt(commit) {
        const local = new Map([...state.records].map(([k,v]) => [k, structuredClone(v)]));
        let writing = false;
        await callback({
            get: async ref => { if (writing) throw Error('Read after write'); return snapshot(local, ref); },
            set: (ref, value, opts) => { writing = true; local.set(ref.path, opts?.merge ? { ...local.get(ref.path), ...value } : value); },
            update: (ref, value) => { writing = true; if (!local.has(ref.path)) throw Error('Missing'); local.set(ref.path, { ...local.get(ref.path), ...value }); },
            delete: ref => { writing = true; local.delete(ref.path); }
        });
        if (commit) {
            if (state.failCommit) throw Error('Simulated failed commit');
            state.records = local;
        }
    }
    if (state.retry) { state.retry = false; await attempt(false); }
    await attempt(true);
}
export const getDocs = () => { throw Error('Unexpected collection read'); };
export const query = () => {}; export const where = () => {}; export const orderBy = () => {};
export const documentId = () => {}; export const limit = () => {}; export const startAfter = () => {};
export const updateDoc = () => {}; export const onSnapshot = () => {}; export const setDoc = () => {}; export const increment = () => {};
`);
let source = readFileSync(new URL('../js/firebase-data.js', import.meta.url), 'utf8');
source = source.replace("'./academic.js?v=20261016-types'", JSON.stringify(academicUrl))
    .replace("'./exam-counts.js?v=20261016-types'", JSON.stringify(countsUrl))
    .replace("'./firebase-config.js'", JSON.stringify(asModule('export const db = {}; export const auth = {};')))
    .replace("'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'", JSON.stringify(adapterUrl));
globalThis.window = {};
const { addExam, updateExam, deleteExam, getExamCounts } = await import(asModule(source));
const { state } = await import(adapterUrl);
assert.deepEqual(await getExamCounts(), { periodic: 74, central: 8, centralFinal: 18, total: 217 });
assert.deepEqual(state.reads, ['settings/examCounts'], 'Counters must read only the saved summary');
state.retry = true;
const id = await addExam({ name: 'test', examType: 'اختبار فتري' });
assert.deepEqual(await getExamCounts(), { periodic: 75, central: 8, centralFinal: 18, total: 218 }, 'Transaction retries cannot double increment');
await updateExam(id, { name: 'renamed' });
assert.deepEqual(await getExamCounts(), { periodic: 75, central: 8, centralFinal: 18, total: 218 });
await updateExam(id, { examType: 'اختبار فتري مركزي' });
assert.deepEqual(await getExamCounts(), { periodic: 74, central: 9, centralFinal: 18, total: 218 });
state.failCommit = true;
const originalError = console.error;
console.error = () => {};
try { await assert.rejects(deleteExam(id), /Simulated failed commit/); }
finally { console.error = originalError; }
assert.equal(state.records.has('exams/' + id), true, 'Failed commit must preserve the exam');
assert.deepEqual(await getExamCounts(), { periodic: 74, central: 9, centralFinal: 18, total: 218 });
state.failCommit = false;
await deleteExam(id);
await deleteExam(id);
assert.deepEqual(await getExamCounts(), { periodic: 74, central: 8, centralFinal: 18, total: 217 }, 'Repeated deletion must not double decrement');
await addExam({ examType: 'اختبار قصير' });
assert.deepEqual(await getExamCounts(), { periodic: 74, central: 8, centralFinal: 18, total: 218 });
state.records.set('settings/examCounts', { periodic: 74, central: 8, total: 217 });
state.records.set('exams/legacy', { examType: 'اختبار مركزي' });
await updateExam('legacy', { examType: 'الاختبار المركزي النهائي' });
assert.deepEqual(await getExamCounts(), { periodic: 74, central: 8, centralFinal: 18, total: 217 }, 'Renaming a legacy central exam must not count it again');
assert.equal(state.records.get('settings/examCounts').centralCategoryVersion, 3);
await updateExam('legacy', { name: 'renamed again' });
assert.deepEqual(await getExamCounts(), { periodic: 74, central: 8, centralFinal: 18, total: 217 }, 'The legacy adjustment must not repeat');
delete globalThis.window;
console.log('Saved counter checks passed: summary-only reads, add, retry, edit, type transfer, atomic failure and repeated delete.');

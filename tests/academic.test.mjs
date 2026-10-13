import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../js/academic.js', import.meta.url), 'utf8');
const { normalizeYear, getExamYear, resolveAcademicSettings, getArchiveYears, isInAcademicScope } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

assert.equal(normalizeYear('١٤٤٨'), '1448');
assert.equal(normalizeYear('2026'), '');
assert.equal(getExamYear({}), '1447');
assert.equal(getExamYear({ academicYear: 1448 }), '1448');
// Existing defaultTerm must not expose the second term during the new-year rollout.
assert.deepEqual(resolveAcademicSettings({ defaultTerm: 'الفصل الثاني' }), { currentYear: '1448', activeTerm: 'الفصل الأول', showSecondTerm: false });
assert.equal(resolveAcademicSettings({ activeTerm: 'الفصل الثاني', showSecondTerm: true }).activeTerm, 'الفصل الثاني');
assert.equal(resolveAcademicSettings({ activeTerm: 'الفصل الثاني', showSecondTerm: false }).activeTerm, 'الفصل الأول');
const exams = [{}, { academicYear: '1446' }, { academicYear: '1448' }, { academicYear: '1449' }, { academicYear: '1447' }];
assert.deepEqual(getArchiveYears(exams, '1448'), ['1447', '1446']);
assert.equal(isInAcademicScope({}, '1448', 'الفصل الأول'), false);
assert.equal(isInAcademicScope({}, '1447', 'الفصل الأول'), true);
assert.equal(isInAcademicScope({ academicYear: '1448', term: 'الفصل الثاني' }, '1448', 'الفصل الأول'), false);
console.log('Academic year, archive and term checks passed.');

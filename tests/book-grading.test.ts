import test from "node:test";
import assert from "node:assert/strict";
import { gradeAnswer } from "../lib/book-race/grading.server";
import { book, bookInfo } from "../lib/book-race/book";
import { pageLayout, pageSvg } from "../lib/book-race/page-image";
test("strict numerical grading needs only the answer", () => {
  for (const answer of ["142", " 142\n", "+142", "00142"])
    assert.deepEqual(gradeAnswer(answer), {grading:"correct"});
  for (const answer of ["142junk", "142.5", "142.0", "1.42e2", "135+15-8", "NaN", "Infinity", "", "143", "-142"])
    assert.equal(gradeAnswer(answer).grading,"incorrect",answer);
});
test("all 20 pages, contents, and SVG layouts preserve evidence without overflowing", () => {
  assert.equal(bookInfo().pageCount,20);
  for (const item of book.contents) assert.equal(book.pages[item.page-1].title,item.title);
  for (const page of book.pages) {
    assert.equal(page.label,String(page.page));
    const l=pageLayout(page);
    assert.ok(l.leading>=20, `page ${page.page} legibility`);
    assert.ok(l.top+(l.lines.length-1)*l.leading<=990);
    assert.ok(l.lines.every(line=>line.length<=65));
    assert.match(pageSvg(book.title,page),/<svg/);
  }
  assert.doesNotMatch(JSON.stringify(bookInfo()),/142|expectedAnswer|evidencePages/);
  assert.doesNotMatch(book.pages.slice(18).map(p=>p.text).join(" "), /nine-engineer|15-instance|five teaching|three collaborators/i);
  assert.doesNotMatch(book.pages[12].title,/Nine/);
});

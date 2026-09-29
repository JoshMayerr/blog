import manuscript from "../../docs/books/martin-zhu/book.json";
export type BookPage = { page: number; label: string; title: string; text: string };
// One canonical page source for every reading interface. No task or answer key here.
export const book = {
  id: manuscript.id,
  title: `${manuscript.title}: ${manuscript.subtitle}`,
  description: manuscript.description,
  contents: manuscript.contents,
  pages: manuscript.pages.map(({ page, label, title, text }): BookPage => ({ page, label, title, text })),
};
export function bookInfo() {
  return { id: book.id, title: book.title, description: book.description,
    pageCount: book.pages.length, contents: book.contents };
}

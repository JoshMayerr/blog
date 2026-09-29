// Server runtime only: never import this module from a client component or contract.
export const taskVersion = "martin-six-facts-v1";
const expectedAnswer = 142;
export function gradeAnswer(answer: string) {
  const normalized = answer.trim();
  const correct = /^[+-]?\d+$/.test(normalized) &&
    Number.isSafeInteger(Number(normalized)) && Number(normalized) === expectedAnswer;
  return { grading: correct ? "correct" as const : "incorrect" as const };
}

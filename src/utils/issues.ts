// Issue №38 was the week of 2026-09-11; later weeks continue the weekly count.
const ISSUE_ANCHOR = { weekOf: '2026-09-11', number: 38 };
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function parseLocalDate(weekOf: string): Date {
  const [y, m, d] = weekOf.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function shortDate(weekOf: string): string {
  const d = parseLocalDate(weekOf);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function issueLabel(weekOf: string) {
  const weeks = Math.round(
    (parseLocalDate(weekOf).getTime() - parseLocalDate(ISSUE_ANCHOR.weekOf).getTime()) / (7 * 86400000)
  );
  return {
    number: ISSUE_ANCHOR.number + weeks,
    date: `${DAY_NAMES[parseLocalDate(weekOf).getDay()]} ${weekOf.replace(/-/g, '·')}`,
  };
}

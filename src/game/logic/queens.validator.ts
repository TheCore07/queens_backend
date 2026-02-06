import { QueenPosition } from '../types/QueenPosition.type';

/**
 * Prüft:
 * - eine Queen pro Zeile
 * - eine Queen pro Spalte
 * - eine Queen pro Farbe
 * - keine diagonalen Angriffe
 */
export function validateQueensSolution(queens: QueenPosition[]): boolean {
  const rows = new Set<number>();
  const cols = new Set<number>();
  const colors = new Set<number>();

  for (const q of queens) {
    if (rows.has(q.row)) return false;
    if (cols.has(q.col)) return false;
    if (colors.has(q.color)) return false;

    rows.add(q.row);
    cols.add(q.col);
    colors.add(q.color);
  }

  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const a = queens[i];
      const b = queens[j];

      if (Math.abs(a.row - b.row) === Math.abs(a.col - b.col)) {
        return false;
      }
    }
  }

  return true;
}

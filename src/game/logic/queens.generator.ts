import { QueensBoard } from '../types/QueensBoard.type';
import { BoardType } from '../types/Board.type';

/**
 * Erzeugt eine valide N-Queens-Lösung
 * Rückgabe: index = row, value = col
 */
function solveNQueens(size: number): number[] {
  const cols = Array(size).fill(-1);

  function isValid(row: number, col: number): boolean {
    for (let r = 0; r < row; r++) {
      const c = cols[r];
      if (c === col) return false;
      if (Math.abs(c - col) === Math.abs(r - row)) return false;
    }
    return true;
  }

  function backtrack(row: number): boolean {
    if (row === size) return true;

    const shuffledCols = [...Array(size).keys()].sort(
      () => Math.random() - 0.5,
    );

    for (const col of shuffledCols) {
      if (isValid(row, col)) {
        cols[row] = col;
        if (backtrack(row + 1)) return true;
        cols[row] = -1;
      }
    }
    return false;
  }

  backtrack(0);
  return cols;
}

/**
 * Erstellt farbige Regionen (Flood-Fill-ähnlich)
 * Jede Region enthält exakt eine Queen
 */
function generateRegions(size: number, queens: number[]): number[][] {
  const regions = Array.from({ length: size }, () => Array(size).fill(-1));

  // Queen-Startpunkte
  queens.forEach((col, row) => {
    regions[row][col] = row;
  });

  let openCells = true;

  while (openCells) {
    openCells = false;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] !== -1) continue;

        const neighbors = [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ].filter(
          ([nr, nc]) =>
            nr >= 0 &&
            nc >= 0 &&
            nr < size &&
            nc < size &&
            regions[nr][nc] !== -1,
        );

        if (neighbors.length) {
          const [nr, nc] =
            neighbors[Math.floor(Math.random() * neighbors.length)];
          regions[r][c] = regions[nr][nc];
          openCells = true;
        }
      }
    }
  }

  return regions;
}

/**
 * Öffentliche API: erzeugt ein vollständiges Queens-Board
 */
export function generateQueensBoard(size = 5): QueensBoard {
  const queens = solveNQueens(size);
  const regions = generateRegions(size, queens);

  const board: BoardType = regions.map(row =>
    row.map(color => ({
      color,
      hasQueen: false,
    })),
  );

  const solution = queens.map((col, row) => ({
    row,
    col,
    color: regions[row][col],
  }));

  return { board, solution };
}

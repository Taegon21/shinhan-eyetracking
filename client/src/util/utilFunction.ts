interface Point {
  x: number;
  y: number;
}

export const generateShuffledPoints = (rows: number, cols: number): Point[] => {
  const padding = 80;
  const spacingX = (window.innerWidth - 2 * padding) / (cols - 1);
  const spacingY = (window.innerHeight - 2 * padding) / (rows - 1);
  const points: Point[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push({
        x: padding + col * spacingX,
        y: padding + row * spacingY,
      });
    }
  }

  const extremePoints: Point[] = [
    { x: padding, y: padding },
    { x: window.innerWidth - padding, y: padding },
    { x: padding, y: window.innerHeight - padding },
    { x: window.innerWidth - padding, y: window.innerHeight - padding },
  ];

  const filtered = points.filter(
    (p) =>
      !extremePoints.some(
        (ep) => Math.abs(ep.x - p.x) < 1 && Math.abs(ep.y - p.y) < 1
      )
  );

  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  return [...extremePoints, ...filtered];
};

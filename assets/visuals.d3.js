export async function renderImpactChart(svgEl) {
  if (!svgEl) return;

  const d3 = await import('https://cdn.jsdelivr.net/npm/d3@7/+esm');
  const svg = d3.select(svgEl);
  const root = svg.select('.impact-bars');
  if (root.empty()) return;

  const width = 100;
  const height = 32;
  const bars = [
    { x: 8, width: 16, value: 8, max: 50, label: 'Mentored 8+ engineers' },
    { x: 42, width: 16, value: 30, max: 50, label: '30% load-time reduction' },
    { x: 76, width: 16, value: 50, max: 50, label: '50k+ daily users' },
  ];

  const y = d3.scaleLinear().domain([0, 50]).range([height - 4, 4]);

  const rects = root.selectAll('rect')
    .data(bars)
    .attr('x', d => d.x)
    .attr('width', d => d.width)
    .attr('y', height - 4)
    .attr('height', 0)
    .attr('rx', 1.6);

  rects
    .transition()
    .duration(720)
    .ease(d3.easeCubicOut)
    .attr('y', d => y(d.value))
    .attr('height', d => height - 4 - y(d.value));

  svg.attr('aria-label', 'Impact chart with three bars: 8+ engineers mentored, 30 percent load reduction, and 50k+ daily users.');
}

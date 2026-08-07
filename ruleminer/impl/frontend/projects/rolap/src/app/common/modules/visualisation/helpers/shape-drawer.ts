interface Node {
  x: number;
  y: number;
}

interface LinkData {
  source: Node;
  target: Node;
  multiLinkIndex: number;
  totalLinks: number;
}

export function boundingBox(node: Node, width: number, height: number, nodeRadius: number): void {
  node.x = Math.max(nodeRadius, Math.min(width - nodeRadius, node.x));
  node.y = Math.max(nodeRadius, Math.min(height - nodeRadius, node.y));
}

export function linkArc(d: any, width: number, height: number, nodeRadius: number, unbound: boolean): string {
  const x1 = unbound ? d.source.x : Math.max(nodeRadius, Math.min(width - nodeRadius, d.source.x));
  const y1 = unbound ? d.source.y : Math.max(nodeRadius, Math.min(height - nodeRadius, d.source.y));
  const x2 = unbound ? d.target.x : Math.max(nodeRadius, Math.min(width - nodeRadius, d.target.x));
  const y2 = unbound ? d.target.y : Math.max(nodeRadius, Math.min(height - nodeRadius, d.target.y));

  const dx = x2 - x1,
    dy = y2 - y1,
    dr = Math.sqrt(dx * dx + dy * dy);

  // Use this to spread the links apart (increase for more curve)
  const curve = (d.multiLinkIndex - (d.totalLinks - 1) / 2) * 40;

  return `M${x1},${y1}A${dr + curve},${dr + curve} 0 0,1 ${x2},${y2}`;
}

export interface GraphDimensions {
  width: number;
  height: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  color?: string;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  color: string;
  multiLinkIndex?: number;
  totalLinks?: number;
}

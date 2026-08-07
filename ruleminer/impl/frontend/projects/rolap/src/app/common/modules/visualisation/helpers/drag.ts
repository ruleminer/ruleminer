import * as d3 from 'd3';
import { DragBehavior } from 'd3-drag';

export class GraphDragger {
  private drag: DragBehavior<SVGSVGElement, any, any>;
  public width: number;
  public height: number;

  constructor(private simulation: d3.Simulation<any, any>, width: number, height: number) {
    this.width = width;
    this.height = height;

    this.drag = d3
      .drag<SVGSVGElement, unknown, unknown>()
      .on('start', (event: any, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event: any, d: any) => {
        const radius = 30; // Adjust this value to whatever the node's radius is, or a bit more for some padding

        const newX = Math.max(radius, Math.min(this.width - radius, event.x));
        const newY = Math.max(radius, Math.min(this.height - radius, event.y));

        d.fx = newX;
        d.fy = newY;
      })
      .on('end', (event: any, d: any) => {
        if (!event.active) simulation.alphaTarget(0);
      });
  }

  public getDrag(): DragBehavior<SVGSVGElement, unknown, unknown> {
    return this.drag;
  }
}

import * as d3 from 'd3';

export interface NodeDrawingStrategy {
  draw(enterNodes: any, toggleCondition: any): void;
}

function setRectangleText(node: any) {
  return node
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', 'white')
    .attr('font-size', '12px');
}

function getTextWidth(node: any, text: string): number {
  const textElement = node.append('text').text(text).attr('font-size', '12px');
  const width = textElement.node().getBBox().width;
  textElement.remove();
  return width;
}

function getTextWidthsForNodes(nodes: any) {
  const textWidths: number[] = [];

  nodes.each(function (this: any, d: any) {
    textWidths.push(getTextWidth(d3.select(this), d.label));
  });

  return textWidths;
}

const setDoubleLineText = (nodes: any) => {
  function generateText(this: SVGSVGElement, d: any) {
    const text = d3.select(this);

    const parts = d.label.toString().split(' '); // Assuming the label is split by a colon
    text
      .append('tspan')
      .attr('x', 0)
      .attr('dy', parts.length > 1 ? '-0.6em' : '0em') // Move slightly above the center
      .text(parts[0].trim());
    if (parts.length > 1) {
      text
        .append('tspan')
        .attr('x', 0)
        .attr('dy', '1.2em') // Move slightly below the center
        .text(parts[1].trim());
    }
  }
  return generateText;
};

export class ConditionNodeDrawing implements NodeDrawingStrategy {
  constructor(private isChecked?: boolean, private uuid?: string) {}
  draw(nodes: any, toggleCondition: any): void {
    // Create text elements temporarily to measure their width
    const textWidths: any[] = [];

    nodes.each(function (this: any, d: any) {
      const thisNode = d3.select(this);
      const text = d.label;
      const textElement = thisNode.append('text').text(text);
      if (!!textElement.node()) {
        textWidths.push(textElement.node()!.getBBox().width);
      }
      textElement.remove();
    });

    const color = this.isChecked ? '#f06b32' : '#2229f5';
    nodes
      .append('rect')
      .attr('width', (d: any, i: any) => textWidths[i]) // Adding padding
      .attr('height', 40)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('fill', color)
      .attr('data-selected', this.isChecked)
      .attr('data-uuid', this.uuid)
      .attr('x', (d: any, i: any) => -(textWidths[i] / 2)) // Adjust x based on width
      .attr('y', -27);

    nodes
      .append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .each(function (this: SVGSVGElement, d: any) {
        const text = d3.select(this);
        const parts = d.label.split('=');

        text.append('tspan').attr('x', 0).attr('dy', '-0.8em').text(parts[0].trim());

        if (parts.length > 1) {
          text.append('tspan').attr('x', 0).attr('dy', '1em').text(parts[1].trim());
        }
      });

    nodes.on('click', function (this: SVGSVGElement, d: any) {
      const rect = d3.select(this).select('rect');
      const currentlySelected = rect.attr('data-selected') === 'true'; // Convert string to boolean

      rect
        .attr('data-selected', !currentlySelected)
        .attr('data-original-color', currentlySelected ? '#f06b32' : '#2229f5')
        .attr('fill', !currentlySelected ? '#f06b32' : '#2229f5');

      if (!!toggleCondition) {
        toggleCondition(d.srcElement.__data__.condition);
      }
    });
  }
}

export class ClassNodeDrawing implements NodeDrawingStrategy {
  draw(nodes: any, toggleCondition: any): void {
    const textWidths: number[] = getTextWidthsForNodes(nodes);

    // Create circles based on the width of the text
    nodes
      .append('circle')
      .attr('r', (d: any, i: any) => textWidths[i] / 2 + 10) // Radius based on text width and adding some padding
      .attr('fill', 'green');

    setRectangleText(nodes).each(setDoubleLineText(nodes));
  }
}

export class RuleNodeDrawing implements NodeDrawingStrategy {
  draw(nodes: any, toggleCondition: any): void {
    const textWidths: number[] = getTextWidthsForNodes(nodes);

    // Create circles based on the width of the text
    nodes
      .append('circle')
      .attr('r', (d: any, i: any) => textWidths[i] / 2 + 10) // Radius based on text width and adding some padding
      .attr('fill', (d: any) => d.color);

    setRectangleText(nodes).text((d: any) => d.label);
  }
}

import * as d3 from 'd3';
import { v4 as uuidv4 } from 'uuid';

import { SelectedGraphNodes } from '../../../store/v2VisualizationTab/types';
import { RulesetParser } from '../../rulesets/helpers/ruleset-parser';
import { NodeFactory } from '../factories/drawing-factory';
import { GraphDragger } from '../helpers/drag';
import { boundingBox, linkArc } from '../helpers/shape-drawer';
import { colors } from '../interfaces/colors';
import { GraphData } from '../interfaces/graph-data';
import { GraphNode } from '../interfaces/graph-elements';

export default class NetworkGraph {
  linkPathName: string = uuidv4();
  data: GraphData;
  rules: any[];
  margin: { top: number; right: number; bottom: number; left: number };
  width: number;
  height: number;
  orignalWidth: number;
  orignalHeight: number;
  graphDragger: GraphDragger | undefined;
  simulation: any;
  zoomed: boolean = false;
  selectedGraphNodes: SelectedGraphNodes;
  toggle = (data: any) => {};

  constructor(rules: any[], selectedGraphNodes: SelectedGraphNodes | null, toggle: (data: any) => void) {
    this.data = new GraphData();
    this.rules = rules;
    this.margin = { top: 0, right: 0, bottom: 0, left: 0 };
    this.selectedGraphNodes = selectedGraphNodes || [];
    this.toggle = toggle;
  }

  drawGraph(body: any, isMaxHeightSet: boolean = false, enableZoom: boolean = false): void {
    if (!body || !body.node()) return;

    this.width = body.node().clientWidth - this.margin.left - this.margin.right;

    if (isMaxHeightSet) {
      this.height = body.node().clientHeight - this.margin.top - this.margin.bottom;
    } else {
      this.height = body.node().clientWidth * 0.6 - this.margin.top - this.margin.bottom;
    }
    this.orignalHeight = this.height;
    this.orignalWidth = this.width;

    body.select('svg').remove();
    const svgElement = body.append('svg');
    const baseSvg = svgElement
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('id', 'general-group');

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 5]) // Set the zoom scale limits as needed
      .on('zoom', (event: any) => {
        baseSvg.attr('transform', event.transform);
        this.zoomed = true;
        this.width = this.orignalWidth / event.transform.k;
        this.height = this.orignalHeight / event.transform.k;

        baseSvg
          .attr('width', this.width + this.margin.left + this.margin.right)
          .attr('height', this.height + this.margin.top + this.margin.bottom);

        if (!!this.graphDragger) {
          this.graphDragger.width = this.width;
          this.graphDragger.height = this.height;
        }
      });
    const drag = d3
      .drag()
      .on('start', () => {
        baseSvg.style('cursor', 'grabbing');
      })
      .on('drag', (event) => {
        baseSvg.attr('transform', event.transform);
      })
      .on('end', () => {
        baseSvg.style('cursor', 'grab');
      });

    if (enableZoom) {
      svgElement.call(zoom);
      svgElement.call(drag);
    }

    this.data.body = baseSvg
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.data.body.append('g').attr('id', 'links');

    this.data.body.append('g').attr('id', 'nodes');

    //#region PARSE DATA

    let ruleIndex = 0;
    this.data.nodes = this.rules.map((rule): GraphNode => {
      const randomUUID = uuidv4();
      rule.uuid = `${rule.uuid} ${randomUUID}`;
      return {
        id: rule.uuid,
        label: 'Rule ' + (rule.index + 1),
        type: 'rule',
        color: colors[ruleIndex++ % colors.length].value,
      };
    });
    const parser: RulesetParser = new RulesetParser(this.rules, colors);
    parser.parse();

    this.data.nodes = this.data.nodes.concat(Array.from(parser.subconditionsMap.values()));
    this.data.nodes = this.data.nodes.concat(Array.from(parser.classificationMap.values()));
    this.data.links = parser.links;

    //#endregion

    this.handleSimulation();
  }

  private createGraphElements(simulation: any): void {
    // Handling links
    const linksSelection = this.data.body
      .select('#links')
      .attr('class', 'links')
      .selectAll('path')
      .data(this.data.links, (d: any) => d.id); // Using a key function for data join based on id

    linksSelection.exit().remove();

    linksSelection
      .enter()
      .append('path')
      .attr('fill', 'none')
      .merge(linksSelection) // Merging enter + update
      .attr('stroke', (d: any) => d.color)
      .attr('stroke-width', 5)
      .attr('id', (d: any, i: any) => this.linkPathName + i);

    linksSelection
      .enter()
      .append('text')
      .attr('dy', '-10px')
      .append('textPath')
      .merge(linksSelection)
      .attr('href', (d: any, i: any) => `#${this.linkPathName}` + i)
      .attr('startOffset', '40%')
      .text((d: any) => ((d as any).showText ? d.text : ''));

    // Handling nodes
    const nodesSelection = this.data.body
      .select('#nodes')
      .attr('class', 'nodes')
      .selectAll('g.node')
      .data(this.data.nodes, (d: any) => d.id); // Using a key function for data join based on id

    nodesSelection.exit().remove();

    const enterNodes = nodesSelection.enter().append('g').attr('class', 'node').merge(nodesSelection); // Merging enter + update

    enterNodes.each((d: any) => {
      if (d.type === 'class' && !isNaN(d.label)) {
        const decimalPlaces = d.label.toString().split('.')[1]?.length || 0;
        if (decimalPlaces > 2) {
          d.label = Number(d.label).toFixed(2);
        }
      }

      const isInSelectedGraphNodes = this.selectedGraphNodes.some((conditionGroup: any) =>
        conditionGroup.some((condition: any) => {
          return d.label === condition.text && d.condition?.rule_uuid === condition.rule_uuid;
        }),
      );

      const node = enterNodes.filter((nodeData: any) => nodeData.id === d.id);

      const strategy = NodeFactory.createDrawingStrategy(d.type, isInSelectedGraphNodes);
      strategy.draw(node, (condition: any) => {
        this.toggle(condition);
      });

      const textElement = node.select('text');
      if (textElement.size() > 0) {
        textElement
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('x', 0)
          .attr('y', (d: { type: string }) => {
            return d.type === 'condition' ? -5 : null;
          })
          .style('pointer-events', 'none')
          .attr('font-size', '12px')
          .text(d.label);

        if (d.label.length > 15) {
          textElement.style('font-size', '11px');
        }
      }
    });

    this.graphDragger = new GraphDragger(simulation, this.width, this.height);
    enterNodes.call(this.graphDragger.getDrag());
  }

  public updateElements(): void {
    if (!this.data.body) return;
    this.data.body
      .select('#links')
      .selectAll('path')
      .attr('d', (d: any) => {
        return linkArc(d, this.width, this.height, 30, this.zoomed);
      })
      .attr('stroke', (d: any) => d.color)
      .attr('stroke-width', 5)
      .attr('id', (d: any, i: any) => this.linkPathName + i);

    const links = this.data.body.select('#links').selectAll('text').data(this.data.links);

    links.exit().remove();
    links
      .enter()
      .append('text')
      .attr('dy', '-10px')
      .append('textPath')
      .attr('href', (d: any, i: any) => `#${this.linkPathName}` + i)
      .attr('startOffset', '40%')
      .text((d: any) => ((d as any).showText ? d.text : ''));

    const nodes = this.data.body.select('.nodes');
    nodes
      .selectAll('g.node')
      .each((d: any) => {
        const radius = d.type === 'rule' || d.type === 'class' ? 30 : 25;
        if (!this.zoomed) {
          boundingBox(d, this.width, this.height, radius);
        }
      })
      .attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
  }

  private handleSimulation() {
    this.simulation = d3
      .forceSimulation()
      .force(
        'link',
        d3
          .forceLink()
          .id((d: any) => d.id)
          .distance(100),
      )
      .force(
        'charge',
        d3.forceManyBody().strength((d: any) => -600),
      )
      .force('collide', d3.forceCollide().radius(30))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force(
        'x',
        d3
          .forceX()
          .strength((d: any) => {
            if (d.type === 'rule' || d.type === 'class') return 0.5;
            return 0.05;
          })
          .x((d: any) => {
            if (!!d.fx) return d.fx;
            if (d.type === 'rule') return 100;
            if (d.type === 'class') return this.width - 100;

            return this.width / 2;
          }),
      )
      .force(
        'y',
        d3
          .forceY()
          .strength((d: any) => {
            if (d.type === 'rule' || d.type === 'class') return 0.3;
            return 0.0;
          })
          .y((d: any) => {
            if (!!d.fy) return d.fy;
            return this.height / 2;
          }),
      );

    this.simulation.nodes(this.data.nodes).on('tick', () => {
      this.updateElements();
    });

    (this.simulation.force('link') as any).links(this.data.links);
    this.createGraphElements(this.simulation);
  }
}

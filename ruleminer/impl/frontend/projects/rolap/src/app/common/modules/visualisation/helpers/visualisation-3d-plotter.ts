import {
  COMMON_CONFIG,
  COMMON_LAYOUT_OPTIONS,
  COMMON_TRACE_OPTIONS,
  SCATTER,
  SCATTER3D,
} from '../enums/visualisation-3d-options';
import { Visualisation3DTextHandler } from './visualisation-3d-text-handler';

export class Visualisation3DPlotter {
  public plotExists: boolean = false;
  constructor(public plotType: string) {}

  public updatePlotType(plotType: string) {
    this.plotType = plotType;
  }

  public fixOrderOfRules(id1: any[], id2: any[], text: any[]) {
    for (let i = 0; i < id1.length; i++) {
      if (id1[i] !== id2[i]) {
        const index = id2.indexOf(id1[i]);
        const temp = id2[i];
        id2[i] = id2[index];
        id2[index] = temp;
        const temp2 = text[i];
        text[i] = text[index];
        text[index] = temp2;
      }
    }
    return {
      id2,
      text,
    };
  }

  public hasDuplicates(x: any[], y: any[], z: any[], id: any[], plotType: string) {
    const duplicates: any[] = [];
    for (var i = 0; i < x.length; i++) {
      const duplicatesForPoint: any[] = [];
      for (var j = i + 1; j < x.length; j++) {
        if (
          (plotType === 'scatter' && x[i] === x[j] && y[i] === y[j]) ||
          (plotType === 'scatter3d' && x[i] === x[j] && y[i] === y[j] && z[i] === z[j])
        ) {
          //check if the ID is already included in the duplicated array or the duplicated2 array
          if (!duplicates.some((arr) => arr.includes(id[i])) && !duplicatesForPoint.includes(id[i])) {
            duplicatesForPoint.push(id[i]);
          }

          //check if the ID is already included in the duplicated array or the duplicated2 array
          if (!duplicatesForPoint.includes(id[j]) && !duplicates.some((arr) => arr.includes(id[j]))) {
            duplicatesForPoint.push(id[j]);
          }
        }
      }
      // if there are any duplicates for a point, add them to the duplicates array
      if (duplicatesForPoint.length !== 0) {
        duplicates.push(duplicatesForPoint);
      }
    }
    // return the two-dimensional array of IDs of duplicated values
    return duplicates;
  }

  public plotRuleIndicators(chosenIndicators: any[], ruleIndicatorsJSON: any, ruleSetJSON: any) {
    const axisTitles = chosenIndicators;
    let x: any[] = [],
      y: any[] = [],
      z: any[] = [];
    //extract chosen indicators and id values from the JSON data
    switch (chosenIndicators.length) {
      //plot 2D
      case 2:
        x = ruleIndicatorsJSON.map(function (d: any) {
          return d.indicators[chosenIndicators[0]];
        });
        y = ruleIndicatorsJSON.map(function (d: any) {
          return d.indicators[chosenIndicators[1]];
        });
        break;
      //plot 3D
      case 3:
        x = ruleIndicatorsJSON.map(function (d: any) {
          return d.indicators[chosenIndicators[0]];
        });
        y = ruleIndicatorsJSON.map(function (d: any) {
          return d.indicators[chosenIndicators[1]];
        });
        z = ruleIndicatorsJSON.map(function (d: any) {
          return d.indicators[chosenIndicators[2]];
        });
        break;
    }
    const idWskaznikiRegul = ruleIndicatorsJSON.map(function (d: any) {
      return d.rule_uuid;
    });

    const duplicates = this.hasDuplicates(x, y, z, idWskaznikiRegul, this.plotType);

    //check if the order of the ids from two files is the same
    //if not changing the order of the idZbiorRegul and rule text
    let ruleText = ruleSetJSON.rules.map(function (d: any) {
      return d.string;
    });
    let idZbiorRegul = ruleSetJSON.rules.map(function (d: any) {
      return d.uuid;
    });

    const fixedOrder = this.fixOrderOfRules(idWskaznikiRegul, idZbiorRegul, ruleText);

    idZbiorRegul = fixedOrder.id2;
    ruleText = fixedOrder.text;

    const text = Visualisation3DTextHandler.combineTextForOverlappingPoints(ruleText, idZbiorRegul, duplicates);
    text.forEach((t: any, i: any) => {
      //breaking the text into smaller lines
      text[i] = Visualisation3DTextHandler.insertLineBreaks(t, 60); // 60 is number of characters per line
      //formatting the text
      text[i] = Visualisation3DTextHandler.formatText(text[i]);
    });

    let scatter_trace: any;
    let scatter_layout: any;
    let scatter_config: any;

    switch (this.plotType) {
      case 'scatter':
        scatter_trace = SCATTER.SCATTER_TRACE(x, y, chosenIndicators);
        scatter_layout = SCATTER.SCATTER_LAYOUT(axisTitles);
        scatter_config = SCATTER.SCATTER_CONFIG(axisTitles);
        break;
      case 'scatter3d':
        scatter_trace = SCATTER3D.SCATTER_TRACE(x, y, z, chosenIndicators);
        scatter_layout = SCATTER3D.SCATTER_LAYOUT(axisTitles);
        scatter_config = SCATTER3D.SCATTER_CONFIG();
        break;
    }

    (window as any).Plotly.newPlot(
      'plot',
      [
        {
          ...scatter_trace,
          ...COMMON_TRACE_OPTIONS(text),
        },
      ],
      {
        ...scatter_layout,
        ...COMMON_LAYOUT_OPTIONS,
      },
      {
        ...COMMON_CONFIG,
        ...scatter_config,
      },
    );

    if (!!document.getElementById('plot') && !!(document.getElementById('plot') as any)!.data) {
      this.plotExists = true;
    }
  }
}

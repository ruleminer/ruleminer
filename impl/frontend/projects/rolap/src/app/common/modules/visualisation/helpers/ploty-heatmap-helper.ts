export interface HeatmapData {
  titleX: string;
  titleY: string;
  labelX: string[];
  labelY: string[];
  x: string[];
  y: string[];
  z: number[][];
  type: string;
  hoverongaps: boolean;
}

export class PlotyHeatmapHelper {
  private static insertLineBreaks(text: string, maxCharactersPerLine: number) {
    const lines = [];
    const words = text.split(' ');

    for (let i = 0; i < words.length; ) {
      let currentLine = '';
      while (i < words.length && currentLine.length + words[i].length <= maxCharactersPerLine) {
        currentLine += (currentLine === '' ? '' : ' ') + words[i];
        i++;
      }
      lines.push(currentLine);
    }

    return lines.join('<br>'); // Use '<br>' for HTML line breaks
    // If you want plain text line breaks, you can use '\n' instead
  }

  public static drawHeatmap(plotData: HeatmapData, divName = '', title = '') {
    // plotData.y = plotData.y.map((y) => this.insertLineBreaks(y, 45));
    // plotData.x = plotData.x.map((x) => this.insertLineBreaks(x, 45));

    const layout = {
      responsive: true,
      title: title,
      annotations: [],
      xaxis: {
        title: plotData.titleX,
        ticks: '',
        side: 'bottom',
        autosize: true,
        automargin: true,
      },
      yaxis: {
        title: plotData.titleY,
        ticks: '',
        ticksuffix: ' ',
        autosize: true,
        automargin: true,
      },
      margin: {
        l: 80,
        r: 80,
        b: 40,
        t: 80,
        pad: 4,
      },
    };

    const textArray = [];
    for (let i = 0; i < plotData.y.length; i++) {
      const row = [];
      for (let j = 0; j < plotData.x.length; j++) {
        const textColor = 'white';

        const hovertext = `x: ${plotData.x[j]}<br>y: ${plotData.y[i]}<br>${(
          Math.round(plotData.z[i][j] * 10000) / 10000
        ).toFixed(4)}`;
        const result = {
          x: plotData.labelX[j],
          y: plotData.labelY[i],
          text: `${(Math.round(plotData.z[i][j] * 10000) / 10000).toFixed(4)}`,
          font: {
            family: 'Arial',
            size: 12,
            color: textColor,
          },
          showarrow: false,
          labelX: plotData.x[j],
          labelY: plotData.y[i],
          labelZ: (Math.round(plotData.z[i][j] * 10000) / 10000).toFixed(4),
          hovertext: hovertext,
        };
        (layout.annotations as any).push(result);
        row.push(hovertext);
      }

      textArray.push(row);
    }

    (window as any).Plotly.newPlot(
      divName,
      [
        {
          x: plotData.labelX,
          y: plotData.labelY,
          z: plotData.z,
          type: 'heatmap',
          hoverongaps: false,
          hoverinfo: 'text',
          text: textArray,
        },
      ],
      layout,
      { responsive: true },
    );
  }
}

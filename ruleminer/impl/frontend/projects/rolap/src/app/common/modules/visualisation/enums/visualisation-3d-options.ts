export const COMMON_TRACE_OPTIONS = (text: string) => {
  return {
    mode: 'markers',
    marker: {
      size: 15,
      color: '#131720',
      line: {
        color: '#dbe2eb',
        width: 0.5,
      },
      opacity: 0.7,
    },
    text: text,
    name: 'trace0',
  };
};

export const COMMON_LAYOUT_OPTIONS = {
  font: {
    family: 'Roboto',
    color: '#000',
  },
  hoverlabel: {
    align: 'left',
    bgcolor: '#c1572a',
    bordercolor: '#dbe2eb',
    font: {
      family: 'Roboto',
      color: '#fff',
    },
  },
  hovermode: 'closest',
  autosize: true,
};

export const COMMON_CONFIG = {
  responsive: true,
};

export class SCATTER {
  public static SCATTER_LAYOUT = (axisTitles: string[]) => {
    return {
      scene: {
        dragmode: false,
        xaxis: { title: axisTitles[0] },
        yaxis: { title: axisTitles[1] },
        zaxis: { title: '', showticklabels: false },
        camera: {
          up: { x: 0, y: 1, z: 0 },
          center: { x: 0, y: 0, z: 0 },
          eye: { x: 0, y: 0.1, z: 2.2 },
          perspective: 'ortographic',
        },
      },
      margin: {
        l: 0,
        r: 0,
        b: 30,
        t: 20,
      },
    };
  };

  public static SCATTER_CONFIG = (axisTitles: string[]) => {
    return {
      modeBarButtons: [
        [
          'toImage',
          'zoom3d',
          'pan3d',
          // custom reset camera button
          {
            name: 'Reset camera to default',
            icon: (window as any).Plotly.Icons.home,
            click: () => {
              (window as any).Plotly.relayout('plot', {
                scene: {
                  camera: {
                    up: { x: 0, y: 1, z: 0 },
                    center: { x: 0, y: 0, z: 0 },
                    eye: { x: 0, y: 0.1, z: 2.2 },
                    perspective: 'ortographic',
                  },
                  xaxis: { title: axisTitles[0] },
                  yaxis: { title: axisTitles[1] },
                  zaxis: { title: '', showticklabels: false },
                },
              });
            },
          },
          'resetCameraLastSave3d',
        ],
      ],
    };
  };

  public static SCATTER_TRACE = (x: any[], y: any[], chosenIndicators: any[]) => {
    return {
      x: x,
      y: y,
      z: Array(x.length).fill(0),
      hoverinfo: 'text+x+y',
      hovertemplate: '%{text}' + '<br>' + chosenIndicators[0] + ': %{x} ' + chosenIndicators[1] + ': %{y} ',
      type: 'scatter3d',
    };
  };
}

export class SCATTER3D {
  public static SCATTER_LAYOUT = (axisTitles: string[]) => {
    return {
      margin: {
        l: 0,
        r: 0,
        b: 30,
        t: 10,
      },
      scene: {
        camera: {
          //set the default camera position
          up: { x: 0, y: 0, z: 1 },
          center: { x: 0, y: 0, z: 0 },
          eye: { x: 1.25, y: 1.25, z: 1.25 },
        },
        xaxis: { title: axisTitles[0] },
        yaxis: { title: axisTitles[1] },
        zaxis: { title: axisTitles[2] },
      },
    };
  };

  public static SCATTER_TRACE = (x: any[], y: any[], z: any[], chosenIndicators: any[]) => {
    return {
      x: x,
      y: y,
      z: z,
      hoverinfo: 'text+x+y+z',
      hovertemplate:
        '%{text}' +
        '<br>' +
        chosenIndicators[0] +
        ': %{x} ' +
        chosenIndicators[1] +
        ': %{y} ' +
        chosenIndicators[2] +
        ': %{z} ',
      type: 'scatter3d',
      mode: 'markers',
    };
  };

  public static SCATTER_CONFIG = () => {
    return {
      modeBarButtons: [
        [
          'toImage',
          'zoom3d',
          'pan3d',
          'orbitRotation',
          'tableRotation',
          'resetCameraDefault3d',
          'resetCameraLastSave3d',
        ],
      ],
    };
  };
}

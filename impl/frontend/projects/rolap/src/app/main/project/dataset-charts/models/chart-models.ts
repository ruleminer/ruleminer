export type PlotParameters = {
  yaxis: {
    title: string;
    gridcolor: string;
    zerolinecolor: string;
    automargin: boolean;
    autosize: boolean;
  };
  margin: {
    l: number;
    r: number;
    b: number;
    t: number;
    pad: number;
  };
  bargap: number;
  font: {
    family: string;
    size: number;
    color: string;
  };
};

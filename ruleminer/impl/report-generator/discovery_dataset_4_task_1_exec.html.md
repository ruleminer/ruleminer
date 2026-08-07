::: {#b3d79036466859dc .cell execution_count=1}

::: {.cell-output .cell-output-stderr}
```
/usr/local/lib/python3.11/site-packages/Orange/data/io_util.py:8: DeprecationWarning: chardet.universaldetector is deprecated, import UniversalDetector from chardet or chardet.detector instead
  from chardet.universaldetector import UniversalDetector
```
:::
:::






::: {#68749763 .cell execution_count=4}

::: {.cell-output .cell-output-display}

```{=html}

<div style='text-align: center; margin-bottom: 30px; font-family: Arial, sans-serif;'>
    <h1 style='font-size: 2em; color: #2c3e50;'><strong>Knowledge discovery</strong></h1>
    <h2 style='font-size: 1.3em; color: #34495e;'>Extract interpretable patterns from data</h2>
</div>
<div style='margin: 0 auto; width: 90%; font-family: Arial, sans-serif; color: #2c3e50;'>
    <section style='margin-bottom: 30px;'>
        <h2 style='border-bottom: 2px solid #7f8c8d; padding-bottom: 10px;'>Report information</h2>
        <div style='padding-left: 2em; line-height: 1.5;'>
            <p><strong>Report name:</strong> <span style='font-style: italic; color: #2980b9;'>Raporty_kd_2026-08-06_13-54-33</span></p>
            <p><strong>Dataset name:</strong> <span style='font-style: italic; color: #2980b9;'>dasas</span></p>
        </div>
    </section>
    <section style='margin-bottom: 30px;'>
        <h3 style='border-bottom: 1px solid #bdc3c7; padding-bottom: 5px;'>Data preprocessing parameters</h3>
        <div style='padding-left: 2em; line-height: 1.5;'>
            <p>Remove attributes of low quality: <span style='font-style: italic; color: #2980b9;'>False</span></p>
            <p>Replace missing values: <span style='font-style: italic; color: #2980b9;'>True</span></p>
            <div style='padding-left: 2em;'>
                <p>For numeric attributes by: <span style='font-style: italic; color: #2980b9;'>mean</span></p>
                <p>For nominal attributes by: <span style='font-style: italic; color: #2980b9;'>most_frequent</span></p>
            </div>
            <p>Balance the sizes of decision classes: <span style='font-style: italic; color: #2980b9;'>False</span></p>
        </div>
    </section>
    <section style='margin-bottom: 30px;'>
        <h3 style='border-bottom: 1px solid #bdc3c7; padding-bottom: 5px;'>Tree parameters</h3>
        <div style='padding-left: 2em; line-height: 1.5;'>
            <p>Maximum depth: <span style='font-style: italic; color: #2980b9;'>5</span></p>
        </div>
    </section>
    
    <section style='margin-bottom: 30px;'>
        <h3 style='border-bottom: 1px solid #bdc3c7; padding-bottom: 5px;'>Rule parameters</h3>
        <div style='padding-left: 2em; line-height: 1.5;'>
            <p>CN2:</p>
            <div style='padding-left: 2em;'>
                <p>Minimum number of covered examples: <span style='font-style: italic; color: #2980b9;'>5</span></p>
                <p>Maximum number of elementary conditions: <span style='font-style: italic; color: #2980b9;'>5</span></p>
                <p>Beam width: <span style='font-style: italic; color: #2980b9;'>10</span></p>
            </div>
        </div>
    </section>
    
    <section style='margin-bottom: 30px;'>
        <h3 style='border-bottom: 1px solid #bdc3c7; padding-bottom: 5px;'>Frequent itemsets and association rules parameters</h3>
        <div style='padding-left: 2em; line-height: 1.5;'>
            <p>Exclude the decision attribute: <span style='font-style: italic; color: #2980b9;'>False</span></p>
            <p>Maximum number of intervals for numeric attributes: <span style='font-style: italic; color: #2980b9;'>10</span></p>
            <p>Maximum length: <span style='font-style: italic; color: #2980b9;'>3</span></p>
            <p>Minimum support: <span style='font-style: italic; color: #2980b9;'>0.01</span></p>
            <p>Minimum rule confidence: <span style='font-style: italic; color: #2980b9;'>0.5</span></p>
        </div>
    </section>
    </div>
```

:::
:::




::: {#58ce968fe5cff13f .cell execution_count=6}

::: {.cell-output .cell-output-display .cell-output-markdown}
## Dataset sample
:::

::: {.cell-output .cell-output-display}

```{=html}
<table id="itables_a9825400_51e6_41bd_b7c1_10c50166a129" class="display nowrap" data-quarto-disable-processing="true" style="table-layout:auto;width:auto;margin:auto;caption-side:bottom">
<thead>
    <tr style="text-align: right;">
      
      <th>sepallength</th>
      <th>sepalwidth</th>
      <th>petallength</th>
      <th>petalwidth</th>
      <th>variety</th>
    </tr>
  </thead><tbody><tr>
<td style="vertical-align:middle; text-align:left">
<div style="float:left; margin-right: 10px;">
<a href=https://mwouts.github.io/itables/><svg class="main-svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
width="64" viewBox="0 0 500 400" style="font-family: 'Droid Sans', sans-serif;">
    <g style="fill:#d9d7fc">
        <path d="M100,400H500V357H100Z" />
        <path d="M100,300H400V257H100Z" />
        <path d="M0,200H400V157H0Z" />
        <path d="M100,100H500V57H100Z" />
        <path d="M100,350H500V307H100Z" />
        <path d="M100,250H400V207H100Z" />
        <path d="M0,150H400V107H0Z" />
        <path d="M100,50H500V7H100Z" />
    </g>
    <g style="fill:#1a1366;stroke:#1a1366;">
   <rect x="100" y="7" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="5s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="0" y="107" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="3.5s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="0;0;400"
      dur="3.5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="207" width="300" height="43">
    <animate
      attributeName="width"
      values="0;300;0"
      dur="3s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="100;100;400"
      dur="3s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="307" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="4s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="4s"
      repeatCount="indefinite" />
  </rect>
        <g style="fill:transparent;stroke-width:8; stroke-linejoin:round" rx="5">
            <g transform="translate(45 50) rotate(-45)">
                <circle r="33" cx="0" cy="0" />
                <rect x="-8" y="32" width="16" height="30" />
            </g>

            <g transform="translate(450 152)">
                <polyline points="-15,-20 -35,-20 -35,40 25,40 25,20" />
                <rect x="-15" y="-40" width="60" height="60" />
            </g>

            <g transform="translate(50 352)">
                <polygon points="-35,-5 0,-40 35,-5" />
                <polygon points="-35,10 0,45 35,10" />
            </g>

            <g transform="translate(75 250)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>

            <g transform="translate(425 250) rotate(180)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>
        </g>
    </g>
</svg>
</a>
</div>
<div>
Loading ITables v2.2.2 from the internet...
(need <a href=https://mwouts.github.io/itables/troubleshooting.html>help</a>?)</td>
</div>
</tr></tbody>

</table>
<link href="https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.css" rel="stylesheet">
<script type="module">
    import {DataTable, jQuery as $} from 'https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.js';

    document.querySelectorAll("#itables_a9825400_51e6_41bd_b7c1_10c50166a129:not(.dataTable)").forEach(table => {
        if (!(table instanceof HTMLTableElement))
            return;

        // Define the table data
        const data = [[4.6, 3.1, 1.5, 0.2, "Setosa"], [5.0, 3.4, 1.6, 0.4, "Setosa"], [5.0, 3.2, 1.2, 0.2, "Setosa"], [5.0, 3.4, 1.5, 0.2, "Setosa"], [4.9, 3.1, 1.5, 0.2, "Setosa"], [6.0, 2.2, 4.0, 1.0, "Versicolor"], [5.8, 2.7, 4.1, 1.0, "Versicolor"], [6.1, 3.0, 4.6, 1.4, "Versicolor"], [6.7, 3.1, 4.4, 1.4, "Versicolor"], [5.7, 3.0, 4.2, 1.2, "Versicolor"], [6.8, 3.0, 5.5, 2.1, "Virginica"], [6.3, 2.7, 4.9, 1.8, "Virginica"], [7.7, 3.0, 6.1, 2.3, "Virginica"], [7.2, 3.6, 6.1, 2.5, "Virginica"], [6.5, 3.0, 5.5, 1.8, "Virginica"]];

        // Define the dt_args
        let dt_args = {"show_index": false, "layout": {"topStart": "pageLength", "topEnd": "search", "bottomStart": "info", "bottomEnd": "paging"}, "order": [], "warn_on_selected_rows_not_rendered": true};
        dt_args["data"] = data;

        
        new DataTable(table, dt_args);
    });
</script>
```

:::

::: {.cell-output .cell-output-display .cell-output-markdown}
## Preprocessed dataset
:::

::: {.cell-output .cell-output-display .cell-output-markdown}
#### Dataset after preprocessing
:::

::: {.cell-output .cell-output-display}

```{=html}
<table id="itables_579dd5bb_1c3d_44cf_acfe_7c5545965de5" class="display nowrap" data-quarto-disable-processing="true" style="table-layout:auto;width:auto;margin:auto;caption-side:bottom">
<thead>
    <tr style="text-align: right;">
      
      <th>sepallength</th>
      <th>sepalwidth</th>
      <th>petallength</th>
      <th>petalwidth</th>
      <th>variety</th>
    </tr>
  </thead><tbody><tr>
<td style="vertical-align:middle; text-align:left">
<div style="float:left; margin-right: 10px;">
<a href=https://mwouts.github.io/itables/><svg class="main-svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
width="64" viewBox="0 0 500 400" style="font-family: 'Droid Sans', sans-serif;">
    <g style="fill:#d9d7fc">
        <path d="M100,400H500V357H100Z" />
        <path d="M100,300H400V257H100Z" />
        <path d="M0,200H400V157H0Z" />
        <path d="M100,100H500V57H100Z" />
        <path d="M100,350H500V307H100Z" />
        <path d="M100,250H400V207H100Z" />
        <path d="M0,150H400V107H0Z" />
        <path d="M100,50H500V7H100Z" />
    </g>
    <g style="fill:#1a1366;stroke:#1a1366;">
   <rect x="100" y="7" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="5s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="0" y="107" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="3.5s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="0;0;400"
      dur="3.5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="207" width="300" height="43">
    <animate
      attributeName="width"
      values="0;300;0"
      dur="3s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="100;100;400"
      dur="3s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="307" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="4s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="4s"
      repeatCount="indefinite" />
  </rect>
        <g style="fill:transparent;stroke-width:8; stroke-linejoin:round" rx="5">
            <g transform="translate(45 50) rotate(-45)">
                <circle r="33" cx="0" cy="0" />
                <rect x="-8" y="32" width="16" height="30" />
            </g>

            <g transform="translate(450 152)">
                <polyline points="-15,-20 -35,-20 -35,40 25,40 25,20" />
                <rect x="-15" y="-40" width="60" height="60" />
            </g>

            <g transform="translate(50 352)">
                <polygon points="-35,-5 0,-40 35,-5" />
                <polygon points="-35,10 0,45 35,10" />
            </g>

            <g transform="translate(75 250)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>

            <g transform="translate(425 250) rotate(180)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>
        </g>
    </g>
</svg>
</a>
</div>
<div>
Loading ITables v2.2.2 from the internet...
(need <a href=https://mwouts.github.io/itables/troubleshooting.html>help</a>?)</td>
</div>
</tr></tbody>

</table>
<link href="https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.css" rel="stylesheet">
<script type="module">
    import {DataTable, jQuery as $} from 'https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.js';

    document.querySelectorAll("#itables_579dd5bb_1c3d_44cf_acfe_7c5545965de5:not(.dataTable)").forEach(table => {
        if (!(table instanceof HTMLTableElement))
            return;

        // Define the table data
        const data = [[4.6, 3.1, 1.5, 0.2, "Setosa"], [5.0, 3.4, 1.6, 0.4, "Setosa"], [5.0, 3.2, 1.2, 0.2, "Setosa"], [5.0, 3.4, 1.5, 0.2, "Setosa"], [4.9, 3.1, 1.5, 0.2, "Setosa"], [6.0, 2.2, 4.0, 1.0, "Versicolor"], [5.8, 2.7, 4.1, 1.0, "Versicolor"], [6.1, 3.0, 4.6, 1.4, "Versicolor"], [6.7, 3.1, 4.4, 1.4, "Versicolor"], [5.7, 3.0, 4.2, 1.2, "Versicolor"], [6.8, 3.0, 5.5, 2.1, "Virginica"], [6.3, 2.7, 4.9, 1.8, "Virginica"], [7.7, 3.0, 6.1, 2.3, "Virginica"], [7.2, 3.6, 6.1, 2.5, "Virginica"], [6.5, 3.0, 5.5, 1.8, "Virginica"]];

        // Define the dt_args
        let dt_args = {"show_index": false, "layout": {"topStart": "pageLength", "topEnd": "search", "bottomStart": "info", "bottomEnd": "paging"}, "order": [], "warn_on_selected_rows_not_rendered": true};
        dt_args["data"] = data;

        
        new DataTable(table, dt_args);
    });
</script>
```

:::

::: {.cell-output .cell-output-display .cell-output-markdown}
#### Dataset after one-hot encoding and label encoding
:::

::: {.cell-output .cell-output-display}

```{=html}
<table id="itables_f211fc42_4340_4d2a_a9d2_b5c401f59831" class="display nowrap" data-quarto-disable-processing="true" style="table-layout:auto;width:auto;margin:auto;caption-side:bottom">
<thead>
    <tr style="text-align: right;">
      
      <th>sepallength</th>
      <th>sepalwidth</th>
      <th>petallength</th>
      <th>petalwidth</th>
      <th>variety</th>
    </tr>
  </thead><tbody><tr>
<td style="vertical-align:middle; text-align:left">
<div style="float:left; margin-right: 10px;">
<a href=https://mwouts.github.io/itables/><svg class="main-svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
width="64" viewBox="0 0 500 400" style="font-family: 'Droid Sans', sans-serif;">
    <g style="fill:#d9d7fc">
        <path d="M100,400H500V357H100Z" />
        <path d="M100,300H400V257H100Z" />
        <path d="M0,200H400V157H0Z" />
        <path d="M100,100H500V57H100Z" />
        <path d="M100,350H500V307H100Z" />
        <path d="M100,250H400V207H100Z" />
        <path d="M0,150H400V107H0Z" />
        <path d="M100,50H500V7H100Z" />
    </g>
    <g style="fill:#1a1366;stroke:#1a1366;">
   <rect x="100" y="7" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="5s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="0" y="107" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="3.5s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="0;0;400"
      dur="3.5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="207" width="300" height="43">
    <animate
      attributeName="width"
      values="0;300;0"
      dur="3s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="100;100;400"
      dur="3s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="307" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="4s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="4s"
      repeatCount="indefinite" />
  </rect>
        <g style="fill:transparent;stroke-width:8; stroke-linejoin:round" rx="5">
            <g transform="translate(45 50) rotate(-45)">
                <circle r="33" cx="0" cy="0" />
                <rect x="-8" y="32" width="16" height="30" />
            </g>

            <g transform="translate(450 152)">
                <polyline points="-15,-20 -35,-20 -35,40 25,40 25,20" />
                <rect x="-15" y="-40" width="60" height="60" />
            </g>

            <g transform="translate(50 352)">
                <polygon points="-35,-5 0,-40 35,-5" />
                <polygon points="-35,10 0,45 35,10" />
            </g>

            <g transform="translate(75 250)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>

            <g transform="translate(425 250) rotate(180)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>
        </g>
    </g>
</svg>
</a>
</div>
<div>
Loading ITables v2.2.2 from the internet...
(need <a href=https://mwouts.github.io/itables/troubleshooting.html>help</a>?)</td>
</div>
</tr></tbody>

</table>
<link href="https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.css" rel="stylesheet">
<script type="module">
    import {DataTable, jQuery as $} from 'https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.js';

    document.querySelectorAll("#itables_f211fc42_4340_4d2a_a9d2_b5c401f59831:not(.dataTable)").forEach(table => {
        if (!(table instanceof HTMLTableElement))
            return;

        // Define the table data
        const data = [[4.6, 3.1, 1.5, 0.2, 0], [5.0, 3.4, 1.6, 0.4, 0], [5.0, 3.2, 1.2, 0.2, 0], [5.0, 3.4, 1.5, 0.2, 0], [4.9, 3.1, 1.5, 0.2, 0], [6.0, 2.2, 4.0, 1.0, 1], [5.8, 2.7, 4.1, 1.0, 1], [6.1, 3.0, 4.6, 1.4, 1], [6.7, 3.1, 4.4, 1.4, 1], [5.7, 3.0, 4.2, 1.2, 1], [6.8, 3.0, 5.5, 2.1, 2], [6.3, 2.7, 4.9, 1.8, 2], [7.7, 3.0, 6.1, 2.3, 2], [7.2, 3.6, 6.1, 2.5, 2], [6.5, 3.0, 5.5, 1.8, 2]];

        // Define the dt_args
        let dt_args = {"show_index": false, "layout": {"topStart": "pageLength", "topEnd": "search", "bottomStart": "info", "bottomEnd": "paging"}, "order": [], "warn_on_selected_rows_not_rendered": true};
        dt_args["data"] = data;

        
        new DataTable(table, dt_args);
    });
</script>
```

:::
:::


::: {#73547eaa712bf11f .cell execution_count=7}

::: {.cell-output .cell-output-display .cell-output-markdown}
## Trees
:::

::: {.cell-output .cell-output-display .cell-output-markdown}
#### Tree structure:
:::

::: {.cell-output .cell-output-stdout}
```
|--- petallength <= 2.45
|   |--- class: Setosa
|--- petallength >  2.45
|   |--- petalwidth <= 1.75
|   |   |--- petallength <= 4.95
|   |   |   |--- petalwidth <= 1.65
|   |   |   |   |--- class: Versicolor
|   |   |   |--- petalwidth >  1.65
|   |   |   |   |--- class: Virginica
|   |   |--- petallength >  4.95
|   |   |   |--- petalwidth <= 1.55
|   |   |   |   |--- class: Virginica
|   |   |   |--- petalwidth >  1.55
|   |   |   |   |--- petallength <= 5.45
|   |   |   |   |   |--- class: Versicolor
|   |   |   |   |--- petallength >  5.45
|   |   |   |   |   |--- class: Virginica
|   |--- petalwidth >  1.75
|   |   |--- petallength <= 4.85
|   |   |   |--- sepallength <= 5.95
|   |   |   |   |--- class: Versicolor
|   |   |   |--- sepallength >  5.95
|   |   |   |   |--- class: Virginica
|   |   |--- petallength >  4.85
|   |   |   |--- class: Virginica

```
:::

::: {.cell-output .cell-output-display .cell-output-markdown}
#### Model performance:
:::

::: {.cell-output .cell-output-display}

```{=html}
<table id="itables_fbd04334_7867_421c_85c6_24a522cb10b8" class="display nowrap" data-quarto-disable-processing="true" style="table-layout:auto;width:auto;margin:auto;caption-side:bottom">
<thead>
    <tr style="text-align: right;">
      
      <th>Balanced Accuracy</th>
      <th>F1 Score (Macro)</th>
      <th>F1 Score (Micro)</th>
      <th>F1 Score (Weighted)</th>
      <th>Geometric Mean Score (Macro)</th>
      <th>Geometric Mean Score (Micro)</th>
      <th>Geometric Mean Score (Weighted)</th>
      <th>Recall (Macro)</th>
      <th>Recall (Micro)</th>
      <th>Recall (Weighted)</th>
    </tr>
  </thead><tbody><tr>
<td style="vertical-align:middle; text-align:left">
<div style="float:left; margin-right: 10px;">
<a href=https://mwouts.github.io/itables/><svg class="main-svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
width="64" viewBox="0 0 500 400" style="font-family: 'Droid Sans', sans-serif;">
    <g style="fill:#d9d7fc">
        <path d="M100,400H500V357H100Z" />
        <path d="M100,300H400V257H100Z" />
        <path d="M0,200H400V157H0Z" />
        <path d="M100,100H500V57H100Z" />
        <path d="M100,350H500V307H100Z" />
        <path d="M100,250H400V207H100Z" />
        <path d="M0,150H400V107H0Z" />
        <path d="M100,50H500V7H100Z" />
    </g>
    <g style="fill:#1a1366;stroke:#1a1366;">
   <rect x="100" y="7" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="5s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="0" y="107" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="3.5s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="0;0;400"
      dur="3.5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="207" width="300" height="43">
    <animate
      attributeName="width"
      values="0;300;0"
      dur="3s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="100;100;400"
      dur="3s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="307" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="4s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="4s"
      repeatCount="indefinite" />
  </rect>
        <g style="fill:transparent;stroke-width:8; stroke-linejoin:round" rx="5">
            <g transform="translate(45 50) rotate(-45)">
                <circle r="33" cx="0" cy="0" />
                <rect x="-8" y="32" width="16" height="30" />
            </g>

            <g transform="translate(450 152)">
                <polyline points="-15,-20 -35,-20 -35,40 25,40 25,20" />
                <rect x="-15" y="-40" width="60" height="60" />
            </g>

            <g transform="translate(50 352)">
                <polygon points="-35,-5 0,-40 35,-5" />
                <polygon points="-35,10 0,45 35,10" />
            </g>

            <g transform="translate(75 250)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>

            <g transform="translate(425 250) rotate(180)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>
        </g>
    </g>
</svg>
</a>
</div>
<div>
Loading ITables v2.2.2 from the internet...
(need <a href=https://mwouts.github.io/itables/troubleshooting.html>help</a>?)</td>
</div>
</tr></tbody>

</table>
<link href="https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.css" rel="stylesheet">
<script type="module">
    import {DataTable, jQuery as $} from 'https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.js';

    document.querySelectorAll("#itables_fbd04334_7867_421c_85c6_24a522cb10b8:not(.dataTable)").forEach(table => {
        if (!(table instanceof HTMLTableElement))
            return;

        // Define the table data
        const data = [[1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]];

        // Define the dt_args
        let dt_args = {"layout": {"topStart": null, "topEnd": null, "bottomStart": null, "bottomEnd": null}, "order": [], "warn_on_selected_rows_not_rendered": true};
        dt_args["data"] = data;

        
        new DataTable(table, dt_args);
    });
</script>
```

:::

::: {.cell-output .cell-output-display .cell-output-markdown}
#### Confusion matrix:
:::

::: {.cell-output .cell-output-display}

```{=html}
<table id="itables_2c02b76b_e449_4d2b_b930_ad3f0a348cf7" class="display nowrap" data-quarto-disable-processing="true" style="table-layout:auto;width:auto;margin:auto;caption-side:bottom">
<thead>
    <tr style="text-align: right;">
      <th></th>
      <th>Setosa</th>
      <th>Versicolor</th>
      <th>Virginica</th>
    </tr>
  </thead><tbody><tr>
<td style="vertical-align:middle; text-align:left">
<div style="float:left; margin-right: 10px;">
<a href=https://mwouts.github.io/itables/><svg class="main-svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
width="64" viewBox="0 0 500 400" style="font-family: 'Droid Sans', sans-serif;">
    <g style="fill:#d9d7fc">
        <path d="M100,400H500V357H100Z" />
        <path d="M100,300H400V257H100Z" />
        <path d="M0,200H400V157H0Z" />
        <path d="M100,100H500V57H100Z" />
        <path d="M100,350H500V307H100Z" />
        <path d="M100,250H400V207H100Z" />
        <path d="M0,150H400V107H0Z" />
        <path d="M100,50H500V7H100Z" />
    </g>
    <g style="fill:#1a1366;stroke:#1a1366;">
   <rect x="100" y="7" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="5s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="0" y="107" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="3.5s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="0;0;400"
      dur="3.5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="207" width="300" height="43">
    <animate
      attributeName="width"
      values="0;300;0"
      dur="3s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="100;100;400"
      dur="3s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="307" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="4s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="4s"
      repeatCount="indefinite" />
  </rect>
        <g style="fill:transparent;stroke-width:8; stroke-linejoin:round" rx="5">
            <g transform="translate(45 50) rotate(-45)">
                <circle r="33" cx="0" cy="0" />
                <rect x="-8" y="32" width="16" height="30" />
            </g>

            <g transform="translate(450 152)">
                <polyline points="-15,-20 -35,-20 -35,40 25,40 25,20" />
                <rect x="-15" y="-40" width="60" height="60" />
            </g>

            <g transform="translate(50 352)">
                <polygon points="-35,-5 0,-40 35,-5" />
                <polygon points="-35,10 0,45 35,10" />
            </g>

            <g transform="translate(75 250)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>

            <g transform="translate(425 250) rotate(180)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>
        </g>
    </g>
</svg>
</a>
</div>
<div>
Loading ITables v2.2.2 from the internet...
(need <a href=https://mwouts.github.io/itables/troubleshooting.html>help</a>?)</td>
</div>
</tr></tbody>

</table>
<link href="https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.css" rel="stylesheet">
<script type="module">
    import {DataTable, jQuery as $} from 'https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.js';

    document.querySelectorAll("#itables_2c02b76b_e449_4d2b_b930_ad3f0a348cf7:not(.dataTable)").forEach(table => {
        if (!(table instanceof HTMLTableElement))
            return;

        // Define the table data
        const data = [["Setosa", 50, 0, 0], ["Versicolor", 0, 50, 0], ["Virginica", 0, 0, 50]];

        // Define the dt_args
        let dt_args = {"layout": {"topStart": null, "topEnd": null, "bottomStart": null, "bottomEnd": null}, "order": [], "warn_on_selected_rows_not_rendered": true};
        dt_args["data"] = data;

        
        new DataTable(table, dt_args);
    });
</script>
```

:::
:::


::: {#bdbcda11656cea50 .cell execution_count=8}

::: {.cell-output .cell-output-display .cell-output-markdown}
## Rules
:::

::: {.cell-output .cell-output-display .cell-output-markdown}
### Rules generated with CN2 algorithm
:::

::: {.cell-output .cell-output-display}

```{=html}
<div style='padding-left: 9em;'>IF petallength<=3.0 AND sepalwidth>=2.9 THEN variety=Setosa </div>
```

:::

::: {.cell-output .cell-output-display}

```{=html}
<div style='padding-left: 9em;'>IF petalwidth>=1.8 AND sepallength>=6.0 THEN variety=Virginica </div>
```

:::

::: {.cell-output .cell-output-display}

```{=html}
<div style='padding-left: 9em;'>IF sepallength>=4.9 AND sepalwidth>=3.1 THEN variety=Versicolor </div>
```

:::

::: {.cell-output .cell-output-display}

```{=html}
<div style='padding-left: 9em;'>IF petalwidth>=1.6 AND petalwidth>=1.8 THEN variety=Virginica </div>
```

:::

::: {.cell-output .cell-output-display}

```{=html}
<div style='padding-left: 9em;'>IF petallength<=5.0 AND sepalwidth>=2.6 THEN variety=Versicolor </div>
```

:::

::: {.cell-output .cell-output-display}

```{=html}
<div style='padding-left: 9em;'>IF petallength<=4.5 AND sepallength>=5.0 THEN variety=Versicolor </div>
```

:::

::: {.cell-output .cell-output-display}

```{=html}
<div style='padding-left: 9em;'>IF sepallength>=4.9 AND petalwidth>=1.4 AND sepallength>=6.0 AND petallength>=5.0 THEN variety=Virginica </div>
```

:::

::: {.cell-output .cell-output-display}

```{=html}
<div style='padding-left: 9em;'>IF TRUE THEN variety=Virginica </div>
```

:::

::: {.cell-output .cell-output-display .cell-output-markdown}
#### Ruleset statistics:
:::

::: {.cell-output .cell-output-display}

```{=html}
<table id="itables_54972618_e852_458a_aada_5095009ede53" class="display nowrap" data-quarto-disable-processing="true" style="table-layout:auto;width:auto;margin:auto;caption-side:bottom">
<thead>
    <tr style="text-align: right;">
      
      <th>Statistic</th>
      <th>Value</th>
    </tr>
  </thead><tbody><tr>
<td style="vertical-align:middle; text-align:left">
<div style="float:left; margin-right: 10px;">
<a href=https://mwouts.github.io/itables/><svg class="main-svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
width="64" viewBox="0 0 500 400" style="font-family: 'Droid Sans', sans-serif;">
    <g style="fill:#d9d7fc">
        <path d="M100,400H500V357H100Z" />
        <path d="M100,300H400V257H100Z" />
        <path d="M0,200H400V157H0Z" />
        <path d="M100,100H500V57H100Z" />
        <path d="M100,350H500V307H100Z" />
        <path d="M100,250H400V207H100Z" />
        <path d="M0,150H400V107H0Z" />
        <path d="M100,50H500V7H100Z" />
    </g>
    <g style="fill:#1a1366;stroke:#1a1366;">
   <rect x="100" y="7" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="5s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="0" y="107" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="3.5s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="0;0;400"
      dur="3.5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="207" width="300" height="43">
    <animate
      attributeName="width"
      values="0;300;0"
      dur="3s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="100;100;400"
      dur="3s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="307" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="4s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="4s"
      repeatCount="indefinite" />
  </rect>
        <g style="fill:transparent;stroke-width:8; stroke-linejoin:round" rx="5">
            <g transform="translate(45 50) rotate(-45)">
                <circle r="33" cx="0" cy="0" />
                <rect x="-8" y="32" width="16" height="30" />
            </g>

            <g transform="translate(450 152)">
                <polyline points="-15,-20 -35,-20 -35,40 25,40 25,20" />
                <rect x="-15" y="-40" width="60" height="60" />
            </g>

            <g transform="translate(50 352)">
                <polygon points="-35,-5 0,-40 35,-5" />
                <polygon points="-35,10 0,45 35,10" />
            </g>

            <g transform="translate(75 250)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>

            <g transform="translate(425 250) rotate(180)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>
        </g>
    </g>
</svg>
</a>
</div>
<div>
Loading ITables v2.2.2 from the internet...
(need <a href=https://mwouts.github.io/itables/troubleshooting.html>help</a>?)</td>
</div>
</tr></tbody>

</table>
<link href="https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.css" rel="stylesheet">
<script type="module">
    import {DataTable, jQuery as $} from 'https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.js';

    document.querySelectorAll("#itables_54972618_e852_458a_aada_5095009ede53:not(.dataTable)").forEach(table => {
        if (!(table instanceof HTMLTableElement))
            return;

        // Define the table data
        const data = [["number_of_rules", 8.0], ["mean_rule_length", 2.125], ["condition_sum", 17.0]];

        // Define the dt_args
        let dt_args = {"layout": {"topStart": null, "topEnd": null, "bottomStart": null, "bottomEnd": null}, "order": [], "warn_on_selected_rows_not_rendered": true};
        dt_args["data"] = data;

        
        new DataTable(table, dt_args);
    });
</script>
```

:::

::: {.cell-output .cell-output-display .cell-output-markdown}
#### Model performance:
:::

::: {.cell-output .cell-output-display}

```{=html}
<table id="itables_bf370618_c318_481c_949f_688529c1053c" class="display nowrap" data-quarto-disable-processing="true" style="table-layout:auto;width:auto;margin:auto;caption-side:bottom">
<thead>
    <tr style="text-align: right;">
      
      <th>Balanced Accuracy</th>
      <th>F1 Score (Macro)</th>
      <th>F1 Score (Micro)</th>
      <th>F1 Score (Weighted)</th>
      <th>Geometric Mean Score (Macro)</th>
      <th>Geometric Mean Score (Micro)</th>
      <th>Geometric Mean Score (Weighted)</th>
      <th>Recall (Macro)</th>
      <th>Recall (Micro)</th>
      <th>Recall (Weighted)</th>
    </tr>
  </thead><tbody><tr>
<td style="vertical-align:middle; text-align:left">
<div style="float:left; margin-right: 10px;">
<a href=https://mwouts.github.io/itables/><svg class="main-svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
width="64" viewBox="0 0 500 400" style="font-family: 'Droid Sans', sans-serif;">
    <g style="fill:#d9d7fc">
        <path d="M100,400H500V357H100Z" />
        <path d="M100,300H400V257H100Z" />
        <path d="M0,200H400V157H0Z" />
        <path d="M100,100H500V57H100Z" />
        <path d="M100,350H500V307H100Z" />
        <path d="M100,250H400V207H100Z" />
        <path d="M0,150H400V107H0Z" />
        <path d="M100,50H500V7H100Z" />
    </g>
    <g style="fill:#1a1366;stroke:#1a1366;">
   <rect x="100" y="7" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="5s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="0" y="107" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="3.5s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="0;0;400"
      dur="3.5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="207" width="300" height="43">
    <animate
      attributeName="width"
      values="0;300;0"
      dur="3s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="100;100;400"
      dur="3s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="307" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="4s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="4s"
      repeatCount="indefinite" />
  </rect>
        <g style="fill:transparent;stroke-width:8; stroke-linejoin:round" rx="5">
            <g transform="translate(45 50) rotate(-45)">
                <circle r="33" cx="0" cy="0" />
                <rect x="-8" y="32" width="16" height="30" />
            </g>

            <g transform="translate(450 152)">
                <polyline points="-15,-20 -35,-20 -35,40 25,40 25,20" />
                <rect x="-15" y="-40" width="60" height="60" />
            </g>

            <g transform="translate(50 352)">
                <polygon points="-35,-5 0,-40 35,-5" />
                <polygon points="-35,10 0,45 35,10" />
            </g>

            <g transform="translate(75 250)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>

            <g transform="translate(425 250) rotate(180)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>
        </g>
    </g>
</svg>
</a>
</div>
<div>
Loading ITables v2.2.2 from the internet...
(need <a href=https://mwouts.github.io/itables/troubleshooting.html>help</a>?)</td>
</div>
</tr></tbody>

</table>
<link href="https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.css" rel="stylesheet">
<script type="module">
    import {DataTable, jQuery as $} from 'https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.js';

    document.querySelectorAll("#itables_bf370618_c318_481c_949f_688529c1053c:not(.dataTable)").forEach(table => {
        if (!(table instanceof HTMLTableElement))
            return;

        // Define the table data
        const data = [[0.973333, 0.973315, 0.973333, 0.973315, 0.979977, 0.979977, 0.979977, 0.973333, 0.973333, 0.973333]];

        // Define the dt_args
        let dt_args = {"layout": {"topStart": null, "topEnd": null, "bottomStart": null, "bottomEnd": null}, "order": [], "warn_on_selected_rows_not_rendered": true};
        dt_args["data"] = data;

        
        new DataTable(table, dt_args);
    });
</script>
```

:::

::: {.cell-output .cell-output-display .cell-output-markdown}
#### Confusion matrix:
:::

::: {.cell-output .cell-output-display}

```{=html}
<table id="itables_7f746f66_5b98_4bcd_a60a_7df526bccf73" class="display nowrap" data-quarto-disable-processing="true" style="table-layout:auto;width:auto;margin:auto;caption-side:bottom">
<thead>
    <tr style="text-align: right;">
      <th></th>
      <th>Setosa</th>
      <th>Versicolor</th>
      <th>Virginica</th>
    </tr>
  </thead><tbody><tr>
<td style="vertical-align:middle; text-align:left">
<div style="float:left; margin-right: 10px;">
<a href=https://mwouts.github.io/itables/><svg class="main-svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
width="64" viewBox="0 0 500 400" style="font-family: 'Droid Sans', sans-serif;">
    <g style="fill:#d9d7fc">
        <path d="M100,400H500V357H100Z" />
        <path d="M100,300H400V257H100Z" />
        <path d="M0,200H400V157H0Z" />
        <path d="M100,100H500V57H100Z" />
        <path d="M100,350H500V307H100Z" />
        <path d="M100,250H400V207H100Z" />
        <path d="M0,150H400V107H0Z" />
        <path d="M100,50H500V7H100Z" />
    </g>
    <g style="fill:#1a1366;stroke:#1a1366;">
   <rect x="100" y="7" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="5s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="0" y="107" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="3.5s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="0;0;400"
      dur="3.5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="207" width="300" height="43">
    <animate
      attributeName="width"
      values="0;300;0"
      dur="3s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="100;100;400"
      dur="3s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="307" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="4s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="4s"
      repeatCount="indefinite" />
  </rect>
        <g style="fill:transparent;stroke-width:8; stroke-linejoin:round" rx="5">
            <g transform="translate(45 50) rotate(-45)">
                <circle r="33" cx="0" cy="0" />
                <rect x="-8" y="32" width="16" height="30" />
            </g>

            <g transform="translate(450 152)">
                <polyline points="-15,-20 -35,-20 -35,40 25,40 25,20" />
                <rect x="-15" y="-40" width="60" height="60" />
            </g>

            <g transform="translate(50 352)">
                <polygon points="-35,-5 0,-40 35,-5" />
                <polygon points="-35,10 0,45 35,10" />
            </g>

            <g transform="translate(75 250)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>

            <g transform="translate(425 250) rotate(180)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>
        </g>
    </g>
</svg>
</a>
</div>
<div>
Loading ITables v2.2.2 from the internet...
(need <a href=https://mwouts.github.io/itables/troubleshooting.html>help</a>?)</td>
</div>
</tr></tbody>

</table>
<link href="https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.css" rel="stylesheet">
<script type="module">
    import {DataTable, jQuery as $} from 'https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.js';

    document.querySelectorAll("#itables_7f746f66_5b98_4bcd_a60a_7df526bccf73:not(.dataTable)").forEach(table => {
        if (!(table instanceof HTMLTableElement))
            return;

        // Define the table data
        const data = [["Setosa", 50, 0, 0], ["Versicolor", 2, 47, 1], ["Virginica", 1, 0, 49]];

        // Define the dt_args
        let dt_args = {"layout": {"topStart": null, "topEnd": null, "bottomStart": null, "bottomEnd": null}, "order": [], "warn_on_selected_rows_not_rendered": true};
        dt_args["data"] = data;

        
        new DataTable(table, dt_args);
    });
</script>
```

:::
:::


::: {#bf99d0cb78a59b31 .cell execution_count=9}

::: {.cell-output .cell-output-display .cell-output-markdown}
## Frequent itemset mining
:::

::: {.cell-output .cell-output-display .cell-output-markdown}
**Frequent itemset mining was conducted on the dataset following one-hot encoding.**
:::

::: {.cell-output .cell-output-display .cell-output-markdown}
Showing top 500 or fewer frequent itemsets with the highest support.
:::

::: {.cell-output .cell-output-display}

```{=html}
<table id="itables_df20bd70_686f_4678_bbf8_fde790bbd878" class="display nowrap" data-quarto-disable-processing="true" style="table-layout:auto;width:auto;margin:auto;caption-side:bottom">
<thead>
    <tr style="text-align: right;">
      
      <th>support</th>
      <th>itemsets</th>
      <th>percentage_support_class_Setosa</th>
      <th>percentage_support_class_Versicolor</th>
      <th>percentage_support_class_Virginica</th>
    </tr>
  </thead><tbody><tr>
<td style="vertical-align:middle; text-align:left">
<div style="float:left; margin-right: 10px;">
<a href=https://mwouts.github.io/itables/><svg class="main-svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
width="64" viewBox="0 0 500 400" style="font-family: 'Droid Sans', sans-serif;">
    <g style="fill:#d9d7fc">
        <path d="M100,400H500V357H100Z" />
        <path d="M100,300H400V257H100Z" />
        <path d="M0,200H400V157H0Z" />
        <path d="M100,100H500V57H100Z" />
        <path d="M100,350H500V307H100Z" />
        <path d="M100,250H400V207H100Z" />
        <path d="M0,150H400V107H0Z" />
        <path d="M100,50H500V7H100Z" />
    </g>
    <g style="fill:#1a1366;stroke:#1a1366;">
   <rect x="100" y="7" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="5s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="0" y="107" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="3.5s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="0;0;400"
      dur="3.5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="207" width="300" height="43">
    <animate
      attributeName="width"
      values="0;300;0"
      dur="3s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="100;100;400"
      dur="3s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="307" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="4s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="4s"
      repeatCount="indefinite" />
  </rect>
        <g style="fill:transparent;stroke-width:8; stroke-linejoin:round" rx="5">
            <g transform="translate(45 50) rotate(-45)">
                <circle r="33" cx="0" cy="0" />
                <rect x="-8" y="32" width="16" height="30" />
            </g>

            <g transform="translate(450 152)">
                <polyline points="-15,-20 -35,-20 -35,40 25,40 25,20" />
                <rect x="-15" y="-40" width="60" height="60" />
            </g>

            <g transform="translate(50 352)">
                <polygon points="-35,-5 0,-40 35,-5" />
                <polygon points="-35,10 0,45 35,10" />
            </g>

            <g transform="translate(75 250)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>

            <g transform="translate(425 250) rotate(180)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>
        </g>
    </g>
</svg>
</a>
</div>
<div>
Loading ITables v2.2.2 from the internet...
(need <a href=https://mwouts.github.io/itables/troubleshooting.html>help</a>?)</td>
</div>
</tr></tbody>

</table>
<link href="https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.css" rel="stylesheet">
<script type="module">
    import {DataTable, jQuery as $} from 'https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.js';

    document.querySelectorAll("#itables_df20bd70_686f_4678_bbf8_fde790bbd878:not(.dataTable)").forEach(table => {
        if (!(table instanceof HTMLTableElement))
            return;

        // Define the table data
        const data = [[0.333333, "(variety_Setosa)", 1.0, 0.0, 0.0], [0.333333, "(sepalwidth_(2.96, 3.2])", 0.3, 0.28, 0.42], [0.333333, "(variety_Versicolor)", 0.0, 1.0, 0.0], [0.333333, "(variety_Virginica)", 0.0, 0.0, 1.0], [0.273333, "(petalwidth_(0.0976, 0.34])", 0.82, 0.0, 0.0], [0.273333, "(petalwidth_(0.0976, 0.34], variety_Setosa)", 0.82, 0.0, 0.0], [0.246667, "(variety_Setosa, petallength_(0.994, 1.59])", 0.74, 0.0, 0.0], [0.246667, "(petallength_(0.994, 1.59])", 0.74, 0.0, 0.0], [0.22, "(petalwidth_(0.0976, 0.34], petallength_(0.994, 1.59])", 0.66, 0.0, 0.0], [0.22, "(petalwidth_(0.0976, 0.34], variety_Setosa, petallength_(0.994, 1.59])", 0.66, 0.0, 0.0], [0.193333, "(petallength_(4.54, 5.13])", 0.0, 0.28, 0.3], [0.18, "(sepallength_(5.38, 5.74])", 0.18, 0.32, 0.04], [0.173333, "(petallength_(3.95, 4.54])", 0.0, 0.5, 0.02], [0.166667, "(variety_Versicolor, petallength_(3.95, 4.54])", 0.0, 0.5, 0.0], [0.16, "(sepalwidth_(2.72, 2.96])", 0.02, 0.26, 0.2], [0.153333, "(sepallength_(4.66, 5.02])", 0.38, 0.06, 0.02], [0.153333, "(petalwidth_(1.78, 2.02])", 0.0, 0.02, 0.44], [0.146667, "(sepalwidth_(2.48, 2.72])", 0.0, 0.24, 0.2], [0.146667, "(sepallength_(5.74, 6.1])", 0.02, 0.26, 0.16], [0.146667, "(variety_Virginica, petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.44], [0.14, "(petalwidth_(1.06, 1.3])", 0.0, 0.42, 0.0], [0.14, "(variety_Versicolor, petalwidth_(1.06, 1.3])", 0.0, 0.42, 0.0], [0.14, "(sepalwidth_(2.96, 3.2], variety_Virginica)", 0.0, 0.0, 0.42], [0.133333, "(sepallength_(6.1, 6.46])", 0.0, 0.14, 0.26], [0.133333, "(petalwidth_(1.3, 1.54])", 0.0, 0.34, 0.06], [0.126667, "(variety_Setosa, sepallength_(4.66, 5.02])", 0.38, 0.0, 0.0], [0.12, "(sepalwidth_(3.2, 3.44])", 0.22, 0.04, 0.1], [0.12, "(sepallength_(6.46, 6.82])", 0.0, 0.14, 0.22], [0.12, "(petallength_(5.13, 5.72], variety_Virginica)", 0.0, 0.0, 0.36], [0.12, "(petallength_(5.13, 5.72])", 0.0, 0.0, 0.36], [0.113333, "(petalwidth_(0.0976, 0.34], sepallength_(4.66, 5.02])", 0.34, 0.0, 0.0], [0.113333, "(variety_Versicolor, petalwidth_(1.3, 1.54])", 0.0, 0.34, 0.0], [0.113333, "(petalwidth_(0.0976, 0.34], variety_Setosa, sepallength_(4.66, 5.02])", 0.34, 0.0, 0.0], [0.106667, "(sepallength_(5.38, 5.74], variety_Versicolor)", 0.0, 0.32, 0.0], [0.1, "(sepalwidth_(2.96, 3.2], variety_Setosa)", 0.3, 0.0, 0.0], [0.1, "(sepalwidth_(2.96, 3.2], petalwidth_(0.0976, 0.34], variety_Setosa)", 0.3, 0.0, 0.0], [0.1, "(petallength_(4.54, 5.13], variety_Virginica)", 0.0, 0.0, 0.3], [0.1, "(sepalwidth_(2.96, 3.2], petalwidth_(0.0976, 0.34])", 0.3, 0.0, 0.0], [0.093333, "(petalwidth_(2.26, 2.5])", 0.0, 0.0, 0.28], [0.093333, "(petallength_(3.95, 4.54], petalwidth_(1.06, 1.3])", 0.0, 0.28, 0.0], [0.093333, "(variety_Versicolor, petallength_(3.95, 4.54], petalwidth_(1.06, 1.3])", 0.0, 0.28, 0.0], [0.093333, "(sepalwidth_(2.96, 3.2], variety_Versicolor)", 0.0, 0.28, 0.0], [0.093333, "(petalwidth_(2.26, 2.5], variety_Virginica)", 0.0, 0.0, 0.28], [0.093333, "(petallength_(4.54, 5.13], variety_Versicolor)", 0.0, 0.28, 0.0], [0.093333, "(sepallength_(5.02, 5.38])", 0.24, 0.04, 0.0], [0.086667, "(petallength_(1.59, 2.18], variety_Setosa)", 0.26, 0.0, 0.0], [0.086667, "(petallength_(1.59, 2.18])", 0.26, 0.0, 0.0], [0.086667, "(sepallength_(6.1, 6.46], variety_Virginica)", 0.0, 0.0, 0.26], [0.086667, "(sepallength_(5.74, 6.1], variety_Versicolor)", 0.0, 0.26, 0.0], [0.086667, "(variety_Versicolor, sepalwidth_(2.72, 2.96])", 0.0, 0.26, 0.0], [0.08, "(sepallength_(5.38, 5.74], variety_Versicolor, petalwidth_(1.06, 1.3])", 0.0, 0.24, 0.0], [0.08, "(petallength_(0.994, 1.59], sepallength_(4.66, 5.02])", 0.24, 0.0, 0.0], [0.08, "(petalwidth_(0.0976, 0.34], petallength_(0.994, 1.59], sepallength_(4.66, 5.02])", 0.24, 0.0, 0.0], [0.08, "(variety_Setosa, petallength_(0.994, 1.59], sepallength_(4.66, 5.02])", 0.24, 0.0, 0.0], [0.08, "(sepallength_(5.38, 5.74], petalwidth_(1.06, 1.3])", 0.0, 0.24, 0.0], [0.08, "(sepalwidth_(2.96, 3.2], sepallength_(6.46, 6.82])", 0.0, 0.08, 0.16], [0.08, "(variety_Versicolor, sepalwidth_(2.48, 2.72])", 0.0, 0.24, 0.0], [0.08, "(petallength_(4.54, 5.13], sepallength_(5.74, 6.1])", 0.0, 0.1, 0.14], [0.08, "(sepalwidth_(2.96, 3.2], petallength_(0.994, 1.59])", 0.24, 0.0, 0.0], [0.08, "(petallength_(4.54, 5.13], petalwidth_(1.78, 2.02])", 0.0, 0.02, 0.22], [0.08, "(sepalwidth_(2.96, 3.2], variety_Setosa, petallength_(0.994, 1.59])", 0.24, 0.0, 0.0], [0.08, "(sepalwidth_(2.96, 3.2], petalwidth_(0.0976, 0.34], petallength_(0.994, 1.59])", 0.24, 0.0, 0.0], [0.08, "(sepallength_(5.02, 5.38], variety_Setosa)", 0.24, 0.0, 0.0], [0.073333, "(petallength_(5.72, 6.31], variety_Virginica)", 0.0, 0.0, 0.22], [0.073333, "(petallength_(4.54, 5.13], variety_Virginica, petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.22], [0.073333, "(sepallength_(5.38, 5.74], petallength_(3.95, 4.54])", 0.0, 0.22, 0.0], [0.073333, "(sepallength_(5.38, 5.74], variety_Versicolor, petallength_(3.95, 4.54])", 0.0, 0.22, 0.0], [0.073333, "(petallength_(5.72, 6.31])", 0.0, 0.0, 0.22], [0.073333, "(sepalwidth_(3.2, 3.44], variety_Setosa)", 0.22, 0.0, 0.0], [0.073333, "(sepalwidth_(2.96, 3.2], petallength_(4.54, 5.13])", 0.0, 0.12, 0.1], [0.073333, "(sepallength_(6.46, 6.82], variety_Virginica)", 0.0, 0.0, 0.22], [0.073333, "(sepalwidth_(3.68, 3.92])", 0.18, 0.0, 0.04], [0.066667, "(variety_Virginica, sepalwidth_(2.48, 2.72])", 0.0, 0.0, 0.2], [0.066667, "(sepalwidth_(2.96, 3.2], variety_Setosa, sepallength_(4.66, 5.02])", 0.2, 0.0, 0.0], [0.066667, "(sepalwidth_(2.96, 3.2], petalwidth_(0.0976, 0.34], sepallength_(4.66, 5.02])", 0.2, 0.0, 0.0], [0.066667, "(sepalwidth_(3.44, 3.68])", 0.18, 0.0, 0.02], [0.066667, "(sepalwidth_(2.96, 3.2], sepallength_(4.66, 5.02])", 0.2, 0.0, 0.0], [0.066667, "(sepalwidth_(2.72, 2.96], variety_Virginica)", 0.0, 0.0, 0.2], [0.066667, "(sepalwidth_(2.96, 3.2], petalwidth_(1.3, 1.54])", 0.0, 0.2, 0.0], [0.066667, "(petallength_(4.54, 5.13], petalwidth_(1.3, 1.54])", 0.0, 0.16, 0.04], [0.066667, "(sepalwidth_(2.96, 3.2], variety_Versicolor, petalwidth_(1.3, 1.54])", 0.0, 0.2, 0.0], [0.06, "(sepallength_(4.296, 4.66], variety_Setosa, petallength_(0.994, 1.59])", 0.18, 0.0, 0.0], [0.06, "(sepallength_(5.38, 5.74], petallength_(3.95, 4.54], petalwidth_(1.06, 1.3])", 0.0, 0.18, 0.0], [0.06, "(sepallength_(5.02, 5.38], petalwidth_(0.0976, 0.34], variety_Setosa)", 0.18, 0.0, 0.0], [0.06, "(sepalwidth_(2.72, 2.96], petalwidth_(1.06, 1.3])", 0.0, 0.18, 0.0], [0.06, "(petalwidth_(2.02, 2.26], variety_Virginica)", 0.0, 0.0, 0.18], [0.06, "(sepalwidth_(2.96, 3.2], petallength_(5.13, 5.72], variety_Virginica)", 0.0, 0.0, 0.18], [0.06, "(sepalwidth_(3.44, 3.68], variety_Setosa)", 0.18, 0.0, 0.0], [0.06, "(sepalwidth_(2.72, 2.96], variety_Versicolor, petalwidth_(1.06, 1.3])", 0.0, 0.18, 0.0], [0.06, "(sepallength_(4.296, 4.66])", 0.18, 0.0, 0.0], [0.06, "(variety_Setosa, sepalwidth_(3.68, 3.92])", 0.18, 0.0, 0.0], [0.06, "(sepallength_(5.38, 5.74], variety_Setosa)", 0.18, 0.0, 0.0], [0.06, "(sepallength_(5.02, 5.38], variety_Setosa, petallength_(0.994, 1.59])", 0.18, 0.0, 0.0], [0.06, "(petalwidth_(2.02, 2.26])", 0.0, 0.0, 0.18], [0.06, "(sepallength_(5.02, 5.38], petalwidth_(0.0976, 0.34])", 0.18, 0.0, 0.0], [0.06, "(sepallength_(4.296, 4.66], petalwidth_(0.0976, 0.34], variety_Setosa)", 0.18, 0.0, 0.0], [0.06, "(sepallength_(4.296, 4.66], petalwidth_(0.0976, 0.34], petallength_(0.994, 1.59])", 0.18, 0.0, 0.0], [0.06, "(sepallength_(5.02, 5.38], petallength_(0.994, 1.59])", 0.18, 0.0, 0.0], [0.06, "(sepallength_(4.296, 4.66], variety_Setosa)", 0.18, 0.0, 0.0], [0.06, "(sepallength_(4.296, 4.66], petalwidth_(0.0976, 0.34])", 0.18, 0.0, 0.0], [0.06, "(sepallength_(4.296, 4.66], petallength_(0.994, 1.59])", 0.18, 0.0, 0.0], [0.06, "(sepalwidth_(2.96, 3.2], petallength_(5.13, 5.72])", 0.0, 0.0, 0.18], [0.06, "(petallength_(4.54, 5.13], sepalwidth_(2.72, 2.96])", 0.0, 0.1, 0.08], [0.06, "(sepalwidth_(2.96, 3.2], petalwidth_(1.78, 2.02])", 0.0, 0.02, 0.16], [0.053333, "(petalwidth_(0.34, 0.58], variety_Setosa)", 0.16, 0.0, 0.0], [0.053333, "(petalwidth_(1.3, 1.54], petallength_(3.95, 4.54])", 0.0, 0.16, 0.0], [0.053333, "(petallength_(1.59, 2.18], petalwidth_(0.0976, 0.34], variety_Setosa)", 0.16, 0.0, 0.0], [0.053333, "(sepalwidth_(3.2, 3.44], petalwidth_(0.0976, 0.34], variety_Setosa)", 0.16, 0.0, 0.0], [0.053333, "(variety_Versicolor, petallength_(3.36, 3.95])", 0.0, 0.16, 0.0], [0.053333, "(sepalwidth_(2.96, 3.2], sepallength_(6.46, 6.82], variety_Virginica)", 0.0, 0.0, 0.16], [0.053333, "(petallength_(4.54, 5.13], variety_Versicolor, petalwidth_(1.3, 1.54])", 0.0, 0.16, 0.0], [0.053333, "(sepallength_(5.74, 6.1], variety_Virginica)", 0.0, 0.0, 0.16], [0.053333, "(sepalwidth_(2.96, 3.2], variety_Virginica, petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.16], [0.053333, "(variety_Versicolor, petalwidth_(1.3, 1.54], petallength_(3.95, 4.54])", 0.0, 0.16, 0.0], [0.053333, "(sepallength_(5.02, 5.38], petalwidth_(0.0976, 0.34], petallength_(0.994, 1.59])", 0.16, 0.0, 0.0], [0.053333, "(petalwidth_(0.34, 0.58])", 0.16, 0.0, 0.0], [0.053333, "(sepalwidth_(3.2, 3.44], petalwidth_(0.0976, 0.34])", 0.16, 0.0, 0.0], [0.053333, "(sepalwidth_(3.44, 3.68], petalwidth_(0.0976, 0.34])", 0.16, 0.0, 0.0], [0.053333, "(petallength_(1.59, 2.18], petalwidth_(0.0976, 0.34])", 0.16, 0.0, 0.0], [0.053333, "(sepallength_(6.1, 6.46], petallength_(5.13, 5.72])", 0.0, 0.0, 0.16], [0.053333, "(sepalwidth_(2.96, 3.2], variety_Versicolor, petallength_(3.95, 4.54])", 0.0, 0.16, 0.0], [0.053333, "(sepalwidth_(3.44, 3.68], variety_Setosa, petallength_(0.994, 1.59])", 0.16, 0.0, 0.0], [0.053333, "(sepalwidth_(3.44, 3.68], petallength_(0.994, 1.59])", 0.16, 0.0, 0.0], [0.053333, "(petallength_(3.36, 3.95])", 0.0, 0.16, 0.0], [0.053333, "(sepallength_(6.1, 6.46], petallength_(5.13, 5.72], variety_Virginica)", 0.0, 0.0, 0.16], [0.053333, "(sepalwidth_(2.96, 3.2], petallength_(3.95, 4.54])", 0.0, 0.16, 0.0], [0.053333, "(sepalwidth_(3.44, 3.68], variety_Setosa, petalwidth_(0.0976, 0.34])", 0.16, 0.0, 0.0], [0.053333, "(sepalwidth_(3.44, 3.68], petallength_(0.994, 1.59], petalwidth_(0.0976, 0.34])", 0.16, 0.0, 0.0], [0.046667, "(sepalwidth_(2.96, 3.2], petallength_(0.994, 1.59], sepallength_(4.66, 5.02])", 0.14, 0.0, 0.0], [0.046667, "(variety_Virginica, sepalwidth_(2.48, 2.72], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.14], [0.046667, "(sepalwidth_(2.24, 2.48])", 0.02, 0.12, 0.0], [0.046667, "(petalwidth_(0.82, 1.06])", 0.0, 0.14, 0.0], [0.046667, "(variety_Versicolor, petallength_(3.95, 4.54], sepalwidth_(2.72, 2.96])", 0.0, 0.14, 0.0], [0.046667, "(sepallength_(5.74, 6.1], petallength_(3.95, 4.54])", 0.0, 0.14, 0.0], [0.046667, "(petallength_(3.95, 4.54], sepalwidth_(2.72, 2.96])", 0.0, 0.14, 0.0], [0.046667, "(sepallength_(6.46, 6.82], petallength_(5.13, 5.72])", 0.0, 0.0, 0.14], [0.046667, "(petallength_(4.54, 5.13], sepalwidth_(2.48, 2.72])", 0.0, 0.04, 0.1], [0.046667, "(sepallength_(6.1, 6.46], variety_Versicolor)", 0.0, 0.14, 0.0], [0.046667, "(petallength_(1.59, 2.18], sepallength_(4.66, 5.02])", 0.14, 0.0, 0.0], [0.046667, "(variety_Versicolor, petalwidth_(0.82, 1.06])", 0.0, 0.14, 0.0], [0.046667, "(sepalwidth_(2.96, 3.2], petalwidth_(2.26, 2.5], variety_Virginica)", 0.0, 0.0, 0.14], [0.046667, "(sepallength_(5.74, 6.1], variety_Virginica, petallength_(4.54, 5.13])", 0.0, 0.0, 0.14], [0.046667, "(sepallength_(6.46, 6.82], petallength_(5.13, 5.72], variety_Virginica)", 0.0, 0.0, 0.14], [0.046667, "(petalwidth_(1.06, 1.3], sepalwidth_(2.48, 2.72])", 0.0, 0.14, 0.0], [0.046667, "(petallength_(1.59, 2.18], variety_Setosa, sepallength_(4.66, 5.02])", 0.14, 0.0, 0.0], [0.046667, "(variety_Versicolor, petalwidth_(1.06, 1.3], sepalwidth_(2.48, 2.72])", 0.0, 0.14, 0.0], [0.046667, "(sepallength_(6.46, 6.82], variety_Versicolor)", 0.0, 0.14, 0.0], [0.046667, "(petallength_(5.13, 5.72], petalwidth_(2.26, 2.5], variety_Virginica)", 0.0, 0.0, 0.14], [0.046667, "(petallength_(5.13, 5.72], petalwidth_(2.26, 2.5])", 0.0, 0.0, 0.14], [0.046667, "(sepallength_(5.74, 6.1], variety_Versicolor, petallength_(3.95, 4.54])", 0.0, 0.14, 0.0], [0.046667, "(sepalwidth_(2.48, 2.72], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.14], [0.046667, "(sepalwidth_(2.96, 3.2], petalwidth_(2.26, 2.5])", 0.0, 0.0, 0.14], [0.046667, "(sepallength_(5.74, 6.1], sepalwidth_(2.48, 2.72])", 0.0, 0.08, 0.06], [0.046667, "(sepallength_(6.1, 6.46], sepalwidth_(2.72, 2.96])", 0.0, 0.04, 0.1], [0.04, "(sepalwidth_(3.2, 3.44], petallength_(0.994, 1.59])", 0.12, 0.0, 0.0], [0.04, "(sepalwidth_(3.2, 3.44], variety_Setosa, petallength_(0.994, 1.59])", 0.12, 0.0, 0.0], [0.04, "(sepalwidth_(2.72, 2.96], petallength_(3.95, 4.54], petalwidth_(1.06, 1.3])", 0.0, 0.12, 0.0], [0.04, "(sepalwidth_(2.96, 3.2], petallength_(4.54, 5.13], variety_Versicolor)", 0.0, 0.12, 0.0], [0.04, "(sepalwidth_(2.96, 3.2], sepallength_(6.82, 7.18])", 0.0, 0.04, 0.08], [0.04, "(sepallength_(5.74, 6.1], petalwidth_(1.3, 1.54])", 0.0, 0.08, 0.04], [0.04, "(sepallength_(6.46, 6.82], petallength_(4.54, 5.13])", 0.0, 0.1, 0.02], [0.04, "(sepalwidth_(2.96, 3.2], sepallength_(5.74, 6.1])", 0.0, 0.06, 0.06], [0.04, "(sepallength_(5.74, 6.1], petalwidth_(1.78, 2.02])", 0.0, 0.02, 0.1], [0.04, "(petallength_(4.54, 5.13], sepallength_(5.74, 6.1], petalwidth_(1.78, 2.02])", 0.0, 0.02, 0.1], [0.04, "(sepallength_(6.1, 6.46], variety_Virginica, petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.12], [0.04, "(sepallength_(6.1, 6.46], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.12], [0.04, "(sepallength_(6.1, 6.46], petallength_(4.54, 5.13])", 0.0, 0.04, 0.08], [0.04, "(petallength_(3.95, 4.54], sepalwidth_(2.48, 2.72])", 0.0, 0.1, 0.02], [0.04, "(variety_Versicolor, sepalwidth_(2.24, 2.48])", 0.0, 0.12, 0.0], [0.04, "(sepalwidth_(2.96, 3.2], petalwidth_(1.3, 1.54], petallength_(3.95, 4.54])", 0.0, 0.12, 0.0], [0.04, "(sepallength_(5.38, 5.74], sepalwidth_(2.48, 2.72])", 0.0, 0.1, 0.02], [0.04, "(sepalwidth_(2.72, 2.96], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.12], [0.04, "(sepallength_(6.82, 7.18])", 0.0, 0.04, 0.08], [0.04, "(petalwidth_(1.54, 1.78])", 0.0, 0.08, 0.04], [0.04, "(sepallength_(7.54, 7.9])", 0.0, 0.0, 0.12], [0.04, "(variety_Virginica, sepallength_(7.54, 7.9])", 0.0, 0.0, 0.12], [0.04, "(sepallength_(5.38, 5.74], petallength_(0.994, 1.59])", 0.12, 0.0, 0.0], [0.04, "(sepallength_(5.38, 5.74], variety_Setosa, petallength_(0.994, 1.59])", 0.12, 0.0, 0.0], [0.04, "(sepalwidth_(2.96, 3.2], petallength_(5.72, 6.31], variety_Virginica)", 0.0, 0.0, 0.12], [0.04, "(sepalwidth_(2.72, 2.96], variety_Virginica, petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.12], [0.04, "(sepalwidth_(2.96, 3.2], petallength_(5.72, 6.31])", 0.0, 0.0, 0.12], [0.033333, "(sepalwidth_(3.2, 3.44], variety_Virginica)", 0.0, 0.0, 0.1], [0.033333, "(petallength_(1.59, 2.18], petalwidth_(0.0976, 0.34], sepallength_(4.66, 5.02])", 0.1, 0.0, 0.0], [0.033333, "(sepalwidth_(2.96, 3.2], sepallength_(4.296, 4.66])", 0.1, 0.0, 0.0], [0.033333, "(sepalwidth_(2.96, 3.2], sepallength_(4.296, 4.66], petallength_(0.994, 1.59])", 0.1, 0.0, 0.0], [0.033333, "(sepallength_(6.1, 6.46], petallength_(3.95, 4.54])", 0.0, 0.1, 0.0], [0.033333, "(sepalwidth_(2.96, 3.2], sepallength_(4.296, 4.66], petalwidth_(0.0976, 0.34])", 0.1, 0.0, 0.0], [0.033333, "(sepalwidth_(2.96, 3.2], sepallength_(4.296, 4.66], variety_Setosa)", 0.1, 0.0, 0.0], [0.033333, "(sepallength_(5.38, 5.74], petalwidth_(0.0976, 0.34])", 0.1, 0.0, 0.0], [0.033333, "(sepalwidth_(2.96, 3.2], petalwidth_(2.02, 2.26], variety_Virginica)", 0.0, 0.0, 0.1], [0.033333, "(sepallength_(6.1, 6.46], variety_Versicolor, petallength_(3.95, 4.54])", 0.0, 0.1, 0.0], [0.033333, "(sepallength_(6.1, 6.46], sepalwidth_(2.72, 2.96], variety_Virginica)", 0.0, 0.0, 0.1], [0.033333, "(petallength_(5.13, 5.72], petalwidth_(2.02, 2.26])", 0.0, 0.0, 0.1], [0.033333, "(sepalwidth_(2.96, 3.2], petalwidth_(2.02, 2.26])", 0.0, 0.0, 0.1], [0.033333, "(sepallength_(5.38, 5.74], petalwidth_(0.0976, 0.34], variety_Setosa)", 0.1, 0.0, 0.0], [0.033333, "(sepalwidth_(3.2, 3.44], petalwidth_(0.0976, 0.34], petallength_(0.994, 1.59])", 0.1, 0.0, 0.0], [0.033333, "(sepalwidth_(3.2, 3.44], petallength_(1.59, 2.18])", 0.1, 0.0, 0.0], [0.033333, "(sepallength_(5.74, 6.1], variety_Virginica, petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.1], [0.033333, "(petallength_(5.13, 5.72], petalwidth_(2.02, 2.26], variety_Virginica)", 0.0, 0.0, 0.1], [0.033333, "(petallength_(5.13, 5.72], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.1], [0.033333, "(petallength_(5.13, 5.72], variety_Virginica, petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.1], [0.033333, "(sepallength_(7.54, 7.9], variety_Virginica, petallength_(6.31, 6.9])", 0.0, 0.0, 0.1], [0.033333, "(petallength_(5.72, 6.31], variety_Virginica, sepallength_(7.18, 7.54])", 0.0, 0.0, 0.1], [0.033333, "(variety_Virginica, sepallength_(7.18, 7.54])", 0.0, 0.0, 0.1], [0.033333, "(sepallength_(5.38, 5.74], variety_Versicolor, sepalwidth_(2.48, 2.72])", 0.0, 0.1, 0.0], [0.033333, "(petalwidth_(1.3, 1.54], sepalwidth_(2.72, 2.96])", 0.0, 0.08, 0.02], [0.033333, "(petallength_(4.54, 5.13], sepalwidth_(2.48, 2.72], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.1], [0.033333, "(petallength_(5.72, 6.31], sepallength_(7.18, 7.54])", 0.0, 0.0, 0.1], [0.033333, "(sepalwidth_(3.2, 3.44], sepallength_(4.66, 5.02])", 0.1, 0.0, 0.0], [0.033333, "(sepallength_(6.46, 6.82], petallength_(5.13, 5.72], sepalwidth_(2.96, 3.2])", 0.0, 0.0, 0.1], [0.033333, "(petallength_(6.31, 6.9])", 0.0, 0.0, 0.1], [0.033333, "(sepalwidth_(2.96, 3.2], petallength_(4.54, 5.13], variety_Virginica)", 0.0, 0.0, 0.1], [0.033333, "(sepallength_(7.18, 7.54])", 0.0, 0.0, 0.1], [0.033333, "(variety_Virginica, petallength_(6.31, 6.9])", 0.0, 0.0, 0.1], [0.033333, "(petallength_(6.31, 6.9], sepallength_(7.54, 7.9])", 0.0, 0.0, 0.1], [0.033333, "(petallength_(4.54, 5.13], variety_Virginica, sepalwidth_(2.48, 2.72])", 0.0, 0.0, 0.1], [0.033333, "(variety_Versicolor, petallength_(3.95, 4.54], sepalwidth_(2.48, 2.72])", 0.0, 0.1, 0.0], [0.033333, "(petallength_(0.994, 1.59], sepalwidth_(3.68, 3.92])", 0.1, 0.0, 0.0], [0.033333, "(sepallength_(5.74, 6.1], sepalwidth_(2.72, 2.96])", 0.0, 0.08, 0.02], [0.033333, "(variety_Setosa, petallength_(0.994, 1.59], sepalwidth_(3.68, 3.92])", 0.1, 0.0, 0.0], [0.033333, "(petallength_(4.54, 5.13], variety_Versicolor, sepalwidth_(2.72, 2.96])", 0.0, 0.1, 0.0], [0.033333, "(petalwidth_(0.0976, 0.34], variety_Setosa, sepalwidth_(3.68, 3.92])", 0.1, 0.0, 0.0], [0.033333, "(sepallength_(5.38, 5.74], sepalwidth_(2.72, 2.96])", 0.0, 0.08, 0.02], [0.033333, "(sepallength_(5.02, 5.38], variety_Setosa, sepalwidth_(3.68, 3.92])", 0.1, 0.0, 0.0], [0.033333, "(sepalwidth_(2.96, 3.2], petallength_(4.54, 5.13], petalwidth_(1.78, 2.02])", 0.0, 0.02, 0.08], [0.033333, "(sepallength_(5.38, 5.74], variety_Versicolor, petallength_(3.36, 3.95])", 0.0, 0.1, 0.0], [0.033333, "(sepalwidth_(2.96, 3.2], petallength_(4.54, 5.13], sepallength_(5.74, 6.1])", 0.0, 0.04, 0.06], [0.033333, "(petalwidth_(0.0976, 0.34], sepalwidth_(3.68, 3.92])", 0.1, 0.0, 0.0], [0.033333, "(sepallength_(5.38, 5.74], petallength_(3.36, 3.95])", 0.0, 0.1, 0.0], [0.033333, "(sepallength_(5.02, 5.38], sepalwidth_(3.68, 3.92])", 0.1, 0.0, 0.0], [0.033333, "(petallength_(4.54, 5.13], variety_Versicolor, sepallength_(5.74, 6.1])", 0.0, 0.1, 0.0], [0.033333, "(sepallength_(6.46, 6.82], petallength_(4.54, 5.13], variety_Versicolor)", 0.0, 0.1, 0.0], [0.033333, "(sepalwidth_(3.2, 3.44], petallength_(1.59, 2.18], variety_Setosa)", 0.1, 0.0, 0.0], [0.033333, "(sepallength_(6.46, 6.82], petalwidth_(1.3, 1.54])", 0.0, 0.1, 0.0], [0.033333, "(sepallength_(6.46, 6.82], variety_Versicolor, petalwidth_(1.3, 1.54])", 0.0, 0.1, 0.0], [0.033333, "(sepalwidth_(3.2, 3.44], variety_Setosa, sepallength_(4.66, 5.02])", 0.1, 0.0, 0.0], [0.026667, "(sepalwidth_(3.2, 3.44], petallength_(5.13, 5.72], variety_Virginica)", 0.0, 0.0, 0.08], [0.026667, "(petalwidth_(2.26, 2.5], petallength_(5.72, 6.31])", 0.0, 0.0, 0.08], [0.026667, "(variety_Versicolor, petalwidth_(1.06, 1.3], petallength_(3.36, 3.95])", 0.0, 0.08, 0.0], [0.026667, "(petallength_(3.36, 3.95], variety_Versicolor, sepalwidth_(2.48, 2.72])", 0.0, 0.08, 0.0], [0.026667, "(sepallength_(6.46, 6.82], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.08], [0.026667, "(sepalwidth_(2.96, 3.2], sepallength_(6.46, 6.82], variety_Versicolor)", 0.0, 0.08, 0.0], [0.026667, "(sepallength_(5.74, 6.1], variety_Versicolor, petalwidth_(1.3, 1.54])", 0.0, 0.08, 0.0], [0.026667, "(variety_Versicolor, sepalwidth_(2.72, 2.96], petalwidth_(1.3, 1.54])", 0.0, 0.08, 0.0], [0.026667, "(petallength_(4.54, 5.13], petalwidth_(1.3, 1.54], sepalwidth_(2.72, 2.96])", 0.0, 0.06, 0.02], [0.026667, "(sepalwidth_(2.96, 3.2], sepallength_(6.82, 7.18], variety_Virginica)", 0.0, 0.0, 0.08], [0.026667, "(sepalwidth_(2.96, 3.2], sepallength_(5.38, 5.74], petallength_(3.95, 4.54])", 0.0, 0.08, 0.0], [0.026667, "(sepalwidth_(3.2, 3.44], petallength_(5.13, 5.72])", 0.0, 0.0, 0.08], [0.026667, "(petallength_(3.36, 3.95], sepalwidth_(2.48, 2.72])", 0.0, 0.08, 0.0], [0.026667, "(petallength_(5.72, 6.31], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.08], [0.026667, "(sepallength_(5.38, 5.74], sepalwidth_(2.72, 2.96], petalwidth_(1.06, 1.3])", 0.0, 0.08, 0.0], [0.026667, "(sepallength_(6.46, 6.82], petalwidth_(2.26, 2.5], variety_Virginica)", 0.0, 0.0, 0.08], [0.026667, "(petalwidth_(2.26, 2.5], petallength_(5.72, 6.31], variety_Virginica)", 0.0, 0.0, 0.08], [0.026667, "(sepallength_(5.74, 6.1], petalwidth_(1.06, 1.3])", 0.0, 0.08, 0.0], [0.026667, "(petallength_(5.72, 6.31], variety_Virginica, petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.08], [0.026667, "(sepallength_(5.38, 5.74], petalwidth_(1.06, 1.3], sepalwidth_(2.48, 2.72])", 0.0, 0.08, 0.0], [0.026667, "(sepallength_(6.46, 6.82], variety_Virginica, petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.08], [0.026667, "(petallength_(3.95, 4.54], petalwidth_(1.06, 1.3], sepalwidth_(2.48, 2.72])", 0.0, 0.08, 0.0], [0.026667, "(sepallength_(5.74, 6.1], variety_Versicolor, petalwidth_(1.06, 1.3])", 0.0, 0.08, 0.0], [0.026667, "(sepallength_(6.1, 6.46], petallength_(4.54, 5.13], variety_Virginica)", 0.0, 0.0, 0.08], [0.026667, "(sepalwidth_(2.96, 3.2], petallength_(5.13, 5.72], petalwidth_(2.26, 2.5])", 0.0, 0.0, 0.08], [0.026667, "(sepallength_(6.1, 6.46], petalwidth_(2.26, 2.5], variety_Virginica)", 0.0, 0.0, 0.08], [0.026667, "(sepalwidth_(3.2, 3.44], petalwidth_(2.26, 2.5], variety_Virginica)", 0.0, 0.0, 0.08], [0.026667, "(variety_Versicolor, petalwidth_(1.54, 1.78])", 0.0, 0.08, 0.0], [0.026667, "(sepallength_(6.46, 6.82], petalwidth_(2.26, 2.5])", 0.0, 0.0, 0.08], [0.026667, "(sepallength_(6.1, 6.46], sepalwidth_(2.48, 2.72])", 0.0, 0.02, 0.06], [0.026667, "(sepallength_(6.1, 6.46], petalwidth_(2.26, 2.5])", 0.0, 0.0, 0.08], [0.026667, "(sepalwidth_(3.2, 3.44], petalwidth_(2.26, 2.5])", 0.0, 0.0, 0.08], [0.026667, "(petalwidth_(1.06, 1.3], petallength_(3.36, 3.95])", 0.0, 0.08, 0.0], [0.026667, "(sepallength_(6.82, 7.18], variety_Virginica)", 0.0, 0.0, 0.08], [0.026667, "(sepalwidth_(2.96, 3.2], petallength_(4.54, 5.13], petalwidth_(1.3, 1.54])", 0.0, 0.08, 0.0], [0.026667, "(sepalwidth_(2.96, 3.2], sepallength_(5.38, 5.74])", 0.0, 0.08, 0.0], [0.026667, "(sepallength_(5.38, 5.74], sepalwidth_(3.68, 3.92])", 0.08, 0.0, 0.0], [0.026667, "(petallength_(1.59, 2.18], sepalwidth_(3.68, 3.92])", 0.08, 0.0, 0.0], [0.026667, "(sepalwidth_(1.998, 2.24])", 0.0, 0.06, 0.02], [0.026667, "(sepalwidth_(2.96, 3.2], sepallength_(5.38, 5.74], variety_Versicolor)", 0.0, 0.08, 0.0], [0.026667, "(sepalwidth_(3.2, 3.44], sepallength_(6.1, 6.46])", 0.0, 0.02, 0.06], [0.026667, "(sepalwidth_(3.2, 3.44], petalwidth_(0.0976, 0.34], sepallength_(4.66, 5.02])", 0.08, 0.0, 0.0], [0.026667, "(petallength_(4.54, 5.13], sepalwidth_(2.72, 2.96], variety_Virginica)", 0.0, 0.0, 0.08], [0.026667, "(petalwidth_(0.34, 0.58], variety_Setosa, petallength_(0.994, 1.59])", 0.08, 0.0, 0.0], [0.026667, "(sepallength_(5.38, 5.74], variety_Versicolor, sepalwidth_(2.72, 2.96])", 0.0, 0.08, 0.0], [0.026667, "(sepalwidth_(3.44, 3.68], sepallength_(4.66, 5.02])", 0.08, 0.0, 0.0], [0.026667, "(petalwidth_(0.34, 0.58], sepalwidth_(3.68, 3.92])", 0.08, 0.0, 0.0], [0.026667, "(sepalwidth_(2.96, 3.2], sepallength_(5.74, 6.1], petalwidth_(1.78, 2.02])", 0.0, 0.02, 0.06], [0.026667, "(sepalwidth_(3.44, 3.68], variety_Setosa, sepallength_(4.66, 5.02])", 0.08, 0.0, 0.0], [0.026667, "(sepallength_(5.74, 6.1], variety_Versicolor, sepalwidth_(2.72, 2.96])", 0.0, 0.08, 0.0], [0.026667, "(petallength_(1.59, 2.18], variety_Setosa, sepalwidth_(3.68, 3.92])", 0.08, 0.0, 0.0], [0.026667, "(sepallength_(5.74, 6.1], variety_Versicolor, sepalwidth_(2.48, 2.72])", 0.0, 0.08, 0.0], [0.026667, "(sepallength_(6.1, 6.46], petalwidth_(1.3, 1.54])", 0.0, 0.06, 0.02], [0.026667, "(petalwidth_(0.34, 0.58], petallength_(1.59, 2.18], variety_Setosa)", 0.08, 0.0, 0.0], [0.026667, "(petalwidth_(0.34, 0.58], petallength_(0.994, 1.59])", 0.08, 0.0, 0.0], [0.026667, "(sepallength_(5.38, 5.74], variety_Setosa, sepalwidth_(3.68, 3.92])", 0.08, 0.0, 0.0], [0.026667, "(sepallength_(5.38, 5.74], petalwidth_(0.34, 0.58])", 0.08, 0.0, 0.0], [0.026667, "(petalwidth_(0.34, 0.58], petallength_(1.59, 2.18])", 0.08, 0.0, 0.0], [0.026667, "(petalwidth_(0.34, 0.58], variety_Setosa, sepalwidth_(3.68, 3.92])", 0.08, 0.0, 0.0], [0.026667, "(sepallength_(5.38, 5.74], petalwidth_(0.34, 0.58], variety_Setosa)", 0.08, 0.0, 0.0], [0.02, "(variety_Versicolor, sepalwidth_(1.998, 2.24])", 0.0, 0.06, 0.0], [0.02, "(petallength_(4.54, 5.13], petalwidth_(1.54, 1.78])", 0.0, 0.06, 0.0], [0.02, "(sepalwidth_(3.2, 3.44], petalwidth_(0.34, 0.58])", 0.06, 0.0, 0.0], [0.02, "(sepalwidth_(2.96, 3.2], sepallength_(6.46, 6.82], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.06], [0.02, "(sepallength_(5.38, 5.74], petalwidth_(0.0976, 0.34], petallength_(0.994, 1.59])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(6.46, 6.82], petalwidth_(2.02, 2.26])", 0.0, 0.0, 0.06], [0.02, "(sepallength_(6.46, 6.82], variety_Versicolor, sepalwidth_(2.72, 2.96])", 0.0, 0.06, 0.0], [0.02, "(sepallength_(6.46, 6.82], petallength_(4.54, 5.13], sepalwidth_(2.72, 2.96])", 0.0, 0.06, 0.0], [0.02, "(sepalwidth_(2.96, 3.2], sepallength_(6.46, 6.82], petalwidth_(1.3, 1.54])", 0.0, 0.06, 0.0], [0.02, "(sepallength_(6.46, 6.82], petallength_(4.54, 5.13], petalwidth_(1.3, 1.54])", 0.0, 0.06, 0.0], [0.02, "(sepallength_(5.02, 5.38], petalwidth_(0.34, 0.58])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(6.46, 6.82], petallength_(4.54, 5.13], sepalwidth_(2.96, 3.2])", 0.0, 0.04, 0.02], [0.02, "(sepalwidth_(3.2, 3.44], sepallength_(6.1, 6.46], variety_Virginica)", 0.0, 0.0, 0.06], [0.02, "(petallength_(4.54, 5.13], sepallength_(5.74, 6.1], sepalwidth_(2.72, 2.96])", 0.0, 0.04, 0.02], [0.02, "(petalwidth_(0.0976, 0.34], petallength_(0.994, 1.59], sepalwidth_(3.68, 3.92])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(6.46, 6.82], petallength_(5.72, 6.31], variety_Virginica)", 0.0, 0.0, 0.06], [0.02, "(sepallength_(5.02, 5.38], petallength_(0.994, 1.59], sepalwidth_(3.68, 3.92])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(5.38, 5.74], petallength_(3.95, 4.54], sepalwidth_(2.72, 2.96])", 0.0, 0.06, 0.0], [0.02, "(sepalwidth_(2.96, 3.2], sepallength_(5.74, 6.1], variety_Virginica)", 0.0, 0.0, 0.06], [0.02, "(sepallength_(5.38, 5.74], petalwidth_(1.06, 1.3], petallength_(3.36, 3.95])", 0.0, 0.06, 0.0], [0.02, "(variety_Versicolor, sepallength_(4.66, 5.02])", 0.0, 0.06, 0.0], [0.02, "(sepalwidth_(2.96, 3.2], sepallength_(5.74, 6.1], variety_Versicolor)", 0.0, 0.06, 0.0], [0.02, "(sepallength_(6.46, 6.82], sepalwidth_(2.72, 2.96])", 0.0, 0.06, 0.0], [0.02, "(sepallength_(5.38, 5.74], petallength_(1.59, 2.18])", 0.06, 0.0, 0.0], [0.02, "(petallength_(4.54, 5.13], variety_Versicolor, petalwidth_(1.54, 1.78])", 0.0, 0.06, 0.0], [0.02, "(petallength_(1.59, 2.18], petalwidth_(0.0976, 0.34], sepalwidth_(3.2, 3.44])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(5.38, 5.74], petalwidth_(0.34, 0.58], petallength_(0.994, 1.59])", 0.06, 0.0, 0.0], [0.02, "(sepalwidth_(3.2, 3.44], petalwidth_(0.34, 0.58], variety_Setosa)", 0.06, 0.0, 0.0], [0.02, "(sepallength_(6.1, 6.46], variety_Versicolor, petalwidth_(1.3, 1.54])", 0.0, 0.06, 0.0], [0.02, "(sepallength_(5.38, 5.74], petallength_(3.95, 4.54], sepalwidth_(2.48, 2.72])", 0.0, 0.06, 0.0], [0.02, "(sepalwidth_(2.96, 3.2], petallength_(1.59, 2.18], variety_Setosa)", 0.06, 0.0, 0.0], [0.02, "(sepalwidth_(3.2, 3.44], petallength_(5.13, 5.72], petalwidth_(2.26, 2.5])", 0.0, 0.0, 0.06], [0.02, "(petallength_(1.59, 2.18], petalwidth_(0.0976, 0.34], sepalwidth_(2.96, 3.2])", 0.06, 0.0, 0.0], [0.02, "(sepalwidth_(3.2, 3.44], sepallength_(6.1, 6.46], petalwidth_(2.26, 2.5])", 0.0, 0.0, 0.06], [0.02, "(sepallength_(6.1, 6.46], petallength_(5.13, 5.72], petalwidth_(2.26, 2.5])", 0.0, 0.0, 0.06], [0.02, "(variety_Versicolor, petallength_(2.77, 3.36])", 0.0, 0.06, 0.0], [0.02, "(sepalwidth_(2.96, 3.2], petallength_(1.59, 2.18], sepallength_(4.66, 5.02])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(5.02, 5.38], petallength_(1.59, 2.18], variety_Setosa)", 0.06, 0.0, 0.0], [0.02, "(sepalwidth_(3.2, 3.44], petallength_(1.59, 2.18], sepallength_(4.66, 5.02])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(5.02, 5.38], petalwidth_(0.34, 0.58], variety_Setosa)", 0.06, 0.0, 0.0], [0.02, "(sepalwidth_(2.96, 3.2], sepallength_(6.46, 6.82], petalwidth_(2.26, 2.5])", 0.0, 0.0, 0.06], [0.02, "(variety_Versicolor, petallength_(3.36, 3.95], petalwidth_(0.82, 1.06])", 0.0, 0.06, 0.0], [0.02, "(sepallength_(6.46, 6.82], petallength_(5.13, 5.72], petalwidth_(2.26, 2.5])", 0.0, 0.0, 0.06], [0.02, "(petallength_(4.54, 5.13], sepallength_(5.74, 6.1], sepalwidth_(2.48, 2.72])", 0.0, 0.02, 0.04], [0.02, "(variety_Versicolor, petalwidth_(0.82, 1.06], sepalwidth_(2.24, 2.48])", 0.0, 0.06, 0.0], [0.02, "(sepallength_(5.38, 5.74], petallength_(1.59, 2.18], variety_Setosa)", 0.06, 0.0, 0.0], [0.02, "(sepalwidth_(2.96, 3.2], petallength_(1.59, 2.18])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(6.46, 6.82], petallength_(5.72, 6.31])", 0.0, 0.0, 0.06], [0.02, "(petallength_(3.36, 3.95], petalwidth_(0.82, 1.06])", 0.0, 0.06, 0.0], [0.02, "(sepallength_(4.66, 5.02], petalwidth_(0.82, 1.06])", 0.0, 0.06, 0.0], [0.02, "(sepalwidth_(2.24, 2.48], petalwidth_(0.82, 1.06])", 0.0, 0.06, 0.0], [0.02, "(sepallength_(5.02, 5.38], petallength_(1.59, 2.18])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(4.66, 5.02], variety_Versicolor, petalwidth_(0.82, 1.06])", 0.0, 0.06, 0.0], [0.02, "(sepallength_(6.46, 6.82], petalwidth_(2.02, 2.26], variety_Virginica)", 0.0, 0.0, 0.06], [0.02, "(sepallength_(5.74, 6.1], variety_Virginica, sepalwidth_(2.48, 2.72])", 0.0, 0.0, 0.06], [0.02, "(sepallength_(5.38, 5.74], variety_Versicolor, sepalwidth_(2.24, 2.48])", 0.0, 0.06, 0.0], [0.02, "(sepalwidth_(2.96, 3.2], petallength_(5.13, 5.72], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.06], [0.02, "(sepallength_(6.1, 6.46], petallength_(4.54, 5.13], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.06], [0.02, "(sepallength_(6.1, 6.46], petallength_(5.13, 5.72], sepalwidth_(2.72, 2.96])", 0.0, 0.0, 0.06], [0.02, "(petallength_(5.13, 5.72], sepalwidth_(2.72, 2.96], variety_Virginica)", 0.0, 0.0, 0.06], [0.02, "(sepalwidth_(3.2, 3.44], sepallength_(5.02, 5.38], variety_Setosa)", 0.06, 0.0, 0.0], [0.02, "(sepallength_(6.1, 6.46], petalwidth_(1.06, 1.3])", 0.0, 0.06, 0.0], [0.02, "(sepalwidth_(2.24, 2.48], petalwidth_(1.06, 1.3])", 0.0, 0.06, 0.0], [0.02, "(sepallength_(5.38, 5.74], sepalwidth_(2.24, 2.48])", 0.0, 0.06, 0.0], [0.02, "(sepalwidth_(2.96, 3.2], sepallength_(6.1, 6.46])", 0.0, 0.02, 0.04], [0.02, "(sepalwidth_(3.2, 3.44], sepallength_(5.02, 5.38])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(6.1, 6.46], sepalwidth_(2.48, 2.72], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.06], [0.02, "(sepalwidth_(2.96, 3.2], petallength_(4.54, 5.13], sepallength_(6.82, 7.18])", 0.0, 0.04, 0.02], [0.02, "(sepallength_(6.82, 7.18], petallength_(4.54, 5.13])", 0.0, 0.04, 0.02], [0.02, "(petallength_(2.77, 3.36])", 0.0, 0.06, 0.0], [0.02, "(petalwidth_(1.78, 2.02], sepallength_(7.18, 7.54])", 0.0, 0.0, 0.06], [0.02, "(petallength_(4.54, 5.13], petalwidth_(1.3, 1.54], sepallength_(5.74, 6.1])", 0.0, 0.04, 0.02], [0.02, "(petalwidth_(1.78, 2.02], variety_Virginica, sepallength_(7.18, 7.54])", 0.0, 0.0, 0.06], [0.02, "(petalwidth_(1.3, 1.54], sepalwidth_(2.48, 2.72])", 0.0, 0.04, 0.02], [0.02, "(petallength_(5.72, 6.31], petalwidth_(1.78, 2.02], sepallength_(7.18, 7.54])", 0.0, 0.0, 0.06], [0.02, "(petalwidth_(1.3, 1.54], variety_Virginica)", 0.0, 0.0, 0.06], [0.02, "(sepallength_(6.1, 6.46], petallength_(4.54, 5.13], sepalwidth_(2.48, 2.72])", 0.0, 0.02, 0.04], [0.02, "(variety_Versicolor, petalwidth_(1.06, 1.3], sepalwidth_(2.24, 2.48])", 0.0, 0.06, 0.0], [0.02, "(sepallength_(5.02, 5.38], petalwidth_(0.0976, 0.34], sepalwidth_(3.68, 3.92])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(5.02, 5.38], sepalwidth_(3.44, 3.68])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(5.02, 5.38], sepalwidth_(3.44, 3.68], petalwidth_(0.0976, 0.34])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(5.02, 5.38], sepalwidth_(3.44, 3.68], petallength_(0.994, 1.59])", 0.06, 0.0, 0.0], [0.02, "(sepallength_(5.02, 5.38], sepalwidth_(3.44, 3.68], variety_Setosa)", 0.06, 0.0, 0.0], [0.02, "(sepalwidth_(3.44, 3.68], sepallength_(4.66, 5.02], petalwidth_(0.0976, 0.34])", 0.06, 0.0, 0.0], [0.02, "(sepalwidth_(3.44, 3.68], petallength_(0.994, 1.59], sepallength_(4.66, 5.02])", 0.06, 0.0, 0.0], [0.02, "(petallength_(5.13, 5.72], sepalwidth_(2.72, 2.96])", 0.0, 0.0, 0.06], [0.02, "(sepallength_(6.1, 6.46], variety_Virginica, sepalwidth_(2.48, 2.72])", 0.0, 0.0, 0.06], [0.02, "(sepallength_(6.1, 6.46], petallength_(5.13, 5.72], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.06], [0.02, "(sepallength_(6.1, 6.46], petallength_(3.95, 4.54], petalwidth_(1.06, 1.3])", 0.0, 0.06, 0.0], [0.02, "(sepallength_(6.1, 6.46], variety_Versicolor, petalwidth_(1.06, 1.3])", 0.0, 0.06, 0.0], [0.013333, "(sepallength_(6.1, 6.46], petallength_(5.13, 5.72], petalwidth_(2.02, 2.26])", 0.0, 0.0, 0.04], [0.013333, "(petallength_(1.59, 2.18], petalwidth_(0.0976, 0.34], sepalwidth_(3.68, 3.92])", 0.04, 0.0, 0.0], [0.013333, "(sepalwidth_(4.16, 4.4])", 0.04, 0.0, 0.0], [0.013333, "(petallength_(5.13, 5.72], sepalwidth_(2.48, 2.72])", 0.0, 0.0, 0.04], [0.013333, "(petallength_(6.31, 6.9], sepalwidth_(3.68, 3.92])", 0.0, 0.0, 0.04], [0.013333, "(petallength_(6.31, 6.9], petalwidth_(1.78, 2.02], sepallength_(7.54, 7.9])", 0.0, 0.0, 0.04], [0.013333, "(variety_Virginica, petalwidth_(1.78, 2.02], petallength_(6.31, 6.9])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(7.54, 7.9], petallength_(6.31, 6.9], sepalwidth_(3.68, 3.92])", 0.0, 0.0, 0.04], [0.013333, "(petalwidth_(1.78, 2.02], petallength_(6.31, 6.9])", 0.0, 0.0, 0.04], [0.013333, "(petallength_(4.54, 5.13], petalwidth_(2.26, 2.5])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(5.02, 5.38], petallength_(1.59, 2.18], sepalwidth_(3.68, 3.92])", 0.04, 0.0, 0.0], [0.013333, "(petallength_(6.31, 6.9], variety_Virginica, sepalwidth_(3.68, 3.92])", 0.0, 0.0, 0.04], [0.013333, "(petalwidth_(2.02, 2.26], petallength_(6.31, 6.9], sepallength_(7.54, 7.9])", 0.0, 0.0, 0.04], [0.013333, "(petalwidth_(2.02, 2.26], variety_Virginica, petallength_(6.31, 6.9])", 0.0, 0.0, 0.04], [0.013333, "(variety_Virginica, sepalwidth_(3.68, 3.92])", 0.0, 0.0, 0.04], [0.013333, "(petallength_(4.54, 5.13], sepalwidth_(2.72, 2.96], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(5.38, 5.74], variety_Virginica, petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(2.72, 2.96], variety_Virginica, sepallength_(7.18, 7.54])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(2.96, 3.2], variety_Virginica, sepallength_(7.18, 7.54])", 0.0, 0.0, 0.04], [0.013333, "(petallength_(5.72, 6.31], sepalwidth_(2.72, 2.96], sepallength_(7.18, 7.54])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(5.38, 5.74], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(5.38, 5.74], petallength_(0.994, 1.59], sepalwidth_(3.68, 3.92])", 0.04, 0.0, 0.0], [0.013333, "(sepallength_(5.38, 5.74], petalwidth_(0.0976, 0.34], sepalwidth_(3.68, 3.92])", 0.04, 0.0, 0.0], [0.013333, "(petallength_(5.13, 5.72], petalwidth_(2.02, 2.26], sepalwidth_(2.72, 2.96])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(2.72, 2.96], petalwidth_(1.78, 2.02], sepallength_(7.18, 7.54])", 0.0, 0.0, 0.04], [0.013333, "(petallength_(4.54, 5.13], petalwidth_(1.78, 2.02], sepallength_(5.38, 5.74])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(5.38, 5.74], petallength_(1.59, 2.18], sepalwidth_(3.68, 3.92])", 0.04, 0.0, 0.0], [0.013333, "(sepallength_(6.1, 6.46], petalwidth_(2.02, 2.26], sepalwidth_(2.72, 2.96])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(6.1, 6.46], petalwidth_(2.02, 2.26], variety_Virginica)", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(3.92, 4.16])", 0.04, 0.0, 0.0], [0.013333, "(sepalwidth_(2.96, 3.2], sepallength_(7.18, 7.54])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(2.72, 2.96], sepallength_(7.18, 7.54])", 0.0, 0.0, 0.04], [0.013333, "(petalwidth_(2.02, 2.26], petallength_(6.31, 6.9])", 0.0, 0.0, 0.04], [0.013333, "(petalwidth_(2.02, 2.26], sepalwidth_(2.72, 2.96])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(5.02, 5.38], sepalwidth_(2.48, 2.72])", 0.0, 0.04, 0.0], [0.013333, "(sepalwidth_(3.2, 3.44], sepallength_(5.02, 5.38], petallength_(0.994, 1.59])", 0.04, 0.0, 0.0], [0.013333, "(sepalwidth_(2.96, 3.2], petalwidth_(2.26, 2.5], petallength_(5.72, 6.31])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(5.38, 5.74], variety_Virginica, petallength_(4.54, 5.13])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(2.96, 3.2], petallength_(5.72, 6.31], petalwidth_(2.02, 2.26])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(2.96, 3.2], sepallength_(6.46, 6.82], petallength_(5.72, 6.31])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(6.1, 6.46], petallength_(5.13, 5.72], sepalwidth_(2.96, 3.2])", 0.0, 0.0, 0.04], [0.013333, "(petallength_(5.72, 6.31], sepalwidth_(2.72, 2.96], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(3.2, 3.44], sepallength_(5.02, 5.38], petalwidth_(0.0976, 0.34])", 0.04, 0.0, 0.0], [0.013333, "(sepallength_(5.02, 5.38], variety_Versicolor, sepalwidth_(2.48, 2.72])", 0.0, 0.04, 0.0], [0.013333, "(petallength_(4.54, 5.13], petalwidth_(2.26, 2.5], variety_Virginica)", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(2.72, 2.96], petallength_(5.72, 6.31], variety_Virginica)", 0.0, 0.0, 0.04], [0.013333, "(petallength_(5.13, 5.72], variety_Virginica, sepalwidth_(2.48, 2.72])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(5.38, 5.74], variety_Virginica)", 0.0, 0.0, 0.04], [0.013333, "(petallength_(5.72, 6.31], petalwidth_(2.02, 2.26])", 0.0, 0.0, 0.04], [0.013333, "(petallength_(4.54, 5.13], sepallength_(5.38, 5.74])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(6.46, 6.82], petallength_(5.13, 5.72], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(2.96, 3.2], petallength_(5.13, 5.72], petalwidth_(2.02, 2.26])", 0.0, 0.0, 0.04], [0.013333, "(petallength_(5.72, 6.31], petalwidth_(2.02, 2.26], variety_Virginica)", 0.0, 0.0, 0.04], [0.013333, "(petallength_(5.72, 6.31], sepalwidth_(2.72, 2.96])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(6.46, 6.82], petallength_(5.13, 5.72], sepalwidth_(3.2, 3.44])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(2.96, 3.2], sepallength_(6.46, 6.82], petalwidth_(2.02, 2.26])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(6.1, 6.46], petalwidth_(2.02, 2.26])", 0.0, 0.0, 0.04], [0.013333, "(petalwidth_(2.26, 2.5], variety_Virginica, sepallength_(7.54, 7.9])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(3.68, 3.92], variety_Virginica, sepallength_(7.54, 7.9])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(2.96, 3.2], variety_Virginica, sepallength_(7.54, 7.9])", 0.0, 0.0, 0.04], [0.013333, "(petalwidth_(2.02, 2.26], variety_Virginica, sepallength_(7.54, 7.9])", 0.0, 0.0, 0.04], [0.013333, "(petalwidth_(1.78, 2.02], sepallength_(7.54, 7.9])", 0.0, 0.0, 0.04], [0.013333, "(petalwidth_(2.26, 2.5], sepallength_(7.54, 7.9])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(3.68, 3.92], sepallength_(7.54, 7.9])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(2.96, 3.2], sepallength_(7.54, 7.9])", 0.0, 0.0, 0.04], [0.013333, "(petallength_(1.59, 2.18], sepallength_(5.38, 5.74], petalwidth_(0.0976, 0.34])", 0.04, 0.0, 0.0], [0.013333, "(petalwidth_(2.02, 2.26], sepallength_(7.54, 7.9])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(6.46, 6.82], petallength_(5.13, 5.72], petalwidth_(2.02, 2.26])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(2.72, 2.96], petalwidth_(2.02, 2.26], variety_Virginica)", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(5.02, 5.38], variety_Versicolor)", 0.0, 0.04, 0.0], [0.013333, "(sepallength_(6.1, 6.46], petallength_(5.13, 5.72], sepalwidth_(3.2, 3.44])", 0.0, 0.0, 0.04], [0.013333, "(variety_Virginica, petalwidth_(1.78, 2.02], sepallength_(7.54, 7.9])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(4.66, 5.02], petallength_(2.77, 3.36], petalwidth_(0.82, 1.06])", 0.0, 0.04, 0.0], [0.013333, "(variety_Versicolor, petallength_(3.95, 4.54], sepalwidth_(1.998, 2.24])", 0.0, 0.04, 0.0], [0.013333, "(sepalwidth_(2.96, 3.2], petallength_(5.13, 5.72], sepallength_(6.82, 7.18])", 0.0, 0.0, 0.04], [0.013333, "(variety_Versicolor, petallength_(3.95, 4.54], sepalwidth_(2.24, 2.48])", 0.0, 0.04, 0.0], [0.013333, "(sepalwidth_(2.24, 2.48], petallength_(3.95, 4.54], petalwidth_(1.06, 1.3])", 0.0, 0.04, 0.0], [0.013333, "(sepallength_(5.38, 5.74], sepalwidth_(2.24, 2.48], petalwidth_(1.06, 1.3])", 0.0, 0.04, 0.0], [0.013333, "(sepalwidth_(2.24, 2.48], petallength_(3.36, 3.95])", 0.0, 0.04, 0.0], [0.013333, "(sepalwidth_(2.24, 2.48], sepallength_(4.66, 5.02])", 0.0, 0.04, 0.0], [0.013333, "(sepalwidth_(2.24, 2.48], petallength_(3.95, 4.54])", 0.0, 0.04, 0.0], [0.013333, "(variety_Setosa, sepalwidth_(4.16, 4.4], petallength_(0.994, 1.59])", 0.04, 0.0, 0.0], [0.013333, "(sepallength_(5.38, 5.74], variety_Setosa, sepalwidth_(4.16, 4.4])", 0.04, 0.0, 0.0], [0.013333, "(sepallength_(6.1, 6.46], variety_Versicolor, sepalwidth_(2.72, 2.96])", 0.0, 0.04, 0.0], [0.013333, "(sepallength_(5.38, 5.74], sepalwidth_(4.16, 4.4], petallength_(0.994, 1.59])", 0.04, 0.0, 0.0], [0.013333, "(sepallength_(6.1, 6.46], petallength_(3.95, 4.54], sepalwidth_(2.72, 2.96])", 0.0, 0.04, 0.0], [0.013333, "(sepalwidth_(2.96, 3.2], sepallength_(6.1, 6.46], variety_Virginica)", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(6.1, 6.46], petallength_(4.54, 5.13], variety_Versicolor)", 0.0, 0.04, 0.0], [0.013333, "(variety_Setosa, sepalwidth_(4.16, 4.4])", 0.04, 0.0, 0.0], [0.013333, "(sepallength_(6.1, 6.46], petallength_(4.54, 5.13], sepalwidth_(2.72, 2.96])", 0.0, 0.0, 0.04], [0.013333, "(sepalwidth_(4.16, 4.4], petallength_(0.994, 1.59])", 0.04, 0.0, 0.0], [0.013333, "(sepallength_(6.1, 6.46], sepalwidth_(2.72, 2.96], petalwidth_(1.06, 1.3])", 0.0, 0.04, 0.0], [0.013333, "(sepallength_(5.38, 5.74], sepalwidth_(4.16, 4.4])", 0.04, 0.0, 0.0], [0.013333, "(sepallength_(6.1, 6.46], sepalwidth_(2.72, 2.96], petalwidth_(1.78, 2.02])", 0.0, 0.0, 0.04], [0.013333, "(petalwidth_(0.0976, 0.34], variety_Setosa, sepalwidth_(3.92, 4.16])", 0.04, 0.0, 0.0], [0.013333, "(variety_Setosa, sepalwidth_(3.92, 4.16], petallength_(0.994, 1.59])", 0.04, 0.0, 0.0], [0.013333, "(petalwidth_(0.0976, 0.34], sepalwidth_(3.92, 4.16], petallength_(0.994, 1.59])", 0.04, 0.0, 0.0], [0.013333, "(variety_Setosa, sepalwidth_(3.92, 4.16])", 0.04, 0.0, 0.0], [0.013333, "(petallength_(4.54, 5.13], petalwidth_(1.06, 1.3])", 0.0, 0.04, 0.0], [0.013333, "(petalwidth_(0.0976, 0.34], sepalwidth_(3.92, 4.16])", 0.04, 0.0, 0.0], [0.013333, "(sepalwidth_(3.92, 4.16], petallength_(0.994, 1.59])", 0.04, 0.0, 0.0], [0.013333, "(sepalwidth_(2.96, 3.2], petalwidth_(1.06, 1.3])", 0.0, 0.04, 0.0], [0.013333, "(variety_Versicolor, sepallength_(4.66, 5.02], sepalwidth_(2.24, 2.48])", 0.0, 0.04, 0.0], [0.013333, "(sepallength_(6.82, 7.18], petallength_(5.13, 5.72], variety_Virginica)", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(5.74, 6.1], petallength_(3.95, 4.54], sepalwidth_(2.72, 2.96])", 0.0, 0.04, 0.0], [0.013333, "(sepalwidth_(2.96, 3.2], petalwidth_(2.26, 2.5], sepallength_(6.82, 7.18])", 0.0, 0.0, 0.04], [0.013333, "(sepallength_(6.1, 6.46], petalwidth_(1.3, 1.54], petallength_(3.95, 4.54])", 0.0, 0.04, 0.0], [0.013333, "(sepallength_(6.1, 6.46], petallength_(4.54, 5.13], petalwidth_(1.3, 1.54])", 0.0, 0.02, 0.02], [0.013333, "(sepallength_(5.38, 5.74], petalwidth_(1.3, 1.54])", 0.0, 0.04, 0.0], [0.013333, "(sepallength_(5.74, 6.1], petalwidth_(1.3, 1.54], sepalwidth_(2.72, 2.96])", 0.0, 0.04, 0.0], [0.013333, "(variety_Versicolor, sepalwidth_(2.48, 2.72], petalwidth_(1.3, 1.54])", 0.0, 0.04, 0.0], [0.013333, "(sepallength_(5.74, 6.1], petalwidth_(1.3, 1.54], petallength_(3.95, 4.54])", 0.0, 0.04, 0.0], [0.013333, "(sepalwidth_(2.96, 3.2], sepallength_(5.74, 6.1], petalwidth_(1.3, 1.54])", 0.0, 0.04, 0.0], [0.013333, "(sepallength_(5.38, 5.74], petalwidth_(1.3, 1.54], petallength_(3.95, 4.54])", 0.0, 0.04, 0.0]];

        // Define the dt_args
        let dt_args = {"layout": {"topStart": "pageLength", "topEnd": "search", "bottomStart": "info", "bottomEnd": "paging"}, "order": [], "warn_on_selected_rows_not_rendered": true};
        dt_args["data"] = data;

        
        new DataTable(table, dt_args);
    });
</script>
```

:::

::: {.cell-output .cell-output-display .cell-output-markdown}
## Associations
:::

::: {.cell-output .cell-output-display .cell-output-markdown}
Showing top 500 or fewer associations with the highest lift, support, and confidence.
:::

::: {.cell-output .cell-output-display}

```{=html}
<table id="itables_5ac64f32_c974_4e44_9267_5fd9dda39dba" class="display nowrap" data-quarto-disable-processing="true" style="table-layout:auto;width:auto;margin:auto;caption-side:bottom">
<thead>
    <tr style="text-align: right;">
      
      <th>antecedents</th>
      <th>consequents</th>
      <th>lift</th>
      <th>support</th>
      <th>confidence</th>
    </tr>
  </thead><tbody><tr>
<td style="vertical-align:middle; text-align:left">
<div style="float:left; margin-right: 10px;">
<a href=https://mwouts.github.io/itables/><svg class="main-svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
width="64" viewBox="0 0 500 400" style="font-family: 'Droid Sans', sans-serif;">
    <g style="fill:#d9d7fc">
        <path d="M100,400H500V357H100Z" />
        <path d="M100,300H400V257H100Z" />
        <path d="M0,200H400V157H0Z" />
        <path d="M100,100H500V57H100Z" />
        <path d="M100,350H500V307H100Z" />
        <path d="M100,250H400V207H100Z" />
        <path d="M0,150H400V107H0Z" />
        <path d="M100,50H500V7H100Z" />
    </g>
    <g style="fill:#1a1366;stroke:#1a1366;">
   <rect x="100" y="7" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="5s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="0" y="107" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="3.5s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="0;0;400"
      dur="3.5s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="207" width="300" height="43">
    <animate
      attributeName="width"
      values="0;300;0"
      dur="3s"
      repeatCount="indefinite" />
    <animate
      attributeName="x"
      values="100;100;400"
      dur="3s"
      repeatCount="indefinite" />
  </rect>
        <rect x="100" y="307" width="400" height="43">
    <animate
      attributeName="width"
      values="0;400;0"
      dur="4s"
      repeatCount="indefinite" />
      <animate
      attributeName="x"
      values="100;100;500"
      dur="4s"
      repeatCount="indefinite" />
  </rect>
        <g style="fill:transparent;stroke-width:8; stroke-linejoin:round" rx="5">
            <g transform="translate(45 50) rotate(-45)">
                <circle r="33" cx="0" cy="0" />
                <rect x="-8" y="32" width="16" height="30" />
            </g>

            <g transform="translate(450 152)">
                <polyline points="-15,-20 -35,-20 -35,40 25,40 25,20" />
                <rect x="-15" y="-40" width="60" height="60" />
            </g>

            <g transform="translate(50 352)">
                <polygon points="-35,-5 0,-40 35,-5" />
                <polygon points="-35,10 0,45 35,10" />
            </g>

            <g transform="translate(75 250)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>

            <g transform="translate(425 250) rotate(180)">
                <polyline points="-30,30 -60,0 -30,-30" />
                <polyline points="0,30 -30,0 0,-30" />
            </g>
        </g>
    </g>
</svg>
</a>
</div>
<div>
Loading ITables v2.2.2 from the internet...
(need <a href=https://mwouts.github.io/itables/troubleshooting.html>help</a>?)</td>
</div>
</tr></tbody>

</table>
<link href="https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.css" rel="stylesheet">
<script type="module">
    import {DataTable, jQuery as $} from 'https://www.unpkg.com/dt_for_itables@2.0.13/dt_bundle.js';

    document.querySelectorAll("#itables_5ac64f32_c974_4e44_9267_5fd9dda39dba:not(.dataTable)").forEach(table => {
        if (!(table instanceof HTMLTableElement))
            return;

        // Define the table data
        const data = [["(sepalwidth_(2.24, 2.48], sepallength_(4.66, 5.02])", "(petallength_(2.77, 3.36])", 50.0, 0.013333, 1.0], ["(petallength_(2.77, 3.36])", "(sepalwidth_(2.24, 2.48], sepallength_(4.66, 5.02])", 50.0, 0.013333, 0.666667], ["(variety_Versicolor, sepallength_(4.66, 5.02])", "(petallength_(2.77, 3.36])", 33.333333, 0.013333, 0.666667], ["(petallength_(2.77, 3.36])", "(variety_Versicolor, sepallength_(4.66, 5.02])", 33.333333, 0.013333, 0.666667], ["(sepalwidth_(2.24, 2.48], petalwidth_(0.82, 1.06])", "(petallength_(2.77, 3.36])", 33.333333, 0.013333, 0.666667], ["(petallength_(2.77, 3.36])", "(sepalwidth_(2.24, 2.48], petalwidth_(0.82, 1.06])", 33.333333, 0.013333, 0.666667], ["(petalwidth_(0.82, 1.06], sepallength_(4.66, 5.02])", "(petallength_(2.77, 3.36])", 33.333333, 0.013333, 0.666667], ["(petallength_(2.77, 3.36])", "(petalwidth_(0.82, 1.06], sepallength_(4.66, 5.02])", 33.333333, 0.013333, 0.666667], ["(petalwidth_(2.02, 2.26], sepallength_(7.54, 7.9])", "(petallength_(6.31, 6.9])", 30.0, 0.013333, 1.0], ["(variety_Virginica, sepalwidth_(3.68, 3.92])", "(petallength_(6.31, 6.9])", 30.0, 0.013333, 1.0], ["(sepalwidth_(3.68, 3.92], sepallength_(7.54, 7.9])", "(petallength_(6.31, 6.9])", 30.0, 0.013333, 1.0], ["(petalwidth_(1.78, 2.02], sepallength_(7.54, 7.9])", "(petallength_(6.31, 6.9])", 30.0, 0.013333, 1.0], ["(petallength_(5.72, 6.31], sepalwidth_(2.72, 2.96])", "(sepallength_(7.18, 7.54])", 30.0, 0.013333, 1.0], ["(petallength_(6.31, 6.9])", "(sepallength_(7.54, 7.9])", 25.0, 0.033333, 1.0], ["(variety_Virginica, petallength_(6.31, 6.9])", "(sepallength_(7.54, 7.9])", 25.0, 0.033333, 1.0], ["(petallength_(6.31, 6.9])", "(variety_Virginica, sepallength_(7.54, 7.9])", 25.0, 0.033333, 1.0], ["(sepalwidth_(4.16, 4.4])", "(sepallength_(5.38, 5.74], petallength_(0.994, 1.59])", 25.0, 0.013333, 1.0], ["(sepalwidth_(3.2, 3.44], variety_Versicolor)", "(petalwidth_(1.54, 1.78])", 25.0, 0.013333, 1.0], ["(variety_Virginica, sepalwidth_(3.68, 3.92])", "(sepallength_(7.54, 7.9])", 25.0, 0.013333, 1.0], ["(petalwidth_(2.02, 2.26], petallength_(6.31, 6.9])", "(sepallength_(7.54, 7.9])", 25.0, 0.013333, 1.0], ["(sepalwidth_(3.68, 3.92], petallength_(6.31, 6.9])", "(sepallength_(7.54, 7.9])", 25.0, 0.013333, 1.0], ["(petalwidth_(1.78, 2.02], petallength_(6.31, 6.9])", "(sepallength_(7.54, 7.9])", 25.0, 0.013333, 1.0], ["(sepallength_(7.54, 7.9])", "(petallength_(6.31, 6.9])", 25.0, 0.033333, 0.833333], ["(variety_Virginica, sepallength_(7.54, 7.9])", "(petallength_(6.31, 6.9])", 25.0, 0.033333, 0.833333], ["(sepallength_(7.54, 7.9])", "(variety_Virginica, petallength_(6.31, 6.9])", 25.0, 0.033333, 0.833333], ["(petallength_(5.72, 6.31], petalwidth_(1.78, 2.02])", "(sepallength_(7.18, 7.54])", 22.5, 0.02, 0.75], ["(sepallength_(7.18, 7.54])", "(petallength_(5.72, 6.31], petalwidth_(1.78, 2.02])", 22.5, 0.02, 0.6], ["(variety_Versicolor, sepallength_(4.66, 5.02])", "(petalwidth_(0.82, 1.06])", 21.428571, 0.02, 1.0], ["(sepalwidth_(2.24, 2.48], sepallength_(4.66, 5.02])", "(petalwidth_(0.82, 1.06])", 21.428571, 0.013333, 1.0], ["(sepalwidth_(2.24, 2.48], petallength_(2.77, 3.36])", "(petalwidth_(0.82, 1.06])", 21.428571, 0.013333, 1.0], ["(petallength_(2.77, 3.36], petalwidth_(0.82, 1.06])", "(sepalwidth_(2.24, 2.48])", 21.428571, 0.013333, 1.0], ["(petallength_(2.77, 3.36], sepallength_(4.66, 5.02])", "(petalwidth_(0.82, 1.06])", 21.428571, 0.013333, 1.0], ["(petallength_(2.77, 3.36], sepallength_(4.66, 5.02])", "(sepalwidth_(2.24, 2.48])", 21.428571, 0.013333, 1.0], ["(sepallength_(5.38, 5.74], petalwidth_(0.82, 1.06])", "(petallength_(3.36, 3.95])", 18.75, 0.013333, 1.0], ["(sepalwidth_(4.16, 4.4])", "(sepallength_(5.38, 5.74], variety_Setosa)", 16.666667, 0.013333, 1.0], ["(petallength_(2.77, 3.36])", "(variety_Versicolor, sepalwidth_(2.24, 2.48])", 16.666667, 0.013333, 0.666667], ["(variety_Versicolor, sepallength_(4.66, 5.02])", "(sepalwidth_(2.24, 2.48])", 14.285714, 0.013333, 0.666667], ["(petalwidth_(0.82, 1.06], sepallength_(4.66, 5.02])", "(sepalwidth_(2.24, 2.48])", 14.285714, 0.013333, 0.666667], ["(petallength_(2.77, 3.36])", "(petalwidth_(0.82, 1.06])", 14.285714, 0.013333, 0.666667], ["(petallength_(2.77, 3.36])", "(sepalwidth_(2.24, 2.48])", 14.285714, 0.013333, 0.666667], ["(variety_Versicolor, petallength_(2.77, 3.36])", "(petalwidth_(0.82, 1.06])", 14.285714, 0.013333, 0.666667], ["(petallength_(2.77, 3.36])", "(variety_Versicolor, petalwidth_(0.82, 1.06])", 14.285714, 0.013333, 0.666667], ["(variety_Versicolor, petallength_(2.77, 3.36])", "(sepalwidth_(2.24, 2.48])", 14.285714, 0.013333, 0.666667], ["(variety_Versicolor, sepalwidth_(1.998, 2.24])", "(petalwidth_(0.82, 1.06])", 14.285714, 0.013333, 0.666667], ["(sepallength_(7.18, 7.54])", "(petallength_(5.72, 6.31])", 13.636364, 0.033333, 1.0], ["(variety_Virginica, sepallength_(7.18, 7.54])", "(petallength_(5.72, 6.31])", 13.636364, 0.033333, 1.0], ["(sepallength_(7.18, 7.54])", "(petallength_(5.72, 6.31], variety_Virginica)", 13.636364, 0.033333, 1.0], ["(sepallength_(7.18, 7.54], petalwidth_(1.78, 2.02])", "(petallength_(5.72, 6.31])", 13.636364, 0.02, 1.0], ["(sepalwidth_(2.72, 2.96], sepallength_(7.18, 7.54])", "(petallength_(5.72, 6.31])", 13.636364, 0.013333, 1.0], ["(sepalwidth_(2.96, 3.2], sepallength_(7.18, 7.54])", "(petallength_(5.72, 6.31])", 13.636364, 0.013333, 1.0], ["(sepallength_(5.02, 5.38], petallength_(1.59, 2.18])", "(petalwidth_(0.34, 0.58])", 12.5, 0.013333, 0.666667], ["(sepallength_(5.38, 5.74], sepalwidth_(2.24, 2.48])", "(petallength_(3.36, 3.95])", 12.5, 0.013333, 0.666667], ["(petallength_(5.13, 5.72], sepalwidth_(2.72, 2.96])", "(petalwidth_(2.02, 2.26])", 11.111111, 0.013333, 0.666667], ["(variety_Versicolor, sepalwidth_(2.24, 2.48])", "(petalwidth_(0.82, 1.06])", 10.714286, 0.02, 0.5], ["(sepalwidth_(1.998, 2.24])", "(petalwidth_(0.82, 1.06])", 10.714286, 0.013333, 0.5], ["(sepalwidth_(1.998, 2.24])", "(variety_Versicolor, petalwidth_(0.82, 1.06])", 10.714286, 0.013333, 0.5], ["(sepallength_(5.38, 5.74], petallength_(0.994, 1.59])", "(petalwidth_(0.34, 0.58])", 9.375, 0.02, 0.5], ["(petallength_(1.59, 2.18], sepalwidth_(3.68, 3.92])", "(petalwidth_(0.34, 0.58])", 9.375, 0.013333, 0.5], ["(sepallength_(5.38, 5.74], sepalwidth_(3.68, 3.92])", "(petalwidth_(0.34, 0.58])", 9.375, 0.013333, 0.5], ["(sepallength_(5.02, 5.38], petallength_(1.59, 2.18])", "(sepalwidth_(3.68, 3.92])", 9.090909, 0.013333, 0.666667], ["(sepallength_(5.38, 5.74], petallength_(1.59, 2.18])", "(sepalwidth_(3.68, 3.92])", 9.090909, 0.013333, 0.666667], ["(sepallength_(5.02, 5.38], petalwidth_(0.34, 0.58])", "(sepalwidth_(3.68, 3.92])", 9.090909, 0.013333, 0.666667], ["(sepalwidth_(3.2, 3.44], variety_Virginica)", "(petalwidth_(2.26, 2.5])", 8.571429, 0.026667, 0.8], ["(petalwidth_(0.34, 0.58])", "(variety_Setosa, sepalwidth_(3.68, 3.92])", 8.333333, 0.026667, 0.5], ["(petalwidth_(0.34, 0.58])", "(sepallength_(5.38, 5.74], variety_Setosa)", 8.333333, 0.026667, 0.5], ["(sepallength_(6.1, 6.46], petalwidth_(2.02, 2.26])", "(petallength_(5.13, 5.72])", 8.333333, 0.013333, 1.0], ["(petalwidth_(2.02, 2.26], sepalwidth_(2.72, 2.96])", "(petallength_(5.13, 5.72])", 8.333333, 0.013333, 1.0], ["(sepalwidth_(3.2, 3.44], sepallength_(6.46, 6.82])", "(petallength_(5.13, 5.72])", 8.333333, 0.013333, 1.0], ["(sepallength_(6.82, 7.18], variety_Virginica)", "(petalwidth_(2.02, 2.26])", 8.333333, 0.013333, 0.5], ["(sepalwidth_(3.2, 3.44], petallength_(5.13, 5.72])", "(petalwidth_(2.26, 2.5])", 8.035714, 0.02, 0.75], ["(sepalwidth_(3.2, 3.44], sepallength_(6.1, 6.46])", "(petalwidth_(2.26, 2.5])", 8.035714, 0.02, 0.75], ["(sepallength_(5.02, 5.38], petalwidth_(0.34, 0.58])", "(petallength_(1.59, 2.18])", 7.692308, 0.013333, 0.666667], ["(sepalwidth_(3.2, 3.44], petalwidth_(0.34, 0.58])", "(petallength_(1.59, 2.18])", 7.692308, 0.013333, 0.666667], ["(petallength_(5.13, 5.72], sepalwidth_(2.72, 2.96])", "(sepallength_(6.1, 6.46])", 7.5, 0.02, 1.0], ["(sepallength_(6.82, 7.18], variety_Versicolor)", "(petalwidth_(1.3, 1.54])", 7.5, 0.013333, 1.0], ["(sepallength_(6.46, 6.82], petallength_(3.95, 4.54])", "(petalwidth_(1.3, 1.54])", 7.5, 0.013333, 1.0], ["(petalwidth_(2.02, 2.26], sepalwidth_(2.72, 2.96])", "(sepallength_(6.1, 6.46])", 7.5, 0.013333, 1.0], ["(sepalwidth_(2.24, 2.48], petallength_(3.95, 4.54])", "(petalwidth_(1.06, 1.3])", 7.142857, 0.013333, 1.0], ["(sepallength_(4.296, 4.66])", "(sepalwidth_(2.96, 3.2], petallength_(0.994, 1.59])", 6.944444, 0.033333, 0.555556], ["(sepalwidth_(3.2, 3.44], sepallength_(4.66, 5.02])", "(petallength_(1.59, 2.18])", 6.923077, 0.02, 0.6], ["(petalwidth_(0.34, 0.58])", "(sepalwidth_(3.68, 3.92])", 6.818182, 0.026667, 0.5], ["(petalwidth_(0.34, 0.58], variety_Setosa)", "(sepalwidth_(3.68, 3.92])", 6.818182, 0.026667, 0.5], ["(sepallength_(6.82, 7.18])", "(sepalwidth_(2.96, 3.2], petallength_(4.54, 5.13])", 6.818182, 0.02, 0.5], ["(sepallength_(5.02, 5.38], variety_Versicolor)", "(sepalwidth_(2.48, 2.72])", 6.818182, 0.013333, 1.0], ["(petallength_(3.95, 4.54], petalwidth_(0.82, 1.06])", "(sepallength_(5.74, 6.1])", 6.818182, 0.013333, 1.0], ["(petalwidth_(0.34, 0.58], petallength_(0.994, 1.59])", "(sepalwidth_(3.68, 3.92])", 6.818182, 0.013333, 0.5], ["(petalwidth_(0.34, 0.58], petallength_(1.59, 2.18])", "(sepalwidth_(3.68, 3.92])", 6.818182, 0.013333, 0.5], ["(sepallength_(5.38, 5.74], petalwidth_(0.34, 0.58])", "(sepalwidth_(3.68, 3.92])", 6.818182, 0.013333, 0.5], ["(sepalwidth_(3.2, 3.44], variety_Virginica)", "(petallength_(5.13, 5.72])", 6.666667, 0.026667, 0.8], ["(sepalwidth_(2.96, 3.2], petallength_(1.59, 2.18])", "(sepallength_(4.66, 5.02])", 6.521739, 0.02, 1.0], ["(petallength_(2.77, 3.36], petalwidth_(0.82, 1.06])", "(sepallength_(4.66, 5.02])", 6.521739, 0.013333, 1.0], ["(sepalwidth_(2.24, 2.48], petallength_(2.77, 3.36])", "(sepallength_(4.66, 5.02])", 6.521739, 0.013333, 1.0], ["(petallength_(4.54, 5.13], sepallength_(5.38, 5.74])", "(petalwidth_(1.78, 2.02])", 6.521739, 0.013333, 1.0], ["(sepallength_(5.38, 5.74], variety_Virginica)", "(petalwidth_(1.78, 2.02])", 6.521739, 0.013333, 1.0], ["(petallength_(5.72, 6.31], sepalwidth_(2.72, 2.96])", "(petalwidth_(1.78, 2.02])", 6.521739, 0.013333, 1.0], ["(sepalwidth_(2.72, 2.96], sepallength_(7.18, 7.54])", "(petalwidth_(1.78, 2.02])", 6.521739, 0.013333, 1.0], ["(petallength_(0.994, 1.59], sepalwidth_(3.68, 3.92])", "(sepallength_(5.02, 5.38])", 6.428571, 0.02, 0.6], ["(petalwidth_(0.0976, 0.34], sepalwidth_(3.68, 3.92])", "(sepallength_(5.02, 5.38])", 6.428571, 0.02, 0.6], ["(petallength_(3.36, 3.95])", "(variety_Versicolor, sepalwidth_(2.48, 2.72])", 6.25, 0.026667, 0.5], ["(sepalwidth_(3.2, 3.44], petalwidth_(2.26, 2.5])", "(petallength_(5.13, 5.72])", 6.25, 0.02, 0.75], ["(sepallength_(6.1, 6.46], petalwidth_(2.26, 2.5])", "(sepalwidth_(3.2, 3.44])", 6.25, 0.02, 0.75], ["(sepallength_(6.1, 6.46], petalwidth_(2.26, 2.5])", "(petallength_(5.13, 5.72])", 6.25, 0.02, 0.75], ["(sepallength_(6.46, 6.82], petalwidth_(2.26, 2.5])", "(petallength_(5.13, 5.72])", 6.25, 0.02, 0.75], ["(petallength_(4.54, 5.13], petalwidth_(1.06, 1.3])", "(sepalwidth_(2.72, 2.96])", 6.25, 0.013333, 1.0], ["(sepallength_(6.1, 6.46], petalwidth_(2.02, 2.26])", "(sepalwidth_(2.72, 2.96])", 6.25, 0.013333, 1.0], ["(petallength_(3.95, 4.54], sepalwidth_(2.72, 2.96])", "(petalwidth_(1.06, 1.3])", 6.122449, 0.04, 0.857143], ["(variety_Setosa, sepalwidth_(3.68, 3.92])", "(sepallength_(5.02, 5.38])", 5.952381, 0.033333, 0.555556], ["(petallength_(3.36, 3.95])", "(sepallength_(5.38, 5.74], variety_Versicolor)", 5.859375, 0.033333, 0.625], ["(sepallength_(5.38, 5.74], petallength_(3.95, 4.54])", "(petalwidth_(1.06, 1.3])", 5.844156, 0.06, 0.818182], ["(sepalwidth_(2.96, 3.2], sepallength_(5.38, 5.74])", "(petallength_(3.95, 4.54])", 5.769231, 0.026667, 1.0], ["(petalwidth_(0.34, 0.58])", "(petallength_(1.59, 2.18])", 5.769231, 0.026667, 0.5], ["(petalwidth_(0.34, 0.58], variety_Setosa)", "(petallength_(1.59, 2.18])", 5.769231, 0.026667, 0.5], ["(petalwidth_(0.34, 0.58])", "(petallength_(1.59, 2.18], variety_Setosa)", 5.769231, 0.026667, 0.5], ["(sepallength_(6.1, 6.46], petalwidth_(1.06, 1.3])", "(petallength_(3.95, 4.54])", 5.769231, 0.02, 1.0], ["(sepallength_(5.38, 5.74], petalwidth_(1.3, 1.54])", "(petallength_(3.95, 4.54])", 5.769231, 0.013333, 1.0], ["(sepalwidth_(2.96, 3.2], petalwidth_(1.06, 1.3])", "(petallength_(3.95, 4.54])", 5.769231, 0.013333, 1.0], ["(sepallength_(5.74, 6.1], petalwidth_(0.82, 1.06])", "(petallength_(3.95, 4.54])", 5.769231, 0.013333, 1.0], ["(sepallength_(5.38, 5.74], sepalwidth_(3.68, 3.92])", "(petallength_(1.59, 2.18])", 5.769231, 0.013333, 0.5], ["(petalwidth_(0.34, 0.58], sepalwidth_(3.68, 3.92])", "(petallength_(1.59, 2.18])", 5.769231, 0.013333, 0.5], ["(sepallength_(5.38, 5.74], sepalwidth_(2.72, 2.96])", "(petalwidth_(1.06, 1.3])", 5.714286, 0.026667, 0.8], ["(sepalwidth_(2.96, 3.2], petallength_(3.95, 4.54])", "(petalwidth_(1.3, 1.54])", 5.625, 0.04, 0.75], ["(sepalwidth_(3.2, 3.44], petalwidth_(2.26, 2.5])", "(sepallength_(6.1, 6.46])", 5.625, 0.02, 0.75], ["(sepallength_(6.46, 6.82], petalwidth_(2.02, 2.26])", "(petallength_(5.13, 5.72])", 5.555556, 0.013333, 0.666667], ["(sepalwidth_(2.96, 3.2], sepallength_(6.1, 6.46])", "(petallength_(5.13, 5.72])", 5.555556, 0.013333, 0.666667], ["(sepallength_(4.296, 4.66])", "(sepalwidth_(2.96, 3.2], petalwidth_(0.0976, 0.34])", 5.555556, 0.033333, 0.555556], ["(sepallength_(4.296, 4.66])", "(sepalwidth_(2.96, 3.2], variety_Setosa)", 5.555556, 0.033333, 0.555556], ["(sepalwidth_(4.16, 4.4])", "(sepallength_(5.38, 5.74])", 5.555556, 0.013333, 1.0], ["(sepalwidth_(4.16, 4.4], petallength_(0.994, 1.59])", "(sepallength_(5.38, 5.74])", 5.555556, 0.013333, 1.0], ["(variety_Setosa, sepalwidth_(4.16, 4.4])", "(sepallength_(5.38, 5.74])", 5.555556, 0.013333, 1.0], ["(sepalwidth_(2.24, 2.48], petallength_(3.36, 3.95])", "(sepallength_(5.38, 5.74])", 5.555556, 0.013333, 1.0], ["(sepalwidth_(2.96, 3.2], petalwidth_(1.06, 1.3])", "(sepallength_(5.38, 5.74])", 5.555556, 0.013333, 1.0], ["(sepallength_(5.38, 5.74], variety_Versicolor)", "(petalwidth_(1.06, 1.3])", 5.357143, 0.08, 0.75], ["(petalwidth_(1.06, 1.3])", "(sepallength_(5.38, 5.74], variety_Versicolor)", 5.357143, 0.08, 0.571429], ["(sepalwidth_(2.96, 3.2], variety_Versicolor)", "(petalwidth_(1.3, 1.54])", 5.357143, 0.066667, 0.714286], ["(petalwidth_(1.3, 1.54])", "(sepalwidth_(2.96, 3.2], variety_Versicolor)", 5.357143, 0.066667, 0.5], ["(sepallength_(6.46, 6.82], variety_Versicolor)", "(petalwidth_(1.3, 1.54])", 5.357143, 0.033333, 0.714286], ["(petalwidth_(1.54, 1.78])", "(petallength_(4.54, 5.13], variety_Versicolor)", 5.357143, 0.02, 0.5], ["(petallength_(1.59, 2.18], sepalwidth_(3.68, 3.92])", "(sepallength_(5.02, 5.38])", 5.357143, 0.013333, 0.5], ["(petalwidth_(0.34, 0.58], sepalwidth_(3.68, 3.92])", "(sepallength_(5.02, 5.38])", 5.357143, 0.013333, 0.5], ["(petalwidth_(0.34, 0.58], petallength_(1.59, 2.18])", "(sepallength_(5.02, 5.38])", 5.357143, 0.013333, 0.5], ["(sepallength_(6.82, 7.18], variety_Virginica)", "(petalwidth_(2.26, 2.5])", 5.357143, 0.013333, 0.5], ["(sepallength_(6.46, 6.82], variety_Virginica)", "(petallength_(5.13, 5.72])", 5.30303, 0.046667, 0.636364], ["(sepallength_(5.74, 6.1], petalwidth_(1.78, 2.02])", "(petallength_(4.54, 5.13])", 5.172414, 0.04, 1.0], ["(sepallength_(6.46, 6.82], sepalwidth_(2.72, 2.96])", "(petallength_(4.54, 5.13])", 5.172414, 0.02, 1.0], ["(sepallength_(5.38, 5.74], variety_Virginica)", "(petallength_(4.54, 5.13])", 5.172414, 0.013333, 1.0], ["(sepallength_(6.82, 7.18], petalwidth_(1.3, 1.54])", "(petallength_(4.54, 5.13])", 5.172414, 0.013333, 1.0], ["(sepallength_(6.82, 7.18], variety_Versicolor)", "(petallength_(4.54, 5.13])", 5.172414, 0.013333, 1.0], ["(sepallength_(5.38, 5.74], petalwidth_(1.78, 2.02])", "(petallength_(4.54, 5.13])", 5.172414, 0.013333, 1.0], ["(sepallength_(6.1, 6.46], variety_Virginica)", "(petallength_(5.13, 5.72])", 5.128205, 0.053333, 0.615385], ["(sepallength_(6.82, 7.18], petallength_(4.54, 5.13])", "(petalwidth_(1.3, 1.54])", 5.0, 0.013333, 0.666667], ["(sepallength_(6.46, 6.82], sepalwidth_(2.72, 2.96])", "(petalwidth_(1.3, 1.54])", 5.0, 0.013333, 0.666667], ["(variety_Versicolor, sepalwidth_(2.72, 2.96])", "(petalwidth_(1.06, 1.3])", 4.945055, 0.06, 0.692308], ["(sepallength_(6.1, 6.46], sepalwidth_(2.48, 2.72])", "(petalwidth_(1.78, 2.02])", 4.891304, 0.02, 0.75], ["(petallength_(4.54, 5.13], variety_Virginica)", "(petalwidth_(1.78, 2.02])", 4.782609, 0.073333, 0.733333], ["(sepallength_(6.82, 7.18])", "(sepalwidth_(2.96, 3.2], variety_Virginica)", 4.761905, 0.026667, 0.666667], ["(sepallength_(5.38, 5.74], sepalwidth_(2.48, 2.72])", "(petalwidth_(1.06, 1.3])", 4.761905, 0.026667, 0.666667], ["(petallength_(3.95, 4.54], sepalwidth_(2.48, 2.72])", "(petalwidth_(1.06, 1.3])", 4.761905, 0.026667, 0.666667], ["(sepalwidth_(2.96, 3.2], petalwidth_(2.26, 2.5])", "(petallength_(5.13, 5.72])", 4.761905, 0.026667, 0.571429], ["(sepallength_(5.38, 5.74], sepalwidth_(2.24, 2.48])", "(petalwidth_(1.06, 1.3])", 4.761905, 0.013333, 0.666667], ["(petallength_(4.54, 5.13], sepalwidth_(2.48, 2.72])", "(petalwidth_(1.78, 2.02])", 4.658385, 0.033333, 0.714286], ["(petalwidth_(2.02, 2.26])", "(petallength_(5.13, 5.72])", 4.62963, 0.033333, 0.555556], ["(petalwidth_(2.02, 2.26], variety_Virginica)", "(petallength_(5.13, 5.72])", 4.62963, 0.033333, 0.555556], ["(petalwidth_(2.02, 2.26])", "(petallength_(5.13, 5.72], variety_Virginica)", 4.62963, 0.033333, 0.555556], ["(sepalwidth_(2.96, 3.2], petallength_(5.13, 5.72])", "(sepallength_(6.46, 6.82])", 4.62963, 0.033333, 0.555556], ["(variety_Virginica, sepalwidth_(2.48, 2.72])", "(petalwidth_(1.78, 2.02])", 4.565217, 0.046667, 0.7], ["(sepallength_(4.296, 4.66])", "(petalwidth_(0.0976, 0.34], petallength_(0.994, 1.59])", 4.545455, 0.06, 1.0], ["(sepalwidth_(3.92, 4.16])", "(petalwidth_(0.0976, 0.34], petallength_(0.994, 1.59])", 4.545455, 0.013333, 1.0], ["(petalwidth_(1.3, 1.54], variety_Virginica)", "(sepallength_(5.74, 6.1])", 4.545455, 0.013333, 0.666667], ["(sepallength_(5.74, 6.1], variety_Virginica)", "(petallength_(4.54, 5.13])", 4.525862, 0.046667, 0.875], ["(sepalwidth_(3.2, 3.44], variety_Virginica)", "(sepallength_(6.1, 6.46])", 4.5, 0.02, 0.6], ["(petallength_(5.13, 5.72], petalwidth_(1.78, 2.02])", "(sepallength_(6.1, 6.46])", 4.5, 0.02, 0.6], ["(sepalwidth_(2.96, 3.2], sepallength_(5.74, 6.1])", "(petalwidth_(1.78, 2.02])", 4.347826, 0.026667, 0.666667], ["(sepalwidth_(2.24, 2.48], petalwidth_(0.82, 1.06])", "(sepallength_(4.66, 5.02])", 4.347826, 0.013333, 0.666667], ["(petallength_(2.77, 3.36])", "(sepallength_(4.66, 5.02])", 4.347826, 0.013333, 0.666667], ["(variety_Versicolor, petallength_(2.77, 3.36])", "(sepallength_(4.66, 5.02])", 4.347826, 0.013333, 0.666667], ["(sepalwidth_(2.96, 3.2], petalwidth_(0.0976, 0.34])", "(sepallength_(4.66, 5.02])", 4.347826, 0.066667, 0.666667], ["(sepalwidth_(2.96, 3.2], variety_Setosa)", "(sepallength_(4.66, 5.02])", 4.347826, 0.066667, 0.666667], ["(sepallength_(5.38, 5.74], petalwidth_(1.06, 1.3])", "(petallength_(3.95, 4.54])", 4.326923, 0.06, 0.75], ["(sepalwidth_(2.96, 3.2], sepallength_(5.74, 6.1])", "(petallength_(4.54, 5.13])", 4.310345, 0.033333, 0.833333], ["(petallength_(4.54, 5.13], variety_Versicolor)", "(petalwidth_(1.3, 1.54])", 4.285714, 0.053333, 0.571429], ["(sepallength_(6.1, 6.46], petallength_(3.95, 4.54])", "(petalwidth_(1.06, 1.3])", 4.285714, 0.02, 0.6], ["(sepallength_(5.38, 5.74], petallength_(3.36, 3.95])", "(petalwidth_(1.06, 1.3])", 4.285714, 0.02, 0.6], ["(petallength_(1.59, 2.18])", "(variety_Setosa, sepallength_(4.66, 5.02])", 4.251012, 0.046667, 0.538462], ["(variety_Versicolor, sepalwidth_(2.48, 2.72])", "(petalwidth_(1.06, 1.3])", 4.166667, 0.046667, 0.583333], ["(petalwidth_(2.26, 2.5])", "(petallength_(5.13, 5.72])", 4.166667, 0.046667, 0.5], ["(petalwidth_(2.26, 2.5], variety_Virginica)", "(petallength_(5.13, 5.72])", 4.166667, 0.046667, 0.5], ["(petalwidth_(2.26, 2.5])", "(petallength_(5.13, 5.72], variety_Virginica)", 4.166667, 0.046667, 0.5], ["(petalwidth_(0.34, 0.58], petallength_(0.994, 1.59])", "(sepallength_(5.38, 5.74])", 4.166667, 0.02, 0.75], ["(petalwidth_(1.06, 1.3], petallength_(3.36, 3.95])", "(sepallength_(5.38, 5.74])", 4.166667, 0.02, 0.75], ["(sepallength_(6.1, 6.46], petalwidth_(1.78, 2.02])", "(petallength_(5.13, 5.72])", 4.166667, 0.02, 0.5], ["(sepallength_(6.1, 6.46], petalwidth_(1.06, 1.3])", "(sepalwidth_(2.72, 2.96])", 4.166667, 0.013333, 0.666667], ["(sepallength_(7.18, 7.54], petalwidth_(1.78, 2.02])", "(sepalwidth_(2.72, 2.96])", 4.166667, 0.013333, 0.666667], ["(petalwidth_(0.34, 0.58], petallength_(1.59, 2.18])", "(sepalwidth_(3.2, 3.44])", 4.166667, 0.013333, 0.5], ["(sepallength_(6.82, 7.18], variety_Virginica)", "(petallength_(5.13, 5.72])", 4.166667, 0.013333, 0.5], ["(variety_Versicolor, petalwidth_(1.54, 1.78])", "(sepalwidth_(3.2, 3.44])", 4.166667, 0.013333, 0.5], ["(sepallength_(6.46, 6.82], petalwidth_(1.78, 2.02])", "(petallength_(5.13, 5.72])", 4.166667, 0.013333, 0.5], ["(sepalwidth_(3.2, 3.44], petallength_(5.13, 5.72])", "(sepallength_(6.46, 6.82])", 4.166667, 0.013333, 0.5], ["(sepalwidth_(3.2, 3.44], sepallength_(6.1, 6.46])", "(petallength_(5.13, 5.72])", 4.166667, 0.013333, 0.5], ["(petalwidth_(1.3, 1.54], sepalwidth_(2.72, 2.96])", "(petallength_(4.54, 5.13])", 4.137931, 0.026667, 0.8], ["(sepallength_(6.1, 6.46], variety_Versicolor)", "(petallength_(3.95, 4.54])", 4.120879, 0.033333, 0.714286], ["(sepallength_(7.18, 7.54])", "(variety_Virginica, petalwidth_(1.78, 2.02])", 4.090909, 0.02, 0.6], ["(petallength_(1.59, 2.18], petalwidth_(0.0976, 0.34])", "(sepallength_(4.66, 5.02])", 4.076087, 0.033333, 0.625], ["(sepallength_(5.74, 6.1], variety_Virginica)", "(petalwidth_(1.78, 2.02])", 4.076087, 0.033333, 0.625], ["(sepallength_(4.296, 4.66])", "(petallength_(0.994, 1.59])", 4.054054, 0.06, 1.0], ["(sepallength_(4.296, 4.66], petalwidth_(0.0976, 0.34])", "(petallength_(0.994, 1.59])", 4.054054, 0.06, 1.0], ["(sepallength_(4.296, 4.66], variety_Setosa)", "(petallength_(0.994, 1.59])", 4.054054, 0.06, 1.0], ["(sepallength_(4.296, 4.66])", "(variety_Setosa, petallength_(0.994, 1.59])", 4.054054, 0.06, 1.0], ["(sepalwidth_(3.44, 3.68], petalwidth_(0.0976, 0.34])", "(petallength_(0.994, 1.59])", 4.054054, 0.053333, 1.0], ["(sepalwidth_(2.96, 3.2], sepallength_(4.296, 4.66])", "(petallength_(0.994, 1.59])", 4.054054, 0.033333, 1.0], ["(sepallength_(5.02, 5.38], sepalwidth_(3.44, 3.68])", "(petallength_(0.994, 1.59])", 4.054054, 0.02, 1.0], ["(sepalwidth_(3.92, 4.16])", "(petallength_(0.994, 1.59])", 4.054054, 0.013333, 1.0], ["(petalwidth_(0.0976, 0.34], sepalwidth_(3.92, 4.16])", "(petallength_(0.994, 1.59])", 4.054054, 0.013333, 1.0], ["(variety_Setosa, sepalwidth_(3.92, 4.16])", "(petallength_(0.994, 1.59])", 4.054054, 0.013333, 1.0], ["(sepalwidth_(3.92, 4.16])", "(variety_Setosa, petallength_(0.994, 1.59])", 4.054054, 0.013333, 1.0], ["(sepalwidth_(4.16, 4.4])", "(petallength_(0.994, 1.59])", 4.054054, 0.013333, 1.0], ["(sepallength_(5.38, 5.74], sepalwidth_(4.16, 4.4])", "(petallength_(0.994, 1.59])", 4.054054, 0.013333, 1.0], ["(variety_Setosa, sepalwidth_(4.16, 4.4])", "(petallength_(0.994, 1.59])", 4.054054, 0.013333, 1.0], ["(sepalwidth_(4.16, 4.4])", "(variety_Setosa, petallength_(0.994, 1.59])", 4.054054, 0.013333, 1.0], ["(petalwidth_(1.06, 1.3])", "(variety_Versicolor, petallength_(3.95, 4.54])", 4.0, 0.093333, 0.666667], ["(variety_Versicolor, petallength_(3.95, 4.54])", "(petalwidth_(1.06, 1.3])", 4.0, 0.093333, 0.56], ["(petalwidth_(2.02, 2.26])", "(sepalwidth_(2.96, 3.2], variety_Virginica)", 3.968254, 0.033333, 0.555556], ["(sepallength_(5.38, 5.74], variety_Versicolor)", "(petallength_(3.95, 4.54])", 3.966346, 0.073333, 0.6875], ["(sepalwidth_(2.72, 2.96], variety_Virginica)", "(petalwidth_(1.78, 2.02])", 3.913043, 0.04, 0.6], ["(sepalwidth_(3.2, 3.44], petallength_(1.59, 2.18])", "(sepallength_(4.66, 5.02])", 3.913043, 0.02, 0.6], ["(sepallength_(7.18, 7.54])", "(petalwidth_(1.78, 2.02])", 3.913043, 0.02, 0.6], ["(variety_Virginica, sepallength_(7.18, 7.54])", "(petalwidth_(1.78, 2.02])", 3.913043, 0.02, 0.6], ["(petallength_(5.72, 6.31], sepallength_(7.18, 7.54])", "(petalwidth_(1.78, 2.02])", 3.913043, 0.02, 0.6], ["(petallength_(5.72, 6.31])", "(sepalwidth_(2.96, 3.2], variety_Virginica)", 3.896104, 0.04, 0.545455], ["(sepallength_(6.1, 6.46], sepalwidth_(2.48, 2.72])", "(petallength_(4.54, 5.13])", 3.87931, 0.02, 0.75], ["(variety_Versicolor, petalwidth_(1.54, 1.78])", "(petallength_(4.54, 5.13])", 3.87931, 0.02, 0.75], ["(petalwidth_(1.06, 1.3], sepalwidth_(2.72, 2.96])", "(petallength_(3.95, 4.54])", 3.846154, 0.04, 0.666667], ["(sepalwidth_(2.24, 2.48], petalwidth_(1.06, 1.3])", "(petallength_(3.95, 4.54])", 3.846154, 0.013333, 0.666667], ["(variety_Versicolor, sepalwidth_(1.998, 2.24])", "(petallength_(3.95, 4.54])", 3.846154, 0.013333, 0.666667], ["(petalwidth_(1.06, 1.3])", "(petallength_(3.95, 4.54])", 3.846154, 0.093333, 0.666667], ["(variety_Versicolor, petalwidth_(1.06, 1.3])", "(petallength_(3.95, 4.54])", 3.846154, 0.093333, 0.666667], ["(petallength_(3.95, 4.54])", "(petalwidth_(1.06, 1.3])", 3.846154, 0.093333, 0.538462], ["(petallength_(3.95, 4.54])", "(variety_Versicolor, petalwidth_(1.06, 1.3])", 3.846154, 0.093333, 0.538462], ["(sepalwidth_(2.96, 3.2], petallength_(0.994, 1.59])", "(sepallength_(4.66, 5.02])", 3.804348, 0.046667, 0.583333], ["(sepalwidth_(2.72, 2.96], variety_Virginica)", "(sepallength_(6.1, 6.46])", 3.75, 0.033333, 0.5], ["(sepallength_(6.46, 6.82], petallength_(4.54, 5.13])", "(petalwidth_(1.3, 1.54])", 3.75, 0.02, 0.5], ["(sepalwidth_(2.96, 3.2], sepallength_(5.38, 5.74])", "(petalwidth_(1.3, 1.54])", 3.75, 0.013333, 0.5], ["(sepalwidth_(1.998, 2.24])", "(petalwidth_(1.3, 1.54])", 3.75, 0.013333, 0.5], ["(sepalwidth_(3.2, 3.44], petallength_(5.13, 5.72])", "(sepallength_(6.1, 6.46])", 3.75, 0.013333, 0.5], ["(sepalwidth_(2.24, 2.48], petalwidth_(1.06, 1.3])", "(sepallength_(5.38, 5.74])", 3.703704, 0.013333, 0.666667], ["(petallength_(3.36, 3.95], petalwidth_(0.82, 1.06])", "(sepallength_(5.38, 5.74])", 3.703704, 0.013333, 0.666667], ["(sepallength_(6.46, 6.82], variety_Versicolor)", "(petallength_(4.54, 5.13])", 3.694581, 0.033333, 0.714286], ["(sepalwidth_(2.48, 2.72], petalwidth_(1.78, 2.02])", "(petallength_(4.54, 5.13])", 3.694581, 0.033333, 0.714286], ["(sepalwidth_(2.96, 3.2], variety_Setosa)", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.1, 1.0], ["(sepalwidth_(2.96, 3.2], petallength_(0.994, 1.59])", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.08, 1.0], ["(sepallength_(4.66, 5.02], petallength_(0.994, 1.59])", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.08, 1.0], ["(sepalwidth_(2.96, 3.2], sepallength_(4.66, 5.02])", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.066667, 1.0], ["(sepallength_(4.296, 4.66])", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.06, 1.0], ["(sepallength_(4.296, 4.66], petallength_(0.994, 1.59])", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.06, 1.0], ["(sepallength_(4.296, 4.66], variety_Setosa)", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.06, 1.0], ["(sepallength_(4.296, 4.66])", "(petalwidth_(0.0976, 0.34], variety_Setosa)", 3.658537, 0.06, 1.0], ["(sepalwidth_(3.44, 3.68], petallength_(0.994, 1.59])", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.053333, 1.0], ["(sepalwidth_(2.96, 3.2], sepallength_(4.296, 4.66])", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.033333, 1.0], ["(sepallength_(5.02, 5.38], sepalwidth_(3.44, 3.68])", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.02, 1.0], ["(sepalwidth_(2.96, 3.2], petallength_(1.59, 2.18])", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.02, 1.0], ["(sepalwidth_(3.92, 4.16])", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.013333, 1.0], ["(sepalwidth_(3.92, 4.16], petallength_(0.994, 1.59])", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.013333, 1.0], ["(variety_Setosa, sepalwidth_(3.92, 4.16])", "(petalwidth_(0.0976, 0.34])", 3.658537, 0.013333, 1.0], ["(sepalwidth_(3.92, 4.16])", "(petalwidth_(0.0976, 0.34], variety_Setosa)", 3.658537, 0.013333, 1.0], ["(sepalwidth_(3.44, 3.68])", "(petalwidth_(0.0976, 0.34], petallength_(0.994, 1.59])", 3.636364, 0.053333, 0.8], ["(sepallength_(5.02, 5.38], petalwidth_(0.0976, 0.34])", "(petallength_(0.994, 1.59])", 3.603604, 0.053333, 0.888889], ["(sepalwidth_(3.44, 3.68], variety_Setosa)", "(petallength_(0.994, 1.59])", 3.603604, 0.053333, 0.888889], ["(petallength_(3.95, 4.54], petalwidth_(1.06, 1.3])", "(sepallength_(5.38, 5.74])", 3.571429, 0.06, 0.642857], ["(petallength_(5.13, 5.72])", "(sepalwidth_(2.96, 3.2], variety_Virginica)", 3.571429, 0.06, 0.5], ["(petalwidth_(2.26, 2.5])", "(sepalwidth_(2.96, 3.2], variety_Virginica)", 3.571429, 0.046667, 0.5], ["(petallength_(3.36, 3.95])", "(petalwidth_(1.06, 1.3])", 3.571429, 0.026667, 0.5], ["(variety_Versicolor, petallength_(3.36, 3.95])", "(petalwidth_(1.06, 1.3])", 3.571429, 0.026667, 0.5], ["(petallength_(3.36, 3.95])", "(variety_Versicolor, petalwidth_(1.06, 1.3])", 3.571429, 0.026667, 0.5], ["(variety_Versicolor, sepalwidth_(2.24, 2.48])", "(petalwidth_(1.06, 1.3])", 3.571429, 0.02, 0.5], ["(sepalwidth_(2.96, 3.2], sepallength_(5.38, 5.74])", "(petalwidth_(1.06, 1.3])", 3.571429, 0.013333, 0.5], ["(sepalwidth_(2.48, 2.72], petallength_(3.36, 3.95])", "(petalwidth_(1.06, 1.3])", 3.571429, 0.013333, 0.5], ["(petallength_(1.59, 2.18])", "(sepallength_(4.66, 5.02])", 3.511706, 0.046667, 0.538462], ["(petallength_(1.59, 2.18], variety_Setosa)", "(sepallength_(4.66, 5.02])", 3.511706, 0.046667, 0.538462], ["(petallength_(3.36, 3.95])", "(sepallength_(5.38, 5.74])", 3.472222, 0.033333, 0.625], ["(variety_Versicolor, petallength_(3.36, 3.95])", "(sepallength_(5.38, 5.74])", 3.472222, 0.033333, 0.625], ["(sepalwidth_(2.96, 3.2], petalwidth_(1.3, 1.54])", "(petallength_(3.95, 4.54])", 3.461538, 0.04, 0.6], ["(sepallength_(5.38, 5.74], sepalwidth_(2.72, 2.96])", "(petallength_(3.95, 4.54])", 3.461538, 0.02, 0.6], ["(petalwidth_(1.3, 1.54], variety_Virginica)", "(petallength_(4.54, 5.13])", 3.448276, 0.013333, 0.666667], ["(petallength_(4.54, 5.13], petalwidth_(1.78, 2.02])", "(sepallength_(5.74, 6.1])", 3.409091, 0.04, 0.5], ["(petallength_(3.36, 3.95])", "(sepalwidth_(2.48, 2.72])", 3.409091, 0.026667, 0.5], ["(variety_Versicolor, petallength_(3.36, 3.95])", "(sepalwidth_(2.48, 2.72])", 3.409091, 0.026667, 0.5], ["(sepallength_(6.1, 6.46], petallength_(4.54, 5.13])", "(sepalwidth_(2.48, 2.72])", 3.409091, 0.02, 0.5], ["(sepallength_(6.1, 6.46], petalwidth_(1.78, 2.02])", "(sepalwidth_(2.48, 2.72])", 3.409091, 0.02, 0.5], ["(sepallength_(5.74, 6.1], petalwidth_(1.06, 1.3])", "(sepalwidth_(2.48, 2.72])", 3.409091, 0.013333, 0.5], ["(variety_Versicolor, petalwidth_(1.54, 1.78])", "(sepallength_(5.74, 6.1])", 3.409091, 0.013333, 0.5], ["(petalwidth_(1.06, 1.3], petallength_(3.36, 3.95])", "(sepalwidth_(2.48, 2.72])", 3.409091, 0.013333, 0.5], ["(sepalwidth_(1.998, 2.24])", "(sepallength_(5.74, 6.1])", 3.409091, 0.013333, 0.5], ["(sepalwidth_(2.96, 3.2], variety_Versicolor)", "(petallength_(3.95, 4.54])", 3.296703, 0.053333, 0.571429], ["(petalwidth_(1.06, 1.3], sepalwidth_(2.48, 2.72])", "(petallength_(3.95, 4.54])", 3.296703, 0.026667, 0.571429], ["(variety_Setosa, sepallength_(4.66, 5.02])", "(petalwidth_(0.0976, 0.34])", 3.273427, 0.113333, 0.894737], ["(petallength_(0.994, 1.59])", "(petalwidth_(0.0976, 0.34])", 3.263019, 0.22, 0.891892], ["(variety_Setosa, petallength_(0.994, 1.59])", "(petalwidth_(0.0976, 0.34])", 3.263019, 0.22, 0.891892], ["(petallength_(0.994, 1.59])", "(petalwidth_(0.0976, 0.34], variety_Setosa)", 3.263019, 0.22, 0.891892], ["(petalwidth_(0.0976, 0.34])", "(petallength_(0.994, 1.59])", 3.263019, 0.22, 0.804878], ["(petalwidth_(0.0976, 0.34], variety_Setosa)", "(petallength_(0.994, 1.59])", 3.263019, 0.22, 0.804878], ["(petalwidth_(0.0976, 0.34])", "(variety_Setosa, petallength_(0.994, 1.59])", 3.263019, 0.22, 0.804878], ["(petallength_(4.54, 5.13], sepallength_(5.74, 6.1])", "(petalwidth_(1.78, 2.02])", 3.26087, 0.04, 0.5], ["(sepalwidth_(3.2, 3.44], petalwidth_(0.0976, 0.34])", "(sepallength_(4.66, 5.02])", 3.26087, 0.026667, 0.5], ["(sepallength_(6.1, 6.46], petallength_(4.54, 5.13])", "(petalwidth_(1.78, 2.02])", 3.26087, 0.02, 0.5], ["(sepallength_(5.02, 5.38], petallength_(0.994, 1.59])", "(petalwidth_(0.0976, 0.34])", 3.252033, 0.053333, 0.888889], ["(sepalwidth_(3.44, 3.68], variety_Setosa)", "(petalwidth_(0.0976, 0.34])", 3.252033, 0.053333, 0.888889], ["(sepalwidth_(3.44, 3.68])", "(petallength_(0.994, 1.59])", 3.243243, 0.053333, 0.8], ["(sepalwidth_(3.44, 3.68])", "(variety_Setosa, petallength_(0.994, 1.59])", 3.243243, 0.053333, 0.8], ["(sepalwidth_(2.96, 3.2], variety_Setosa)", "(petallength_(0.994, 1.59])", 3.243243, 0.08, 0.8], ["(sepalwidth_(2.96, 3.2], petalwidth_(0.0976, 0.34])", "(petallength_(0.994, 1.59])", 3.243243, 0.08, 0.8], ["(petalwidth_(1.06, 1.3])", "(sepallength_(5.38, 5.74])", 3.174603, 0.08, 0.571429], ["(variety_Versicolor, petalwidth_(1.06, 1.3])", "(sepallength_(5.38, 5.74])", 3.174603, 0.08, 0.571429], ["(petalwidth_(1.06, 1.3], sepalwidth_(2.48, 2.72])", "(sepallength_(5.38, 5.74])", 3.174603, 0.026667, 0.571429], ["(sepallength_(6.46, 6.82], petallength_(4.54, 5.13])", "(sepalwidth_(2.72, 2.96])", 3.125, 0.02, 0.5], ["(sepallength_(5.74, 6.1], petalwidth_(1.06, 1.3])", "(sepalwidth_(2.72, 2.96])", 3.125, 0.013333, 0.5], ["(petallength_(5.72, 6.31], petalwidth_(1.78, 2.02])", "(sepalwidth_(2.72, 2.96])", 3.125, 0.013333, 0.5], ["(variety_Versicolor, sepalwidth_(2.72, 2.96])", "(petallength_(3.95, 4.54])", 3.106509, 0.046667, 0.538462], ["(sepallength_(5.74, 6.1], variety_Versicolor)", "(petallength_(3.95, 4.54])", 3.106509, 0.046667, 0.538462], ["(sepallength_(5.74, 6.1], sepalwidth_(2.72, 2.96])", "(petallength_(4.54, 5.13])", 3.103448, 0.02, 0.6], ["(sepallength_(6.46, 6.82], petalwidth_(1.3, 1.54])", "(petallength_(4.54, 5.13])", 3.103448, 0.02, 0.6], ["(sepalwidth_(3.2, 3.44], petallength_(0.994, 1.59])", "(petalwidth_(0.0976, 0.34])", 3.04878, 0.033333, 0.833333], ["(sepallength_(5.02, 5.38], variety_Setosa)", "(petallength_(0.994, 1.59])", 3.040541, 0.06, 0.75], ["(sepalwidth_(3.44, 3.68], sepallength_(4.66, 5.02])", "(petallength_(0.994, 1.59])", 3.040541, 0.02, 0.75], ["(sepallength_(5.38, 5.74], petalwidth_(0.34, 0.58])", "(petallength_(0.994, 1.59])", 3.040541, 0.02, 0.75], ["(variety_Setosa)", "(petallength_(0.994, 1.59])", 3.0, 0.246667, 0.74], ["(petalwidth_(0.0976, 0.34])", "(variety_Setosa)", 3.0, 0.273333, 1.0], ["(variety_Setosa)", "(petalwidth_(0.0976, 0.34])", 3.0, 0.273333, 0.82], ["(petallength_(0.994, 1.59])", "(variety_Setosa)", 3.0, 0.246667, 1.0], ["(petalwidth_(0.0976, 0.34], petallength_(0.994, 1.59])", "(variety_Setosa)", 3.0, 0.22, 1.0], ["(variety_Setosa)", "(petalwidth_(0.0976, 0.34], petallength_(0.994, 1.59])", 3.0, 0.22, 0.66], ["(petalwidth_(1.06, 1.3])", "(variety_Versicolor)", 3.0, 0.14, 1.0], ["(petallength_(5.13, 5.72])", "(variety_Virginica)", 3.0, 0.12, 1.0], ["(petalwidth_(0.0976, 0.34], sepallength_(4.66, 5.02])", "(variety_Setosa)", 3.0, 0.113333, 1.0], ["(sepalwidth_(2.96, 3.2], petalwidth_(0.0976, 0.34])", "(variety_Setosa)", 3.0, 0.1, 1.0], ["(petallength_(3.95, 4.54], petalwidth_(1.06, 1.3])", "(variety_Versicolor)", 3.0, 0.093333, 1.0], ["(petalwidth_(2.26, 2.5])", "(variety_Virginica)", 3.0, 0.093333, 1.0], ["(petallength_(1.59, 2.18])", "(variety_Setosa)", 3.0, 0.086667, 1.0], ["(sepalwidth_(2.96, 3.2], petallength_(0.994, 1.59])", "(variety_Setosa)", 3.0, 0.08, 1.0], ["(sepallength_(4.66, 5.02], petallength_(0.994, 1.59])", "(variety_Setosa)", 3.0, 0.08, 1.0], ["(sepallength_(5.38, 5.74], petalwidth_(1.06, 1.3])", "(variety_Versicolor)", 3.0, 0.08, 1.0], ["(sepallength_(5.38, 5.74], petallength_(3.95, 4.54])", "(variety_Versicolor)", 3.0, 0.073333, 1.0], ["(petallength_(5.72, 6.31])", "(variety_Virginica)", 3.0, 0.073333, 1.0], ["(sepalwidth_(2.96, 3.2], sepallength_(4.66, 5.02])", "(variety_Setosa)", 3.0, 0.066667, 1.0], ["(sepalwidth_(2.96, 3.2], petalwidth_(1.3, 1.54])", "(variety_Versicolor)", 3.0, 0.066667, 1.0], ["(sepallength_(5.02, 5.38], petallength_(0.994, 1.59])", "(variety_Setosa)", 3.0, 0.06, 1.0], ["(sepallength_(5.02, 5.38], petalwidth_(0.0976, 0.34])", "(variety_Setosa)", 3.0, 0.06, 1.0], ["(sepallength_(4.296, 4.66])", "(variety_Setosa)", 3.0, 0.06, 1.0], ["(sepallength_(4.296, 4.66], petallength_(0.994, 1.59])", "(variety_Setosa)", 3.0, 0.06, 1.0], ["(sepallength_(4.296, 4.66], petalwidth_(0.0976, 0.34])", "(variety_Setosa)", 3.0, 0.06, 1.0], ["(petalwidth_(1.06, 1.3], sepalwidth_(2.72, 2.96])", "(variety_Versicolor)", 3.0, 0.06, 1.0], ["(petalwidth_(2.02, 2.26])", "(variety_Virginica)", 3.0, 0.06, 1.0], ["(sepalwidth_(2.96, 3.2], petallength_(5.13, 5.72])", "(variety_Virginica)", 3.0, 0.06, 1.0], ["(sepalwidth_(3.44, 3.68], petallength_(0.994, 1.59])", "(variety_Setosa)", 3.0, 0.053333, 1.0], ["(sepalwidth_(3.44, 3.68], petalwidth_(0.0976, 0.34])", "(variety_Setosa)", 3.0, 0.053333, 1.0], ["(petallength_(1.59, 2.18], petalwidth_(0.0976, 0.34])", "(variety_Setosa)", 3.0, 0.053333, 1.0], ["(petalwidth_(0.34, 0.58])", "(variety_Setosa)", 3.0, 0.053333, 1.0], ["(sepalwidth_(3.2, 3.44], petalwidth_(0.0976, 0.34])", "(variety_Setosa)", 3.0, 0.053333, 1.0], ["(petalwidth_(1.3, 1.54], petallength_(3.95, 4.54])", "(variety_Versicolor)", 3.0, 0.053333, 1.0], ["(sepalwidth_(2.96, 3.2], petallength_(3.95, 4.54])", "(variety_Versicolor)", 3.0, 0.053333, 1.0], ["(petallength_(3.36, 3.95])", "(variety_Versicolor)", 3.0, 0.053333, 1.0], ["(sepallength_(6.1, 6.46], petallength_(5.13, 5.72])", "(variety_Virginica)", 3.0, 0.053333, 1.0], ["(petallength_(1.59, 2.18], sepallength_(4.66, 5.02])", "(variety_Setosa)", 3.0, 0.046667, 1.0], ["(petallength_(3.95, 4.54], sepalwidth_(2.72, 2.96])", "(variety_Versicolor)", 3.0, 0.046667, 1.0], ["(sepallength_(5.74, 6.1], petallength_(3.95, 4.54])", "(variety_Versicolor)", 3.0, 0.046667, 1.0], ["(petalwidth_(1.06, 1.3], sepalwidth_(2.48, 2.72])", "(variety_Versicolor)", 3.0, 0.046667, 1.0], ["(petalwidth_(0.82, 1.06])", "(variety_Versicolor)", 3.0, 0.046667, 1.0], ["(sepalwidth_(2.48, 2.72], petalwidth_(1.78, 2.02])", "(variety_Virginica)", 3.0, 0.046667, 1.0], ["(petallength_(5.13, 5.72], petalwidth_(2.26, 2.5])", "(variety_Virginica)", 3.0, 0.046667, 1.0], ["(sepalwidth_(2.96, 3.2], petalwidth_(2.26, 2.5])", "(variety_Virginica)", 3.0, 0.046667, 1.0], ["(sepallength_(6.46, 6.82], petallength_(5.13, 5.72])", "(variety_Virginica)", 3.0, 0.046667, 1.0], ["(sepallength_(5.38, 5.74], petallength_(0.994, 1.59])", "(variety_Setosa)", 3.0, 0.04, 1.0], ["(sepalwidth_(3.2, 3.44], petallength_(0.994, 1.59])", "(variety_Setosa)", 3.0, 0.04, 1.0], ["(sepallength_(6.82, 7.18])", "(sepalwidth_(2.96, 3.2])", 3.0, 0.04, 1.0], ["(sepallength_(6.1, 6.46], petalwidth_(1.78, 2.02])", "(variety_Virginica)", 3.0, 0.04, 1.0], ["(sepalwidth_(2.72, 2.96], petalwidth_(1.78, 2.02])", "(variety_Virginica)", 3.0, 0.04, 1.0], ["(sepalwidth_(2.96, 3.2], petallength_(5.72, 6.31])", "(variety_Virginica)", 3.0, 0.04, 1.0], ["(sepallength_(7.54, 7.9])", "(variety_Virginica)", 3.0, 0.04, 1.0], ["(sepalwidth_(2.96, 3.2], sepallength_(4.296, 4.66])", "(variety_Setosa)", 3.0, 0.033333, 1.0], ["(sepallength_(5.38, 5.74], petalwidth_(0.0976, 0.34])", "(variety_Setosa)", 3.0, 0.033333, 1.0], ["(sepalwidth_(3.2, 3.44], petallength_(1.59, 2.18])", "(variety_Setosa)", 3.0, 0.033333, 1.0], ["(petallength_(0.994, 1.59], sepalwidth_(3.68, 3.92])", "(variety_Setosa)", 3.0, 0.033333, 1.0], ["(petalwidth_(0.0976, 0.34], sepalwidth_(3.68, 3.92])", "(variety_Setosa)", 3.0, 0.033333, 1.0], ["(sepallength_(5.02, 5.38], sepalwidth_(3.68, 3.92])", "(variety_Setosa)", 3.0, 0.033333, 1.0], ["(sepalwidth_(3.2, 3.44], sepallength_(4.66, 5.02])", "(variety_Setosa)", 3.0, 0.033333, 1.0], ["(sepallength_(6.1, 6.46], petallength_(3.95, 4.54])", "(variety_Versicolor)", 3.0, 0.033333, 1.0], ["(sepallength_(6.46, 6.82], petalwidth_(1.3, 1.54])", "(variety_Versicolor)", 3.0, 0.033333, 1.0], ["(sepallength_(5.38, 5.74], petallength_(3.36, 3.95])", "(variety_Versicolor)", 3.0, 0.033333, 1.0], ["(sepalwidth_(2.96, 3.2], petalwidth_(2.02, 2.26])", "(variety_Virginica)", 3.0, 0.033333, 1.0], ["(petallength_(5.13, 5.72], petalwidth_(2.02, 2.26])", "(variety_Virginica)", 3.0, 0.033333, 1.0], ["(petallength_(5.13, 5.72], petalwidth_(1.78, 2.02])", "(variety_Virginica)", 3.0, 0.033333, 1.0], ["(petallength_(6.31, 6.9])", "(variety_Virginica)", 3.0, 0.033333, 1.0], ["(petallength_(6.31, 6.9], sepallength_(7.54, 7.9])", "(variety_Virginica)", 3.0, 0.033333, 1.0], ["(sepallength_(7.18, 7.54])", "(variety_Virginica)", 3.0, 0.033333, 1.0], ["(petallength_(5.72, 6.31], sepallength_(7.18, 7.54])", "(variety_Virginica)", 3.0, 0.033333, 1.0], ["(sepalwidth_(3.44, 3.68], sepallength_(4.66, 5.02])", "(variety_Setosa)", 3.0, 0.026667, 1.0], ["(sepalwidth_(2.96, 3.2], sepallength_(5.38, 5.74])", "(variety_Versicolor)", 3.0, 0.026667, 1.0], ["(petallength_(1.59, 2.18], sepalwidth_(3.68, 3.92])", "(variety_Setosa)", 3.0, 0.026667, 1.0], ["(sepallength_(5.38, 5.74], sepalwidth_(3.68, 3.92])", "(variety_Setosa)", 3.0, 0.026667, 1.0], ["(petalwidth_(0.34, 0.58], sepalwidth_(3.68, 3.92])", "(variety_Setosa)", 3.0, 0.026667, 1.0], ["(petalwidth_(0.34, 0.58], petallength_(1.59, 2.18])", "(variety_Setosa)", 3.0, 0.026667, 1.0], ["(sepallength_(5.38, 5.74], petalwidth_(0.34, 0.58])", "(variety_Setosa)", 3.0, 0.026667, 1.0], ["(petalwidth_(0.34, 0.58], petallength_(0.994, 1.59])", "(variety_Setosa)", 3.0, 0.026667, 1.0], ["(sepallength_(6.82, 7.18], variety_Virginica)", "(sepalwidth_(2.96, 3.2])", 3.0, 0.026667, 1.0], ["(sepallength_(5.74, 6.1], petalwidth_(1.06, 1.3])", "(variety_Versicolor)", 3.0, 0.026667, 1.0], ["(sepallength_(6.46, 6.82], petalwidth_(1.78, 2.02])", "(variety_Virginica)", 3.0, 0.026667, 1.0], ["(sepalwidth_(2.48, 2.72], petallength_(3.36, 3.95])", "(variety_Versicolor)", 3.0, 0.026667, 1.0], ["(petalwidth_(1.06, 1.3], petallength_(3.36, 3.95])", "(variety_Versicolor)", 3.0, 0.026667, 1.0], ["(sepalwidth_(3.2, 3.44], petalwidth_(2.26, 2.5])", "(variety_Virginica)", 3.0, 0.026667, 1.0], ["(sepallength_(6.1, 6.46], petalwidth_(2.26, 2.5])", "(variety_Virginica)", 3.0, 0.026667, 1.0], ["(sepallength_(6.46, 6.82], petalwidth_(2.26, 2.5])", "(variety_Virginica)", 3.0, 0.026667, 1.0], ["(petalwidth_(2.26, 2.5], petallength_(5.72, 6.31])", "(variety_Virginica)", 3.0, 0.026667, 1.0], ["(petallength_(5.72, 6.31], petalwidth_(1.78, 2.02])", "(variety_Virginica)", 3.0, 0.026667, 1.0], ["(sepalwidth_(3.2, 3.44], petallength_(5.13, 5.72])", "(variety_Virginica)", 3.0, 0.026667, 1.0], ["(sepalwidth_(3.2, 3.44], sepallength_(5.02, 5.38])", "(variety_Setosa)", 3.0, 0.02, 1.0], ["(sepallength_(5.02, 5.38], sepalwidth_(3.44, 3.68])", "(variety_Setosa)", 3.0, 0.02, 1.0], ["(sepallength_(5.38, 5.74], petallength_(1.59, 2.18])", "(variety_Setosa)", 3.0, 0.02, 1.0], ["(sepallength_(5.02, 5.38], petallength_(1.59, 2.18])", "(variety_Setosa)", 3.0, 0.02, 1.0], ["(sepalwidth_(2.96, 3.2], petallength_(1.59, 2.18])", "(variety_Setosa)", 3.0, 0.02, 1.0], ["(sepallength_(5.02, 5.38], petalwidth_(0.34, 0.58])", "(variety_Setosa)", 3.0, 0.02, 1.0], ["(sepalwidth_(3.2, 3.44], petalwidth_(0.34, 0.58])", "(variety_Setosa)", 3.0, 0.02, 1.0], ["(sepalwidth_(2.24, 2.48], petalwidth_(1.06, 1.3])", "(variety_Versicolor)", 3.0, 0.02, 1.0], ["(sepallength_(5.38, 5.74], sepalwidth_(2.24, 2.48])", "(variety_Versicolor)", 3.0, 0.02, 1.0], ["(sepallength_(6.82, 7.18], petallength_(4.54, 5.13])", "(sepalwidth_(2.96, 3.2])", 3.0, 0.02, 1.0], ["(sepallength_(6.1, 6.46], petalwidth_(1.06, 1.3])", "(variety_Versicolor)", 3.0, 0.02, 1.0], ["(sepallength_(6.46, 6.82], sepalwidth_(2.72, 2.96])", "(variety_Versicolor)", 3.0, 0.02, 1.0], ["(petallength_(4.54, 5.13], petalwidth_(1.54, 1.78])", "(variety_Versicolor)", 3.0, 0.02, 1.0], ["(sepalwidth_(2.24, 2.48], petalwidth_(0.82, 1.06])", "(variety_Versicolor)", 3.0, 0.02, 1.0], ["(petalwidth_(0.82, 1.06], sepallength_(4.66, 5.02])", "(variety_Versicolor)", 3.0, 0.02, 1.0], ["(petallength_(3.36, 3.95], petalwidth_(0.82, 1.06])", "(variety_Versicolor)", 3.0, 0.02, 1.0], ["(petallength_(2.77, 3.36])", "(variety_Versicolor)", 3.0, 0.02, 1.0], ["(sepallength_(6.46, 6.82], petallength_(5.72, 6.31])", "(variety_Virginica)", 3.0, 0.02, 1.0], ["(sepallength_(6.46, 6.82], petalwidth_(2.02, 2.26])", "(variety_Virginica)", 3.0, 0.02, 1.0], ["(petallength_(5.13, 5.72], sepalwidth_(2.72, 2.96])", "(variety_Virginica)", 3.0, 0.02, 1.0], ["(sepallength_(7.18, 7.54], petalwidth_(1.78, 2.02])", "(variety_Virginica)", 3.0, 0.02, 1.0], ["(sepallength_(5.02, 5.38], sepalwidth_(2.48, 2.72])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepallength_(5.38, 5.74], petallength_(4.54, 5.13])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(sepalwidth_(3.2, 3.44], sepallength_(5.38, 5.74])", "(variety_Setosa)", 3.0, 0.013333, 1.0], ["(sepalwidth_(3.2, 3.44], sepallength_(6.46, 6.82])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(sepalwidth_(3.92, 4.16])", "(variety_Setosa)", 3.0, 0.013333, 1.0], ["(sepalwidth_(3.92, 4.16], petallength_(0.994, 1.59])", "(variety_Setosa)", 3.0, 0.013333, 1.0], ["(petalwidth_(0.0976, 0.34], sepalwidth_(3.92, 4.16])", "(variety_Setosa)", 3.0, 0.013333, 1.0], ["(sepalwidth_(4.16, 4.4])", "(variety_Setosa)", 3.0, 0.013333, 1.0], ["(sepallength_(5.38, 5.74], sepalwidth_(4.16, 4.4])", "(variety_Setosa)", 3.0, 0.013333, 1.0], ["(sepalwidth_(4.16, 4.4], petallength_(0.994, 1.59])", "(variety_Setosa)", 3.0, 0.013333, 1.0], ["(sepalwidth_(2.24, 2.48], petallength_(3.95, 4.54])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepalwidth_(2.24, 2.48], sepallength_(4.66, 5.02])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepalwidth_(2.24, 2.48], petallength_(3.36, 3.95])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepallength_(5.38, 5.74], petalwidth_(1.3, 1.54])", "(sepalwidth_(2.96, 3.2])", 3.0, 0.013333, 1.0], ["(sepallength_(5.38, 5.74], petalwidth_(1.3, 1.54])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepallength_(6.82, 7.18], petalwidth_(1.3, 1.54])", "(sepalwidth_(2.96, 3.2])", 3.0, 0.013333, 1.0], ["(sepallength_(6.82, 7.18], petalwidth_(1.3, 1.54])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepallength_(6.82, 7.18], variety_Versicolor)", "(sepalwidth_(2.96, 3.2])", 3.0, 0.013333, 1.0], ["(sepallength_(6.82, 7.18], petalwidth_(2.02, 2.26])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(sepallength_(6.82, 7.18], petalwidth_(2.02, 2.26])", "(sepalwidth_(2.96, 3.2])", 3.0, 0.013333, 1.0], ["(sepallength_(6.82, 7.18], petalwidth_(2.26, 2.5])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(sepallength_(6.82, 7.18], petalwidth_(2.26, 2.5])", "(sepalwidth_(2.96, 3.2])", 3.0, 0.013333, 1.0], ["(sepallength_(6.82, 7.18], petallength_(5.13, 5.72])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(sepallength_(6.82, 7.18], petallength_(5.13, 5.72])", "(sepalwidth_(2.96, 3.2])", 3.0, 0.013333, 1.0], ["(petallength_(4.54, 5.13], petalwidth_(1.06, 1.3])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepalwidth_(2.96, 3.2], petalwidth_(1.06, 1.3])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepallength_(6.46, 6.82], petallength_(3.95, 4.54])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepallength_(6.46, 6.82], petallength_(3.95, 4.54])", "(sepalwidth_(2.96, 3.2])", 3.0, 0.013333, 1.0], ["(sepalwidth_(3.2, 3.44], petalwidth_(1.54, 1.78])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepallength_(5.74, 6.1], petalwidth_(1.54, 1.78])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepallength_(5.74, 6.1], petalwidth_(0.82, 1.06])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(petallength_(3.95, 4.54], petalwidth_(0.82, 1.06])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepalwidth_(2.48, 2.72], petalwidth_(0.82, 1.06])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepallength_(5.38, 5.74], petalwidth_(0.82, 1.06])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(petallength_(2.77, 3.36], petalwidth_(0.82, 1.06])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(petallength_(2.77, 3.36], sepalwidth_(2.24, 2.48])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(petallength_(2.77, 3.36], sepallength_(4.66, 5.02])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepalwidth_(1.998, 2.24], petalwidth_(0.82, 1.06])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(petallength_(3.95, 4.54], sepalwidth_(1.998, 2.24])", "(variety_Versicolor)", 3.0, 0.013333, 1.0], ["(sepallength_(5.38, 5.74], petalwidth_(1.78, 2.02])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(petallength_(4.54, 5.13], petalwidth_(2.26, 2.5])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(petallength_(5.72, 6.31], sepalwidth_(2.72, 2.96])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(petallength_(5.72, 6.31], petalwidth_(2.02, 2.26])", "(sepalwidth_(2.96, 3.2])", 3.0, 0.013333, 1.0], ["(petallength_(5.72, 6.31], petalwidth_(2.02, 2.26])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(sepallength_(6.1, 6.46], petalwidth_(2.02, 2.26])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(petalwidth_(2.02, 2.26], sepalwidth_(2.72, 2.96])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(petallength_(5.13, 5.72], sepalwidth_(2.48, 2.72])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(petalwidth_(2.02, 2.26], sepallength_(7.54, 7.9])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(sepalwidth_(2.96, 3.2], sepallength_(7.54, 7.9])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(sepallength_(7.54, 7.9], sepalwidth_(3.68, 3.92])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(petalwidth_(2.26, 2.5], sepallength_(7.54, 7.9])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(petalwidth_(1.78, 2.02], sepallength_(7.54, 7.9])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(petalwidth_(2.02, 2.26], petallength_(6.31, 6.9])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(sepalwidth_(3.68, 3.92], petallength_(6.31, 6.9])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(petalwidth_(1.78, 2.02], petallength_(6.31, 6.9])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(sepalwidth_(2.72, 2.96], sepallength_(7.18, 7.54])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(sepalwidth_(2.96, 3.2], sepallength_(7.18, 7.54])", "(variety_Virginica)", 3.0, 0.013333, 1.0], ["(sepalwidth_(1.998, 2.24])", "(variety_Versicolor, petallength_(3.95, 4.54])", 3.0, 0.013333, 0.5], ["(sepalwidth_(3.44, 3.68])", "(petalwidth_(0.0976, 0.34])", 2.926829, 0.053333, 0.8], ["(sepalwidth_(3.44, 3.68])", "(petalwidth_(0.0976, 0.34], variety_Setosa)", 2.926829, 0.053333, 0.8], ["(sepalwidth_(3.2, 3.44], sepallength_(4.66, 5.02])", "(petalwidth_(0.0976, 0.34])", 2.926829, 0.026667, 0.8], ["(petallength_(3.95, 4.54])", "(variety_Versicolor)", 2.884615, 0.166667, 0.961538], ["(variety_Versicolor)", "(petallength_(3.95, 4.54])", 2.884615, 0.166667, 0.5], ["(sepallength_(5.38, 5.74], sepalwidth_(2.48, 2.72])", "(petallength_(3.95, 4.54])", 2.884615, 0.02, 0.5], ["(sepallength_(6.1, 6.46], petalwidth_(1.3, 1.54])", "(petallength_(3.95, 4.54])", 2.884615, 0.013333, 0.5], ["(sepallength_(5.74, 6.1], petalwidth_(1.06, 1.3])", "(petallength_(3.95, 4.54])", 2.884615, 0.013333, 0.5], ["(sepalwidth_(1.998, 2.24])", "(petallength_(3.95, 4.54])", 2.884615, 0.013333, 0.5]];

        // Define the dt_args
        let dt_args = {"layout": {"topStart": "pageLength", "topEnd": "search", "bottomStart": "info", "bottomEnd": "paging"}, "order": [], "warn_on_selected_rows_not_rendered": true};
        dt_args["data"] = data;

        
        new DataTable(table, dt_args);
    });
</script>
```

:::
:::


::: {#48a999f6986268ad .cell execution_count=10}

::: {.cell-output .cell-output-display .cell-output-markdown}
## Attribute importance
:::

::: {.cell-output .cell-output-display}
![](discovery_dataset_4_task_1_exec_files/figure-html/cell-11-output-2.png){}
:::
:::



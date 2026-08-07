import networkx as nx
import numpy as np
import pandas as pd
from emag_reports.discovery import survival_export_surv_plot
from emag_reports.preprocess.preprocess import preprocess_survival_data
from matplotlib import pyplot as plt
from sksurv.compare import compare_survival
from sksurv.nonparametric import kaplan_meier_estimator
from sksurv.tree import SurvivalTree
from sksurv.util import Surv


def plot_kaplan_meier(df, event_col, time_col, confidence_type, group_col=None):
    """
    Plot the Kaplan-Meier estimator for survival analysis.

    Parameters:
        df (pandas.DataFrame): The input DataFrame containing the survival data.
        event_col (str): The name of the column in `df` indicating the event (e.g., death) occurrence.
        time_col (str): The name of the column in `df` indicating the time of the event.
        confidence_type (str): The type of confidence interval to use for the estimator.
        group_col (str, optional): The name of the column in `df` indicating the groups to compare. Default is None.

    Returns:
        None
    """

    fig = plt.figure()
    fig.set_size_inches(12, 6)

    if group_col:
        # Plot for each sub-condition
        for value in df[group_col].unique():
            mask = df[group_col] == value
            time, survival_prob, conf_int = kaplan_meier_estimator(
                df[event_col].astype(bool)[mask],
                df[time_col][mask],
                conf_type=confidence_type
            )
            plt.step(time, survival_prob, where="post",
                     label=f"{value} (n = {mask.sum()})")
            plt.fill_between(
                time, conf_int[0], conf_int[1], alpha=0.25, step="post")
    else:
        # Calculate and plot the Kaplan-Meier estimator for the entire dataset
        time, survival_prob, conf_int = kaplan_meier_estimator(
            df[event_col].astype(bool),
            df[time_col],
            conf_type=confidence_type
        )
        plt.step(time, survival_prob, where="post")
        plt.fill_between(time, conf_int[0],
                         conf_int[1], alpha=0.25, step="post")

    plt.ylim(0, 1)
    plt.ylabel(r"est. probability of survival $\hat{S}(t)$")
    plt.xlabel("time $t$")
    if group_col:
        plt.legend(loc="best")
    plt.show(fig)


def plot_survival_by_condition(df, event_col, group_col):
    """
    Plots the survival by condition based on the given DataFrame and column names.

    Parameters:
        df (pandas.DataFrame): The input DataFrame containing the data.
        event_col (str): The name of the column in `df` indicating the event (e.g., death) occurrence.
        group_col (str): The name of the column representing the condition/group.

    Returns:
        None
    """
    # Make a copy of the DataFrame
    df_copy = df.copy()
    # Count the number of occurrences of survival events by condition
    survival_counts = df_copy.groupby(
        [group_col, event_col], observed=True).size().unstack(fill_value=0)

    # 0 - event did not occur, 1 - event occurred
    survival_counts.columns = ['censored', 'event occurred']

    # Plot
    fig, ax = plt.subplots()
    fig.set_size_inches(12, 6)
    survival_counts.plot(ax=ax, kind='bar', stacked=True,
                         color=['#20B2AA', '#FF4900'])

    # Number of occurrences in the center of the bars
    for p in ax.patches:
        width, height = p.get_width(), p.get_height()
        x, y = p.get_xy()
        if height > 0:
            ax.text(
                x + width/2,
                y + height/2,
                '{:.0f}'.format(height),
                horizontalalignment='center',
                verticalalignment='center'
            )

    ax.set_xlabel(group_col)
    ax.set_ylabel('Count')
    ax.set_title(f'Survival by {group_col}')
    plt.xticks(rotation=45)
    plt.legend(title=f'{event_col}', loc='best')
    plt.show(fig)


def compare_condition(df, event_col, time_col, group_col):
    """
    Function runs statistical test to determine if there is a significant difference
    between survival curves of different groups. According to the null hypothesis,
    if the p-value is less than the significance level (e.g., 0.05), the null hypothesis
    can be rejected, and it can be concluded that there is a significant difference
    between the survival curves of different groups.

    Parameters:
        df (pandas.DataFrame): The input DataFrame containing the survival data.
        event_col (str): The name of the column representing the event (e.g., death, failure).
        time_col (str): The name of the column representing the time to event.
        group_col (str): The name of the column representing the condition/group.

    Returns:
        None

    """
    # Prepare survival data
    y = Surv.from_dataframe(event_col, time_col, df)

    # Perform survival comparison between groups
    chi2, pvalue, stats, covariance = compare_survival(
        y, df[group_col], return_stats=True)

    # Generate and print report
    report = f"""
Survival Analysis Comparison Report
-----------------------------------
Condition Analyzed: {group_col}
Number of Groups: {df[group_col].unique().size}

Chi-squared Test Statistics: {chi2:.4f}
P-value: {pvalue:.4f}

Additional Statistics:
{stats}

Covariance Matrix:
{covariance}
"""
    print(report.strip())


def plot_kaplan_meier_grid(df, event_col, time_col, ax, node, confidence_type):
    """
    Plot the Kaplan-Meier estimator with confidence intervals on a grid.

    Parameters:
        df (pandas.DataFrame): DataFrame containing the survival data.
        event_col (str): Column name for the event indicator (e.g., whether an event occurred).
        time_col (str): Column name for the time variable (e.g., time to event).
        ax (matplotlib.axes.Axes): Axes object to plot the Kaplan-Meier estimator on.
        node (int): Node identifier for the plot.
        confidence_type (str): Type of confidence interval to calculate.

    Returns:
        None
    """

    # Calculate the Kaplan-Meier estimator
    time, survival_prob, conf_int = kaplan_meier_estimator(
        df[event_col].astype(bool),
        df[time_col],
        conf_type=confidence_type
    )
    # Plot
    ax.step(time, survival_prob, where="post")
    ax.fill_between(time, conf_int[0], conf_int[1], alpha=0.25, step="post")
    ax.set_ylim(0, 1)
    ax.text(.5, .85, f"# {node}",
            horizontalalignment='center', transform=ax.transAxes)


def plot_survival_tree_with_kaplan_meier(clf, df, X, grouped_nodes_leaves_df, event_col, time_col, confidence_type):
    """
    Plot survival tree with Kaplan-Meier curves for each node/leaf.

    Parameters:
        clf (object): The survival tree classifier.
        df (pandas.DataFrame): The dataset containing the survival data.
        X (pandas.DataFrame): The input features for the survival tree.
        grouped_nodes_leaves_df (pandas.DataFrame): The dataframe containing the grouped nodes and leaves information.

    Returns:
        None

    """

    # Get the node indicator and leaf IDs
    node_indicator = clf.decision_path(X.values)

    # Initialize a directed graph
    G = nx.DiGraph()

    # Build the graph and collect paths
    for sample_id in range(node_indicator.shape[0]):
        path = node_indicator.indices[node_indicator.indptr[sample_id]                                      :node_indicator.indptr[sample_id + 1]]
        G.add_edges_from(zip(path, path[1:]))

    # Use a tree layout to visualize the graph
    pos = nx.nx_agraph.graphviz_layout(G, prog='dot')

    # Adjust positions to relative and create the figure
    fig, ax = plt.subplots(figsize=(7, 5))
    x_min, x_max = 200, 480
    y_min, y_max = 200, 390  # higher 2nd value to make the plot more compact

    # Adjust node positions to relative and draw Kaplan-Meier plots for each node
    for node_id, (x, y) in pos.items():
        x_rel, y_rel = (x - x_min) / (x_max - x_min), (y -
                                                       y_min) / (y_max - y_min)
        inset_ax = fig.add_axes([x_rel, y_rel, 0.2, 0.2])
        samples = grouped_nodes_leaves_df[grouped_nodes_leaves_df['ID']
                                          == node_id]['Sample ID'].values[0]
        dataset = df.iloc[samples]
        plot_kaplan_meier_grid(dataset, event_col, time_col,
                               inset_ax, node_id, confidence_type=confidence_type)

    # Add edges to the graph in the middle of the nodes
    for (start_node, end_node) in G.edges():
        x1 = (pos[start_node][0] - x_min) / (x_max - x_min)
        y1 = (pos[start_node][1] - y_min) / (y_max - y_min)
        x2 = (pos[end_node][0] - x_min) / (x_max - x_min)
        y2 = (pos[end_node][1] - y_min) / (y_max - y_min)
        x_f, y_f = (x1 + x2) / 2, (y1 + y2) / 2

        inset_ax = fig.add_axes([x_f, y_f, 0.2, 0.2])
        nx.draw_networkx_edges(
            G,
            {start_node: (x1, y1),
             end_node: (x2, y2)},
            edgelist=[(start_node, end_node)],
            ax=inset_ax, arrows=True,
            edge_color='black',
            min_source_margin=30,
            min_target_margin=10,
            width=2
        )
        inset_ax.axis('off')

    # Hide the main axes
    ax.axis('off')
    plt.show(fig)


def plot_sample_comparison_CoxPH(model, X, samples):
    """
    Plots the comparison of survival functions for selected samples using the Cox proportional hazards model.

    Parameters:
    - model (object): The fitted Cox proportional hazards model.
    - X (pandas.DataFrame): The input data used for prediction.
    - samples (list): The indices of the samples to plot.

    Returns:
    - None

    """

    X_test = X.loc[samples]
    pred_surv = model.predict_survival_function(X_test)

    fig, ax = plt.subplots()
    fig.set_size_inches(12, 6)
    for i, surv_func in enumerate(pred_surv):
        plt.step(surv_func.x, surv_func.y, where="post",
                 label=f"Sample {samples[i]}")

    plt.ylabel(r"est. probability of survival $\hat{S}(t)$")
    plt.xlabel("time $t$")
    plt.legend(loc="best")
    plt.tight_layout()
    plt.show(fig)


def build_and_plot_survival_decision_tree(df, event_col, time_col, max_depth=None):
    """
    Builds and plots a survival decision tree based on the provided dataset. The function
    returns the trained survival decision tree classifier and a DataFrame containing information
    about the nodes and leaves of the tree.

    Parameters:
        df (pandas.DataFrame): The input dataset.
        event_col: Column name for the event indicator (e.g., whether an event occurred).
        time_col: Column name for the time variable (e.g., time to event).
        max_depth (int, optional): The maximum depth of the decision tree. Defaults to None.

    Returns:
        tuple: A tuple containing the trained survival decision tree classifier and a DataFrame
               containing information about the nodes and leaves of the tree.
    """

    # Encode dataset
    X_encoded, X_standardized, X, y = preprocess_survival_data(
        df, event_col, time_col)

    # Build survival decision tree
    clf_surv = SurvivalTree(max_depth=max_depth).fit(X_encoded.values, y)

    # Get the node indicator and leaf IDs
    node_indicator = clf_surv.decision_path(X_encoded.values)
    leaf_ids = clf_surv.apply(np.asarray(X_encoded, dtype=np.float32))

    # Prepare a list to collect data for nodes and leaves
    nodes_leaves_data = []

    # Iterate over each sample to collect node and leaf information
    for sample_id in range(len(X_encoded)):
        # Node path for the current sample
        node_index = node_indicator.indices[
            node_indicator.indptr[sample_id]:node_indicator.indptr[sample_id + 1]
        ]

        for node_id in node_index:
            node_type = 'Leaf' if node_id == leaf_ids[sample_id] else 'Node'
            nodes_leaves_data.append({
                'ID': node_id,
                'Sample ID': sample_id,
                'Type': node_type
            })

    # Create a DataFrame for nodes and leaves
    nodes_leaves_df = pd.DataFrame(nodes_leaves_data)

    # Group the DataFrame to list all samples for each ID
    grouped_nodes_leaves_df = (
        nodes_leaves_df.groupby(['ID', 'Type'])['Sample ID']
        .apply(list)
        .reset_index()
    )

    fig, ax = plt.subplots(figsize=(12, 6))
    survival_export_surv_plot.plot_tree(
        clf_surv,
        feature_names=X_encoded.columns,
        impurity=False,
        label="None",
        proportion=True,
        fontsize=10,
        node_ids=True,
    )
    plt.show(fig)
    return clf_surv, grouped_nodes_leaves_df

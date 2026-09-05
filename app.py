import streamlit as st
import pandas as pd
import plotly.express as px
from pathlib import Path

# PAGE CONFIG
st.set_page_config(page_title="PL 15/16 Analytics", layout="wide")

# LOAD DATA
@st.cache_data
def load_data():
    data_path = Path(__file__).resolve().parent / 'data' / 'player_stats_pl_15_16.csv'
    try:
        df = pd.read_csv(data_path)
    except FileNotFoundError:
        st.error(f"Dataset not found at {data_path}. Run the data-setup step first.")
        st.stop()
    except pd.errors.EmptyDataError:
        st.error(f"Dataset at {data_path} is empty.")
        st.stop()
    required = {'player', 'minutes_played', 'goals', 'xg', 'assists', 'xa',
                'goals_p90', 'xg_p90', 'assists_p90', 'xa_p90'}
    missing = required - set(df.columns)
    if missing:
        st.error(f"Dataset is missing required columns: {sorted(missing)}")
        st.stop()
    return df

df = load_data()

# SIDEBAR FILTERS
st.sidebar.header("Filters")
if df.empty:
    st.warning("No player rows in dataset.")
    st.stop()
max_minutes = pd.to_numeric(df['minutes_played'], errors='coerce').max()
if pd.isna(max_minutes):
    st.error("Column 'minutes_played' has no numeric values.")
    st.stop()
min_min = st.sidebar.slider("Min Minutes", 0, int(max_minutes), 270)
teams = ['All'] + sorted(df['team'].unique().tolist()) if 'team' in df.columns else ['All']
# Note: team column not in current CSV, skip team filter for now

# FILTER DATA
filtered = df[df['minutes_played'] >= min_min].copy()

# TITLE
st.title("⚽ Premier League 2015/16 - Player Analytics")
st.caption("Data: StatsBomb Open Data | Built with Streamlit")

# METRICS ROW
col1, col2, col3, col4 = st.columns(4)
col1.metric("Players", len(filtered))
col2.metric("Total Goals", int(filtered['goals'].sum()) if not filtered.empty else 0)
total_xg = filtered['xg'].sum() if not filtered.empty else 0.0
col3.metric("Total xG", round(float(total_xg), 1) if pd.notna(total_xg) else 0.0)
avg_p90 = filtered['goals_p90'].mean() if not filtered.empty else float('nan')
col4.metric("Avg Goals p90", round(float(avg_p90), 2) if pd.notna(avg_p90) else 0.0)
if filtered.empty:
    st.warning("No players meet the minutes filter. Lower 'Min Minutes'.")
    st.stop()

# TABS
tab1, tab2, tab3 = st.tabs(["📊 Top Performers", "📈 Scatter Plot (xG vs Goals)", "📋 Full Table"])

with tab1:
    st.subheader("Top 20 by Selected Metric")
    metric = st.selectbox("Metric", ['goals', 'xg', 'assists', 'xa', 'goals_p90', 'xg_p90', 'assists_p90', 'xa_p90'])
    top20 = filtered.nlargest(20, metric)[['player', 'minutes_played', 'goals', 'xg', 'assists', 'xa', 'goals_p90', 'xg_p90']]
    st.dataframe(top20.style.format({'xg': '{:.2f}', 'xa': '{:.2f}', 'goals_p90': '{:.2f}', 'xg_p90': '{:.2f}'}), use_container_width=True)

with tab2:
    st.subheader("Goals vs xG (Min 270 mins)")
    scatter_df = filtered[filtered['minutes_played'] >= 270]
    if scatter_df.empty:
        st.info("No players with >= 270 minutes in the current filter.")
    else:
        fig = px.scatter(scatter_df, x='xg', y='goals', hover_data=['player', 'minutes_played'], 
                         size='minutes_played', color='goals_p90', color_continuous_scale='Viridis',
                         labels={'xg': 'Expected Goals (xG)', 'goals': 'Actual Goals'})
        xg_max = pd.to_numeric(scatter_df['xg'], errors='coerce').max()
        if pd.notna(xg_max) and float(xg_max) > 0:
            fig.add_shape(type='line', x0=0, y0=0, x1=float(xg_max), y1=float(xg_max), 
                          line=dict(dash='dash', color='red'), name='xG = Goals')
        st.plotly_chart(fig, use_container_width=True)

with tab3:
    st.subheader("All Players (Filtered)")
    st.dataframe(filtered.sort_values('minutes_played', ascending=False).style.format({
        'xg': '{:.2f}', 'xa': '{:.2f}', 'goals_p90': '{:.2f}', 'xg_p90': '{:.2f}', 'assists_p90': '{:.2f}', 'xa_p90': '{:.2f}'
    }), use_container_width=True, height=600)

# FOOTER
st.markdown("---")
st.markdown("*Per 90 metrics only for players with > 0 minutes.*")
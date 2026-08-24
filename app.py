import streamlit as st
import pandas as pd
import plotly.express as px

# PAGE CONFIG
st.set_page_config(page_title="PL 15/16 Analytics", layout="wide")

# LOAD DATA
@st.cache_data
def load_data():
    df = pd.read_csv('data/player_stats_pl_15_16.csv')
    return df

df = load_data()

# SIDEBAR FILTERS
st.sidebar.header("Filters")
min_min = st.sidebar.slider("Min Minutes", 0, int(df['minutes_played'].max()), 270)
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
col2.metric("Total Goals", int(filtered['goals'].sum()))
col3.metric("Total xG", round(filtered['xg'].sum(), 1))
col4.metric("Avg Goals p90", round(filtered['goals_p90'].mean(), 2))

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
    fig = px.scatter(scatter_df, x='xg', y='goals', hover_data=['player', 'minutes_played'], 
                     size='minutes_played', color='goals_p90', color_continuous_scale='Viridis',
                     labels={'xg': 'Expected Goals (xG)', 'goals': 'Actual Goals'})
    fig.add_shape(type='line', x0=0, y0=0, x1=scatter_df['xg'].max(), y1=scatter_df['xg'].max(), 
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
#!/usr/bin/env python3
import os
import sys
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, RunReportRequest

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

KEY_FILE = r"c:\kigyou-list\google_credentials.json"
PROPERTY_ID = "520578712"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = KEY_FILE

client = BetaAnalyticsDataClient()

print("--- QUERY 1: newVsReturning ---")
req1 = RunReportRequest(
    property=f"properties/{PROPERTY_ID}",
    dimensions=[Dimension(name="newVsReturning")],
    metrics=[
        Metric(name="activeUsers"),
        Metric(name="sessions"),
        Metric(name="averageSessionDuration"),
        Metric(name="userEngagementDuration")
    ],
    date_ranges=[DateRange(start_date="365daysAgo", end_date="today")]
)
resp1 = client.run_report(req1)
for r in resp1.rows:
    user_type = r.dimension_values[0].value
    users = r.metric_values[0].value
    sessions = r.metric_values[1].value
    avg_dur = float(r.metric_values[2].value)
    eng_dur = float(r.metric_values[3].value)
    print(f"Type: {user_type:<10} | Users: {users:<4} | Sessions: {sessions:<4} | Avg Duration: {avg_dur/60:.2f} min ({avg_dur:.0f}s) | Total Engaged: {eng_dur/60:.2f} min")

print("\n--- QUERY 2: date breakdown ---")
req2 = RunReportRequest(
    property=f"properties/{PROPERTY_ID}",
    dimensions=[Dimension(name="date")],
    metrics=[
        Metric(name="activeUsers"),
        Metric(name="sessions"),
        Metric(name="averageSessionDuration"),
        Metric(name="userEngagementDuration")
    ],
    date_ranges=[DateRange(start_date="365daysAgo", end_date="today")]
)
resp2 = client.run_report(req2)
for r in sorted(resp2.rows, key=lambda x: x.dimension_values[0].value):
    d = r.dimension_values[0].value
    users = r.metric_values[0].value
    sessions = r.metric_values[1].value
    avg_dur = float(r.metric_values[2].value)
    eng_dur = float(r.metric_values[3].value)
    print(f"Date: {d} | Users: {users:<2} | Sessions: {sessions:<2} | Avg Dur: {avg_dur/60:.1f} min | Engaged: {eng_dur/60:.1f} min")

print("\n--- QUERY 3: user engagement metrics ---")
req3 = RunReportRequest(
    property=f"properties/{PROPERTY_ID}",
    metrics=[
        Metric(name="activeUsers"),
        Metric(name="sessions"),
        Metric(name="engagedSessions"),
        Metric(name="engagementRate"),
        Metric(name="averageSessionDuration"),
        Metric(name="userEngagementDuration")
    ],
    date_ranges=[DateRange(start_date="365daysAgo", end_date="today")]
)
resp3 = client.run_report(req3)
if resp3.rows:
    row = resp3.rows[0]
    print(f"Active Users:             {row.metric_values[0].value}")
    print(f"Total Sessions:           {row.metric_values[1].value}")
    print(f"Engaged Sessions:         {row.metric_values[2].value}")
    print(f"Engagement Rate:          {float(row.metric_values[3].value)*100:.1f}%")
    avg_sec = float(row.metric_values[4].value)
    print(f"Average Session Duration: {avg_sec/60:.2f} min ({avg_sec:.1f}s)")
    total_eng = float(row.metric_values[5].value)
    print(f"Total Engagement Time:    {total_eng/60:.1f} min ({total_eng/3600:.2f} hours)")

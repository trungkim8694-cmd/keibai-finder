import requests, json

repo="trungkim8694-cmd/keibai-finder"
url=f"https://api.github.com/repos/{repo}/actions/runs?status=failure&per_page=2"

runsResp = requests.get(url).json()
for run in runsResp.get("workflow_runs", []):
    print(f"\n=======================")
    print(f"Run ID: {run['id']} - Workflow: {run['name']}")
    jobUrl = run["jobs_url"]
    jobsResp = requests.get(jobUrl).json()
    for job in jobsResp.get("jobs", []):
        if job["conclusion"] == "failure":
             print(f"  Failed Job Name: {job['name']}")
             for step in job["steps"]:
                 if step["conclusion"] == "failure":
                     print(f"    Failed Step: {step['name']}")


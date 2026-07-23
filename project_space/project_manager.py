import json
import os
from datetime import date

PROJECTS_FILE = "project_space/projects.json"

def load_projects():
    if not os.path.exists(PROJECTS_FILE):
        return []
    with open(PROJECTS_FILE, "r") as f:
        return json.load(f)

def save_project(name, location=""):
    projects = load_projects()
    projects.append({
        "name": name,
        "location": location,
        "created": str(date.today()),
        "logs": []
    })
    with open(PROJECTS_FILE, "w") as f:
        json.dump(projects, f, indent=2)

def add_daily_log(project_name, work, notes, projects):
    for p in projects:
        if p["name"] == project_name:
            p["logs"].append({
                "date": str(date.today()),
                "work": work,
                "notes": notes
            })
    with open(PROJECTS_FILE, "w") as f:
        json.dump(projects, f, indent=2)

def get_project_logs(project_name, projects):
    for p in projects:
        if p["name"] == project_name:
            return p["logs"]
    return []
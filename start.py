import subprocess
import os

def run_python_app():
    python_app_path = "app.py"
    subprocess.Popen(["python", python_app_path])

def run_nodejs_project():
    subprocess.Popen(["npm", "start"], cwd="./scraper", shell=True)

if __name__ == "__main__":
    run_python_app()
    run_nodejs_project()

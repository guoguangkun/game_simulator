#!/bin/bash

# Start Elegant Clock H5 Project
echo "Starting Elegant Clock H5 Project..."
echo "Project will be available at: http://localhost:8080"
echo "Press Ctrl+C to stop the server"

cd workspace/dist
python3 -m http.server 8080
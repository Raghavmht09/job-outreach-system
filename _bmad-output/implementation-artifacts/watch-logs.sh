#!/bin/bash

# Watch server logs in real-time
# This helps debug issues during manual QA

TERMINAL_LOG="/Users/raghavmehta/.cursor/projects/Users-raghavmehta-Documents-job-outreach-system/terminals/1.txt"

echo "🔍 Watching server logs..."
echo "Press Ctrl+C to stop"
echo "================================"
echo ""

if [ -f "$TERMINAL_LOG" ]; then
    tail -f "$TERMINAL_LOG" | grep --line-buffered -E "(ERROR|WARN|INFO|POST|GET|⨯|Error)"
else
    echo "❌ Terminal log file not found: $TERMINAL_LOG"
    echo "Make sure the dev server is running."
    exit 1
fi


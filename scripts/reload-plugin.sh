#!/bin/bash
# Reload Figma plugin

osascript << 'APPLESCRIPT'
tell application "Figma"
    activate
end tell
delay 0.5

tell application "System Events"
    tell process "Figma"
        -- Close any open plugin window by pressing Escape twice
        key code 53
        delay 0.2
        key code 53
        delay 0.3
        
        -- Open Quick Actions (Cmd+/)
        keystroke "/" using {command down}
        delay 0.5
        
        -- Type plugin name and run
        keystroke "figma-use"
        delay 0.3
        keystroke return
    end tell
end tell
APPLESCRIPT

echo "Waiting for plugin to connect..."
sleep 2

#!/usr/bin/env bash
# Run on the Jetson after the DOFBOT arm stack is up (same ROS env as lesson launch).
set -euo pipefail

source /opt/ros/noetic/setup.bash

WORKSPACE=""
for d in "$HOME/catkin_ws" "$HOME/dofbot_ws" "$HOME/dofbot_catkin_ws"; do
  if [[ -f "$d/devel/setup.bash" ]]; then
    WORKSPACE="$d"
    break
  fi
done

if [[ -n "$WORKSPACE" ]]; then
  # shellcheck source=/dev/null
  source "$WORKSPACE/devel/setup.bash"
  echo "Sourced workspace: $WORKSPACE"
else
  echo "WARN: No devel/setup.bash found; rosbridge may not see arm topics."
  echo "      Start your Yahboom lesson launch first, or set WORKSPACE manually."
fi

if ! rospack find rosbridge_server >/dev/null 2>&1; then
  echo "Installing ros-noetic-rosbridge-server..."
  sudo apt-get update -qq
  sudo apt-get install -y ros-noetic-rosbridge-server
fi

echo "Starting rosbridge on port 9090 (Ctrl+C to stop)..."
exec roslaunch rosbridge_server rosbridge_websocket.launch

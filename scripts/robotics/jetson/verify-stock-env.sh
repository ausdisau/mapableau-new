#!/usr/bin/env bash
# Run on the Jetson (stock Yahboom DOFBOT image). Read-only checks for ROS MCP readiness.
set -euo pipefail

echo "=== DOFBOT stock environment check ==="
echo "Hostname: $(hostname)"
echo "ROS_DISTRO: ${ROS_DISTRO:-<unset>}"
if command -v lsb_release >/dev/null 2>&1; then
  lsb_release -ds || true
fi

if [[ "${ROS_DISTRO:-}" != "noetic" ]]; then
  echo "WARN: Expected ROS_DISTRO=noetic for stock DOFBOT Jetson Nano image."
fi

echo ""
echo "=== Workspace candidates ==="
for d in "$HOME/catkin_ws" "$HOME/dofbot_ws" "$HOME/dofbot_catkin_ws"; do
  if [[ -d "$d/devel" ]]; then
    echo "OK  $d/devel"
  elif [[ -d "$d" ]]; then
    echo "??  $d (no devel/ — build or source path may differ)"
  fi
done

echo ""
echo "=== ROS graph (requires roscore / lesson nodes) ==="
if command -v rosnode >/dev/null 2>&1; then
  rosnode list 2>/dev/null || echo "(no nodes — start Yahboom demo or roslaunch first)"
else
  echo "rosnode not in PATH; source /opt/ros/noetic/setup.bash"
fi

echo ""
echo "=== rosbridge package ==="
if dpkg -l ros-noetic-rosbridge-server 2>/dev/null | grep -q ^ii; then
  echo "OK  ros-noetic-rosbridge-server installed"
else
  echo "MISSING: sudo apt install ros-noetic-rosbridge-server"
fi

echo ""
echo "=== Network (rosbridge default 9090) ==="
if command -v ss >/dev/null 2>&1; then
  ss -tln | grep -E ':9090|:11311' || echo "(ports 9090/11311 not listening yet)"
fi

echo "Done."

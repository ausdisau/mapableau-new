# Robotics MCP

Cursor integration for **Yahboom DOFBOT** on **Jetson Nano 4GB (stock SD)** using [ros-mcp-server](https://github.com/robotmcp/ros-mcp-server) plus MapAble HITL governance tools.

## Quick start

1. Set `DOFBOT_JETSON_IP` in `.env` (see `.env.example`).
2. Enable MCP servers in Cursor (`.cursor/mcp.json`: `ros-mcp-server`, `mapable-robotics`).
3. On the Jetson: run arm lesson → `scripts/robotics/jetson/start-rosbridge-noetic.sh`.
4. In Cursor: connect via ros-mcp; use `mapable-robotics` tools before any motion.

Full guide: [docs/robotics-mcp.md](docs/robotics-mcp.md).

## Scripts (run on Jetson)

| Script | Purpose |
|--------|---------|
| `scripts/robotics/jetson/verify-stock-env.sh` | Check Noetic, workspace, rosbridge package |
| `scripts/robotics/jetson/start-rosbridge-noetic.sh` | Launch rosbridge on port 9090 |

## Library

`lib/robotics/governance.ts` — capability matrix and stock DOFBOT constants.

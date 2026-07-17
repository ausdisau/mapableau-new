# Robotics MCP (DOFBOT + Jetson Nano 4GB)

Connect Cursor to a **stock Yahboom DOFBOT** on **Jetson Nano 4GB** via [ros-mcp-server](https://github.com/robotmcp/ros-mcp-server), with MapAble **human-in-the-loop (HITL)** policy tools.

## Architecture

```text
[PC: Cursor]
  ├─ ros-mcp-server (uvx ros-mcp)     → ROS topics/services via WebSocket
  └─ mapable-robotics (repo MCP)      → HITL rules, stock setup, connection hints

[Jetson: stock Yahboom image]
  ├─ ROS 1 Noetic + prebuilt workspace
  ├─ Yahboom lesson launches (arm / vision)
  └─ rosbridge_server :9090
```

## Prerequisites

| Machine | Requirement |
|---------|-------------|
| **PC** | [uv](https://docs.astral.sh/uv/) (`curl -LsSf https://astral.sh/uv/install.sh \| sh`) |
| **Jetson** | Stock TF/SD, **01.First Trial** completed, arm demo works |
| **Network** | PC and Jetson on same LAN |

## 1. Cursor MCP (project config)

Committed in `.cursor/mcp.json`:

| Server | Role |
|--------|------|
| `ros-mcp-server` | ROS bridge (`uvx ros-mcp`) |
| `mapable-robotics` | HITL + DOFBOT stock hints (`npx tsx mcp/robotics/server.ts`) |

After pull:

1. **Settings → MCP** — enable both servers.
2. Copy `.env.example` → `.env` and set `DOFBOT_JETSON_IP` (Jetson LAN IP).
3. Reload the window if tools are missing.

## 2. Jetson (stock image)

On the robot:

```bash
# Verify (copy script or run inline)
bash scripts/robotics/jetson/verify-stock-env.sh

# Terminal 1: Yahboom desktop shortcut or lesson roslaunch (arm stack)

# Terminal 2: rosbridge (same workspace as arm)
bash scripts/robotics/jetson/start-rosbridge-noetic.sh
```

Confirm on device:

```bash
echo $ROS_DISTRO   # noetic
rosnode list       # nodes while demo runs
```

## 3. Connect from Cursor

Example prompts:

```
Use robotics_connection_hints and connect to DOFBOT via ros-mcp.
List topics and services only — no publishes until I approve.
```

```
robotics_get_dofbot_stock_setup — then connect to ws://<IP>:9090
```

## mapable-robotics tools

| Tool | Purpose |
|------|---------|
| `robotics_get_framework` | HITL rules + capability matrix |
| `robotics_get_dofbot_stock_setup` | Stock Nano 4GB / Noetic expectations |
| `robotics_assert_capability` | Deny e.g. `autonomous_motion_loop` |
| `robotics_connection_hints` | `ws://` URL from `DOFBOT_JETSON_IP` |

## Governance

- **Allowed:** observe graph, advisory service calls, motion publishes **after operator approval**.
- **Denied:** autonomous motion loops without a human present.
- Aligns with MapAble care/transport HITL patterns; **not** wired to NDIS booking APIs.

## Environment

| Variable | Used for |
|----------|----------|
| `DOFBOT_JETSON_IP` | `robotics_connection_hints`, setup tool |
| `ROBOTICS_ROSBRIDGE_PORT` | Optional override (default `9090`) |

## Run MCP manually

```bash
pnpm mcp:robotics
# External ROS MCP (requires uv on PATH):
uvx ros-mcp --transport=stdio
```

## References

- [Yahboom DOFBOT Jetson study](https://www.yahboom.net/study/Dofbot-Jetson_nano)
- [dofbot-jetson_nano (Noetic)](https://github.com/YahboomTechnology/dofbot-jetson_nano)
- [ros-mcp-server install](https://github.com/robotmcp/ros-mcp-server/blob/main/docs/install/installation.md)

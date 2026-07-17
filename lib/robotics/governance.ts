/**
 * Physical robotics automation boundaries for agent + MCP use.
 * Complements ros-mcp (ROS bridge); does not replace on-robot safety systems.
 */

export const ROBOTICS_FRAMEWORK_VERSION = "1.0.0";

export type RoboticsCapability =
  | "observe_ros_graph"
  | "call_ros_services_advisory"
  | "publish_motion_commands"
  | "autonomous_motion_loop";

export const ROBOTICS_CAPABILITY_MATRIX: Record<
  RoboticsCapability,
  { allowed: boolean; note: string }
> = {
  observe_ros_graph: {
    allowed: true,
    note: "List topics, services, parameters; subscribe read-only where needed.",
  },
  call_ros_services_advisory: {
    allowed: true,
    note: "Call Yahboom lesson services only after human confirms intent and workspace is sourced.",
  },
  publish_motion_commands: {
    allowed: true,
    note: "Requires explicit human approval per session; low speed; clear workspace.",
  },
  autonomous_motion_loop: {
    allowed: false,
    note: "No closed-loop agent motion without human operator present and armed.",
  },
};

export const ROBOTICS_HITL_RULES = [
  "Complete Yahboom 01.First Trial before rosbridge or MCP motion.",
  "Source the same ROS workspace as the running arm stack before starting rosbridge.",
  "Discovery first: list topics/services; do not publish until the operator approves.",
  "Never publish to unknown topics; prefer documented lesson launch files and services.",
  "One heavy workload at a time on Jetson Nano 4GB (vision OR exploration, not both).",
  "Keep emergency stop / power-off accessible; reduce servo speed for first MCP-driven moves.",
] as const;

export const DOFBOT_STOCK_JETSON_NANO = {
  platform: "Yahboom DOFBOT + Jetson Nano 4GB (B01)",
  expectedRosDistro: "noetic",
  expectedUbuntu: "20.04",
  rosbridgePort: 9090,
  rosMasterPort: 11311,
  studyUrl: "https://www.yahboom.net/study/Dofbot-Jetson_nano",
  repoUrl: "https://github.com/YahboomTechnology/dofbot-jetson_nano",
  workspaceCandidates: ["~/catkin_ws", "~/dofbot_ws"],
  rosbridgeLaunch:
    "roslaunch rosbridge_server rosbridge_websocket.launch",
  rosbridgePackage: "ros-noetic-rosbridge-server",
} as const;

export function assertRoboticsCapability(capability: RoboticsCapability): void {
  const entry = ROBOTICS_CAPABILITY_MATRIX[capability];
  if (!entry?.allowed) {
    throw new Error(`ROBOTICS_CAPABILITY_DENIED:${capability}`);
  }
}

export function buildRosbridgeWebSocketUrl(
  host: string,
  port = DOFBOT_STOCK_JETSON_NANO.rosbridgePort
): string {
  const trimmed = host.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `ws://${trimmed}:${port}`;
}

export function buildRosMasterUri(
  host: string,
  port = DOFBOT_STOCK_JETSON_NANO.rosMasterPort
): string {
  const trimmed = host.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `http://${trimmed}:${port}`;
}

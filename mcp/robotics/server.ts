#!/usr/bin/env npx tsx
/**
 * MapAble robotics MCP — HITL policy and DOFBOT stock Jetson Nano setup for use with ros-mcp-server.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  assertRoboticsCapability,
  buildRosbridgeWebSocketUrl,
  buildRosMasterUri,
  DOFBOT_STOCK_JETSON_NANO,
  ROBOTICS_CAPABILITY_MATRIX,
  ROBOTICS_FRAMEWORK_VERSION,
  ROBOTICS_HITL_RULES,
  type RoboticsCapability,
} from "../../lib/robotics";

const server = new McpServer({
  name: "mapable-robotics",
  version: ROBOTICS_FRAMEWORK_VERSION,
});

server.tool(
  "robotics_get_framework",
  "Returns MapAble robotics HITL rules and capability matrix (physical robots; use with ros-mcp-server for ROS I/O).",
  {},
  async () => ({
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            version: ROBOTICS_FRAMEWORK_VERSION,
            hitlRules: ROBOTICS_HITL_RULES,
            capabilities: ROBOTICS_CAPABILITY_MATRIX,
            externalRosMcp: {
              package: "ros-mcp",
              install: "uvx ros-mcp --transport=stdio",
              docs: "https://github.com/robotmcp/ros-mcp-server",
            },
          },
          null,
          2
        ),
      },
    ],
  })
);

server.tool(
  "robotics_get_dofbot_stock_setup",
  "Yahboom stock SD image: Jetson Nano 4GB + DOFBOT — expected Noetic, rosbridge, workspace paths, and lesson order.",
  {},
  async () => {
    const host = process.env.DOFBOT_JETSON_IP?.trim();
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              stock: DOFBOT_STOCK_JETSON_NANO,
              configuredHost: host ?? null,
              rosbridgeUrl: host
                ? buildRosbridgeWebSocketUrl(host)
                : "(set DOFBOT_JETSON_IP in .env)",
              rosMasterUri: host
                ? buildRosMasterUri(host)
                : "(set DOFBOT_JETSON_IP in .env)",
              lessonOrder: [
                "00 Must read",
                "01 First Trial (network, arm demo)",
                "15 ROS basic course (before MCP motion)",
              ],
              verifyOnDevice: [
                "echo $ROS_DISTRO   # expect noetic",
                "ls ~ | grep -E 'catkin|dofbot|ws'",
                "rosnode list       # after a lesson launch",
              ],
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "robotics_assert_capability",
  "Checks whether a robotics capability is permitted (throws policy denial for disallowed capabilities).",
  {
    capability: z
      .enum([
        "observe_ros_graph",
        "call_ros_services_advisory",
        "publish_motion_commands",
        "autonomous_motion_loop",
      ])
      .describe("Requested agent capability"),
  },
  async ({ capability }) => {
    try {
      assertRoboticsCapability(capability as RoboticsCapability);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              capability,
              allowed: true,
              note: ROBOTICS_CAPABILITY_MATRIX[capability as RoboticsCapability].note,
            }),
          },
        ],
      };
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              capability,
              allowed: false,
              note: ROBOTICS_CAPABILITY_MATRIX[capability as RoboticsCapability].note,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "robotics_connection_hints",
  "Returns rosbridge / ROS_MASTER_URI hints for the configured Jetson IP (from DOFBOT_JETSON_IP).",
  {
    jetsonIp: z
      .string()
      .optional()
      .describe("Override DOFBOT_JETSON_IP env for this call"),
  },
  async ({ jetsonIp }) => {
    const host =
      jetsonIp?.trim() || process.env.DOFBOT_JETSON_IP?.trim() || "";
    if (!host) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: "Set DOFBOT_JETSON_IP in .env or pass jetsonIp",
              exampleEnv: "DOFBOT_JETSON_IP=192.168.1.120",
            }),
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              jetsonIp: host,
              rosbridgeWebSocket: buildRosbridgeWebSocketUrl(host),
              rosMasterUri: buildRosMasterUri(host),
              cursorPromptExample: `Connect to the robot on ${host} using ros-mcp and list topics and services. Read-only until I approve motion.`,
              jetsonScripts: {
                verify: "scripts/robotics/jetson/verify-stock-env.sh",
                rosbridge: "scripts/robotics/jetson/start-rosbridge-noetic.sh",
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("mapable-robotics MCP server failed:", err);
  process.exit(1);
});

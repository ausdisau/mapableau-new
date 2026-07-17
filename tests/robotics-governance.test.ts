import { describe, expect, it } from "vitest";

import {
  assertRoboticsCapability,
  buildRosbridgeWebSocketUrl,
  DOFBOT_STOCK_JETSON_NANO,
  ROBOTICS_CAPABILITY_MATRIX,
} from "@/lib/robotics";

describe("robotics governance", () => {
  it("denies autonomous motion loop", () => {
    expect(ROBOTICS_CAPABILITY_MATRIX.autonomous_motion_loop.allowed).toBe(false);
    expect(() => assertRoboticsCapability("autonomous_motion_loop")).toThrow(
      /ROBOTICS_CAPABILITY_DENIED/
    );
  });

  it("allows observe_ros_graph", () => {
    expect(() => assertRoboticsCapability("observe_ros_graph")).not.toThrow();
  });

  it("builds rosbridge URL for stock port", () => {
    expect(buildRosbridgeWebSocketUrl("192.168.1.50")).toBe(
      `ws://192.168.1.50:${DOFBOT_STOCK_JETSON_NANO.rosbridgePort}`
    );
  });

  it("expects noetic on stock DOFBOT profile", () => {
    expect(DOFBOT_STOCK_JETSON_NANO.expectedRosDistro).toBe("noetic");
  });
});

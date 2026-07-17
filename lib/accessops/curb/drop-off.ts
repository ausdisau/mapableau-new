export function isAccessibleDropOff(zoneType: string): boolean {
  return (
    zoneType === "accessible_drop_off" || zoneType === "accessible_pick_up"
  );
}

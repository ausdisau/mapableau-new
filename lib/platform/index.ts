export { MODULE_DYNAMIC_LITERAL, MODULE_MAIN_CLASS } from "@/lib/platform/constants";
export {
  getProductModule,
  modulesByShell,
  PRODUCT_MODULES,
} from "@/lib/platform/modules";
export {
  CARE_NAV_LINKS,
  DRIVER_NAV_LINKS,
  EMPLOYER_NAV_LINKS,
  PORTAL_MODULES,
  PROVIDER_NAV_LINKS,
  WORKER_NAV_LINKS,
} from "@/lib/platform/portal-nav";
export type { ModuleShell, PortalModuleConfig, ProductModule } from "@/lib/platform/types";
export { CoreModuleLayout } from "@/lib/platform/layouts";
export {
  getModuleByKey,
  getModuleIcon,
  mainModule,
  moduleIcons,
  modules,
  type IconStyle,
  type MapAbleModule,
  type ModuleIcons,
} from "@/lib/platform/modules-catalog";

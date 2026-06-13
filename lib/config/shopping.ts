export const shoppingConfig = {
  enabled: process.env.SHOPPING_ENABLED === "true",
};

export function isShoppingEnabled(): boolean {
  return shoppingConfig.enabled;
}

import Link from "next/link";

import { FoodProductCard, type FoodProductCardProps } from "./FoodProductCard";

export function MealProductCard(props: FoodProductCardProps) {
  const href = props.href ?? `/foods/meals/${props.id}`;
  return <FoodProductCard {...props} href={href} />;
}

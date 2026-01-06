import React from "react";
import { Body } from "./UI";

export default function RecommendationWhy({ reasons }: { reasons: string[] }) {
  if (!reasons?.length) return null;
  return <Body muted>Because: {reasons.join(", ")}</Body>;
}

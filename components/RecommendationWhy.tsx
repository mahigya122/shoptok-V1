import React from "react";
import { Body } from "./UI";

interface RecommendationWhyProps {
  reasons?: string[];
}

export default function RecommendationWhy({ reasons }: RecommendationWhyProps) {
  if (!reasons?.length) return null;
  return <Body muted>Because: {reasons.join(", ")}</Body>;
}

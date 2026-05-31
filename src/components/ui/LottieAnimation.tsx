"use client";

import React from "react";
import Lottie from "lottie-react";

interface LottieAnimationProps {
  animationData: any;
  className?: string;
  loop?: boolean;
}

export default function LottieAnimation({ animationData, className, loop = true }: LottieAnimationProps) {
  return (
    <div className={className}>
      <Lottie 
        animationData={animationData} 
        loop={loop}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

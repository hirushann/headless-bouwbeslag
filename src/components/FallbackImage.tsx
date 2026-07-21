"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface FallbackImageProps extends ImageProps {
  fallbackSrc?: string;
}

export default function FallbackImage({ src, fallbackSrc = "/default-fallback-image.webp", ...rest }: FallbackImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...rest}
      src={imgSrc}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
      fetchPriority={rest.priority ? "high" : "low"}
    />
  );
}

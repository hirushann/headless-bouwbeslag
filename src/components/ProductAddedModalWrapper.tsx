"use client";

import dynamic from "next/dynamic";

const ProductAddedModal = dynamic(() => import("./ProductAddedModal"), { ssr: false });

export default function ProductAddedModalWrapper() {
  return <ProductAddedModal />;
}

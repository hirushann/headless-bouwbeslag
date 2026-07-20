"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useProductAddedModal } from "@/context/ProductAddedModalContext";

const ProductAddedModal = dynamic(() => import("./ProductAddedModal"), { ssr: false });

export default function ProductAddedModalWrapper() {
  const { isOpen } = useProductAddedModal();
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  return hasOpened ? <ProductAddedModal /> : null;
}

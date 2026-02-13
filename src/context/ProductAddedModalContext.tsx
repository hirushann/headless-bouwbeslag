"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ModalData {
  product: any;
  quantity: number;
  totalPrice?: number; // Optional, can be calculated or passed
  currency?: string;
  userRole?: string[]; // To determine tax display
  musthaveprodKeys?: any[]; // Recommendations
  matchingProducts?: any[];
  matchingKnobroseKeys?: any[];
  matchingRoseKeys?: any[];
  pcroseKeys?: any[];
  blindtoiletroseKeys?: any[];
  deliveryText?: string;
  deliveryType?: string;
  hasLengthFreight?: boolean;
}

interface ProductAddedModalContextType {
  isOpen: boolean;
  openModal: (data: ModalData) => void;
  closeModal: () => void;
  modalData: ModalData | null;
}

const ProductAddedModalContext = createContext<ProductAddedModalContextType | undefined>(undefined);

export const ProductAddedModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  const openModal = (data: ModalData) => {
    setModalData(data);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Optional: clear data after animation defined in the component
  };

  return (
    <ProductAddedModalContext.Provider value={{ isOpen, openModal, closeModal, modalData }}>
      {children}
    </ProductAddedModalContext.Provider>
  );
};

export const useProductAddedModal = () => {
  const context = useContext(ProductAddedModalContext);
  if (!context) {
    throw new Error("useProductAddedModal must be used within a ProductAddedModalProvider");
  }
  return context;
};

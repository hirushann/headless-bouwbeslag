import React from "react";
import Header from "@/components/Header";
import { getShippingSettings, getShippingRules } from "@/lib/woocommerce";

export default async function HeaderWrapper() {
  const shippingSettings = await getShippingSettings();
  const shippingRules = await getShippingRules();

  return (
    <Header 
      shippingMethods={shippingSettings} 
      shippingRules={shippingRules} 
    />
  );
}

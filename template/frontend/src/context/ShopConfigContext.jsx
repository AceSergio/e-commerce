import React, { createContext, useContext } from 'react';
import shopConfig from '../config/shop.config';

const ShopConfigContext = createContext(shopConfig);

export function ShopConfigProvider({ children, customConfig }) {
  const config = customConfig || shopConfig;

  return (
    <ShopConfigContext.Provider value={config}>
      {children}
    </ShopConfigContext.Provider>
  );
}

export function useShopConfig() {
  const context = useContext(ShopConfigContext);
  if (!context) {
    return shopConfig;
  }
  return context;
}

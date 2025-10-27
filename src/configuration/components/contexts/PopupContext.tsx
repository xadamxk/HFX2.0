import React, { createContext, useContext, useMemo } from 'react';

interface PopupContextType {
  isPopup: boolean;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

interface PopupProviderProps {
  children: React.ReactNode;
}

export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
  // Memoize the popup detection to avoid recalculating on every render
  const isPopup = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('popup') === 'true';
  }, []); // Empty dependency array since URL doesn't change during component lifecycle

  const value = useMemo(() => ({
    isPopup
  }), [isPopup]);

  return (
    <PopupContext.Provider value={value}>
      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = (): PopupContextType => {
  const context = useContext(PopupContext);
  if (context === undefined) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};

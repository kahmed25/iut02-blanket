'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UserRole } from '../hooks/useRole';

interface RolePreviewContextType {
  previewRole: UserRole | null;
  isPreviewMode: boolean;
  setPreviewRole: (role: UserRole | null) => void;
  exitPreviewMode: () => void;
}

const RolePreviewContext = createContext<RolePreviewContextType | undefined>(undefined);

export function RolePreviewProvider({ children }: { children: ReactNode }) {
  const [previewRole, setPreviewRoleState] = useState<UserRole | null>(null);

  const setPreviewRole = useCallback((role: UserRole | null) => {
    setPreviewRoleState(role);
  }, []);

  const exitPreviewMode = useCallback(() => {
    setPreviewRoleState(null);
  }, []);

  const isPreviewMode = previewRole !== null;

  return (
    <RolePreviewContext.Provider
      value={{
        previewRole,
        isPreviewMode,
        setPreviewRole,
        exitPreviewMode,
      }}
    >
      {children}
    </RolePreviewContext.Provider>
  );
}

export function useRolePreview() {
  const context = useContext(RolePreviewContext);
  if (context === undefined) {
    throw new Error('useRolePreview must be used within a RolePreviewProvider');
  }
  return context;
}

export default RolePreviewContext;

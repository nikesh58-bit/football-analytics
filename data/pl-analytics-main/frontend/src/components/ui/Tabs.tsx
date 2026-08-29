'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

const TabsContext = createContext<{ value: string; onChange: (v: string) => void } | null>(null);

export function Tabs({ value, onValueChange, children, className }: { value: string; onValueChange: (v: string) => void; children: ReactNode; className?: string }) {
  return ( <TabsContext.Provider value={{ value, onChange: onValueChange }}> <div className={className} data-tabs>{children}</div> </TabsContext.Provider> );
}

export function TabList({ children, className }: { children: ReactNode; className?: string }) {
  return ( <div className={`${className} flex border-b border-slate-200`} role="tablist">{children}</div> );
}

export function TabTrigger({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const context = useContext(TabsContext); const isActive = context?.value === value;
  return ( <button role="tab" aria-selected={isActive} className={`${className} px-4 py-3 text-sm font-medium border-b-2 transition-colors ${isActive ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`} onClick={() => context?.onChange(value)}>{children}</button> );
}

export function TabContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const context = useContext(TabsContext); const isActive = context?.value === value;
  return ( <div role="tabpanel" className={`${className} ${isActive ? '' : 'hidden'}`}>{children}</div> );
}
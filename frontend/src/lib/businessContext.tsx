import React, { createContext, useContext, useState, useEffect } from 'react';
import { Business, listBusinesses } from './api';
import { useAuth } from './auth';

interface BusinessContextType {
  businesses: Business[];
  activeBusiness: Business | null;
  setActiveBusiness: (business: Business) => void;
  refreshBusinesses: () => Promise<Business[]>;
  loading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusinessState] = useState<Business | null>(() => {
    const saved = localStorage.getItem('active_business');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const setActiveBusiness = (business: Business) => {
    setActiveBusinessState(business);
    localStorage.setItem('active_business', JSON.stringify(business));
  };

  const refreshBusinesses = async (): Promise<Business[]> => {
    setLoading(true);
    try {
      const res = await listBusinesses();
      if (res.success && res.data) {
        setBusinesses(res.data);
        if (res.data.length > 0) {
          // If current active business isn't in list or doesn't exist, pick the latest business
          const savedId = activeBusiness?.id;
          const matched = res.data.find(b => b.id === savedId);
          if (matched) {
            // Update active business with latest data
            setActiveBusiness(matched);
          } else {
            // Default to latest created business (last element in array or highest ID)
            const latest = [...res.data].sort((a, b) => b.id - a.id)[0];
            setActiveBusiness(latest);
          }
        } else {
          setActiveBusinessState(null);
          localStorage.removeItem('active_business');
        }
        return res.data;
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    } finally {
      setLoading(false);
    }
    return [];
  };

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      refreshBusinesses();
      return;
    }

    setBusinesses([]);
    setActiveBusinessState(null);
    localStorage.removeItem('active_business');
    setLoading(false);
  }, [authLoading, user?.id]);

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        setActiveBusiness,
        refreshBusinesses,
        loading,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useActiveBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useActiveBusiness must be used within a BusinessProvider');
  }
  return context;
};

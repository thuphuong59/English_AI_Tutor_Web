"use client";

import { useState, useEffect } from 'react';

export const useAuthStatus = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Code này chỉ chạy sau khi component đã mount (Client-side)
    try {
      const storedUserId = localStorage.getItem('authenticatedUserId');
      setUserId(storedUserId);
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      setUserId(null); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { userId, isLoading };
};
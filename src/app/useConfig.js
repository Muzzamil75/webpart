'use client';

import { useState, useEffect } from 'react';

export const useConfig = () => {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/config.js'; 
    script.async = false;
    script.onload = () => {
      if (window.appConfigs) {
        setConfig(window.appConfigs);
        setIsLoading(false);
        setIsError(false)
      } else {
        console.error('Failed to load config from window.appConfigs');
        setIsLoading(false);
        setIsError(true)
      }
    };
    script.onerror = (err) => {
      console.error('Failed to load config.js:', err);
      setIsLoading(false);
      setIsError(true)
    };

    // Append the script to the head or body
    document.head.appendChild(script);
    // Clean up by removing the script when the component unmounts
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return { config, isLoading,isError };
};

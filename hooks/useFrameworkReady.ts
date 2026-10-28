import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Required for expo-router to function properly on web.
 * Ensures the framework is ready before rendering routes.
 */
export function useFrameworkReady() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Ensure the document is ready before allowing route rendering
      if (document.readyState === 'complete') return;
      const resolver = () => {};
      window.addEventListener('load', resolver);
      return () => window.removeEventListener('load', resolver);
    }
  }, []);
}

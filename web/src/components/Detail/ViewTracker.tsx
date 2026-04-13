'use client';

import { useEffect, useRef } from 'react';
import { incrementViewCount } from '@/actions/propertyActions';

export function ViewTracker({ id, label, image }: { id: string, label: string, image: string | undefined | null }) {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per mount using a ref to prevent strict-mode double firing
    if (tracked.current) return;
    tracked.current = true;

    try {
      const viewedKey = `viewed_${id}`;
      const lastViewed = localStorage.getItem(viewedKey);
      const now = Date.now();
      
      // Keibai History Logic (Max 20)
      const historyStr = localStorage.getItem('keibai_history') || '[]';
      let historyObj: any[] = [];
      try { historyObj = JSON.parse(historyStr); } catch(e){}
      
      // Remove existing if same ID
      historyObj = historyObj.filter(h => h.id !== id);
      // Add to front
      historyObj.unshift({ id, label: label || `物件 ${id}`, image: image || null, time: now });
      // Slice max 20
      if (historyObj.length > 20) historyObj = historyObj.slice(0, 20);
      localStorage.setItem('keibai_history', JSON.stringify(historyObj));

      // Check if viewed in the last 30 minutes (30 * 60 * 1000 = 1800000ms)
      if (!lastViewed || (now - parseInt(lastViewed, 10) > 1800000)) {
        // Not viewed recently, call server action
        incrementViewCount(id).catch(err => {
           console.error("Tracking Error:", err);
        });
        localStorage.setItem(viewedKey, now.toString());
      }
    } catch (e) {
      // Ignore localStorage errors (e.g., incognito)
    }
  }, [id, label, image]);

  return null;
}

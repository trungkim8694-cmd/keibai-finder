'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface CourtContactLinkProps {
  courtName?: string | null;
  contactUrl?: string | null;
  className?: string;
  theme?: 'blue' | 'red' | 'teal' | 'amber';
}

const THEME_CLASSES: Record<'blue' | 'red' | 'teal' | 'amber', { link: string; text: string }> = {
  blue: {
    link: '!text-blue-600 dark:!text-blue-400 hover:!text-blue-800 dark:hover:!text-blue-300',
    text: 'text-blue-600 dark:text-blue-400',
  },
  red: {
    link: '!text-red-700 dark:!text-red-400 hover:!text-red-800 dark:hover:!text-red-300',
    text: 'text-red-700 dark:text-red-400',
  },
  teal: {
    link: '!text-teal-700 dark:!text-teal-400 hover:!text-teal-800 dark:hover:!text-teal-300',
    text: 'text-teal-700 dark:text-teal-400',
  },
  amber: {
    link: '!text-amber-700 dark:!text-amber-400 hover:!text-amber-800 dark:hover:!text-amber-300',
    text: 'text-amber-700 dark:text-amber-400',
  },
};

/**
 * Shared component: Hiển thị tên Tòa án hoặc Cơ quan quản lý.
 * - Tự động dọn sạch ký tự xuống dòng và khoảng trắng dư thừa
 * - Nếu có contactUrl: render <a> tag với icon ExternalLink chuẩn Lucide
 * - Nếu không có: render text thuần
 */
export function CourtContactLink({ courtName, contactUrl, className = '', theme = 'blue' }: CourtContactLinkProps) {
  const cleanedName = courtName 
    ? courtName.split('\n').join('').replace(/\s+/g, ' ').trim()
    : '裁判所不明';
  const displayName = !cleanedName || cleanedName === 'Unknown' ? '裁判所不明' : cleanedName;

  const { link: colorClass, text: staticColorClass } = THEME_CLASSES[theme] || THEME_CLASSES.blue;

  if (contactUrl) {
    return (
      <a
        href={contactUrl}
        target="_blank"
        rel="nofollow noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-1 hover:underline underline-offset-2 transition-colors duration-150 ${colorClass} ${className}`}
      >
        <span>{displayName}</span>
        <ExternalLink className="w-3 h-3 opacity-75 shrink-0" />
      </a>
    );
  }

  return (
    <span className={`${staticColorClass} ${className}`}>
      {displayName}
    </span>
  );
}

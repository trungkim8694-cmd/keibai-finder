'use client';

interface CourtContactLinkProps {
  courtName?: string | null;
  contactUrl?: string | null;
  className?: string;
  theme?: 'blue' | 'red';
}

/**
 * Shared component: Hiển thị tên Tòa án hoặc Cơ quan.
 * - Nếu có contactUrl: render <a> tag với icon ↗, hover gạch chân + đổi màu
 * - Nếu không có: render text thuần như cũ
 */
export function CourtContactLink({ courtName, contactUrl, className = '', theme = 'blue' }: CourtContactLinkProps) {
  const displayName = !courtName || courtName === 'Unknown' ? '裁判所不明' : courtName;

  const colorClass = theme === 'red' 
    ? '!text-red-700 dark:!text-red-400 hover:!text-red-800 dark:hover:!text-red-300'
    : '!text-blue-600 dark:!text-blue-400 hover:!text-blue-800 dark:hover:!text-blue-300';
    
  const staticColorClass = theme === 'red' ? 'text-red-700 dark:text-red-400' : 'text-blue-600 dark:text-blue-400';

  if (contactUrl) {
    return (
      <a
        href={contactUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-0.5 hover:underline underline-offset-2 transition-colors duration-150 ${colorClass} ${className}`}
      >
        <span>{displayName}</span>
        <span className="text-[9px] opacity-70 leading-none mt-[1px]">↗</span>
      </a>
    );
  }

  return (
    <span className={`${staticColorClass} ${className}`}>
      {displayName}
    </span>
  );
}

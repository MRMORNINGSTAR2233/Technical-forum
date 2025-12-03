import Link from 'next/link';

interface TagBadgeProps {
  name: string;
  count?: number;
  href?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TagBadge({ name, count, href, size = 'md' }: TagBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const content = (
    <>
      <span>{name}</span>
      {count !== undefined && (
        <span className="ml-1 font-semibold text-gray-700">×{count}</span>
      )}
    </>
  );

  const className = `inline-flex items-center ${sizeClasses[size]} bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <span className={className}>{content}</span>;
}

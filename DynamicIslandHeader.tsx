import React from 'react';

interface DynamicIslandHeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const DynamicIslandHeader: React.FC<DynamicIslandHeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
}) => {
  return (
    <header className="relative z-20 w-full pt-[max(env(safe-area-inset-top),48px)] px-5 pb-3">
      <div className="flex items-center justify-between min-h-[44px]">
        <div className="flex items-center min-w-[40px]">
          {leftAction}
        </div>

        {title && (
          <div className="text-center flex-1 px-2 overflow-hidden">
            <h1 className="text-base font-semibold tracking-tight text-white truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-zinc-400 font-medium truncate">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end min-w-[40px]">
          {rightAction}
        </div>
      </div>
    </header>
  );
};

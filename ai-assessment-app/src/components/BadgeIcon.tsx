import React from 'react';

interface BadgeIconProps {
  children: React.ReactNode;
}

const BadgeIcon: React.FC<BadgeIconProps> = ({ children }) => {
  return (
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md">
      {children}
    </div>
  );
};

export default BadgeIcon;

import React from 'react';

interface CardProps {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children }) => {
  return (
    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
      {children}
    </div>
  );
};

export default Card;

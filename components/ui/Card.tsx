import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-2xl shadow-lg p-6 ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}
export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`mb-4 ${className}`}>
        {children}
    </div>
  )
}

interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
}
export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
    return (
        <h2 className={`text-2xl font-bold text-yellow-300 ${className}`}>
            {children}
        </h2>
    )
}

interface CardDescriptionProps {
    children: React.ReactNode;
    className?: string;
}
export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '' }) => {
    return (
        <p className={`text-sm text-gray-400 mt-1 ${className}`}>
            {children}
        </p>
    )
}


interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}
export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

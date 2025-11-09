import React from 'react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex flex-col items-start cursor-pointer transition-all duration-300 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/10 hover:-translate-y-1"
    >
      <div className="p-3 bg-gray-700 rounded-full mb-4">
        <Icon className="h-6 w-6 text-yellow-300" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 flex-grow">{description}</p>
    </div>
  );
};

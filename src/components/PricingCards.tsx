import React from 'react';

interface PricingCardProps {
  title: string;
  seats: string;
  price?: string;
  features: string[];
  isEnterprise?: boolean;
  onSelect: () => void;
  color: string;
  isFirst?: boolean;
  isLast?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  seats,
  price,
  features,
  isEnterprise,
  onSelect,
  color,
  isFirst,
  isLast,
}) => {
  return (
    <div className={`${color} p-8 text-white relative overflow-hidden flex-1 ${isFirst ? 'rounded-l-2xl' : ''} ${isLast ? 'rounded-r-2xl' : ''}`}>
      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-3xl font-bold mb-2">{title}</h3>
        <p className="text-white text-opacity-90 mb-6">{seats}</p>
        <p className="text-5xl font-bold mb-8 h-16 flex items-center">{price || 'Custom'}</p>
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="text-white text-opacity-90 flex items-start">
              <span className="mr-2">✨</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={onSelect}
          className="w-full bg-white bg-opacity-20 backdrop-blur-sm text-black py-3 rounded-lg hover:bg-opacity-30 transition-all font-medium border border-white border-opacity-30"
        >
          {isEnterprise ? 'Select Plan' : 'Select Plan'}
        </button>
      </div>
      <div className="absolute inset-0 from-white opacity-10"></div>
    </div>
  );
};
import React from 'react';

export default function FormCard({ 
  icon: Icon, 
  title, 
  iconBgColor = 'bg-blue-100', 
  iconColor = 'text-blue-600',
  children 
}) {
  return (
    <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <div className={`p-1.5 md:p-2 ${iconBgColor} rounded-lg`}>
          <Icon className={`w-4 h-4 md:w-5 md:h-5 ${iconColor}`} />
        </div>
        <h2 className="text-base md:text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}
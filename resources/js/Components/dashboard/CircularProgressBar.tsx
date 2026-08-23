import React from 'react';

export const CircularProgressBar = ({ percentage, total, present, absent }: { percentage: number; total: number; present: number; absent: number }) => {
  const radius = 120;
  const strokeWidth = 20;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="#f3f4f6"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            className="stroke-role"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-5xl font-bold text-role">{percentage}%</p>
          <p className="text-sm text-gray-500 mt-1">Present</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-8">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-700">{total}</p>
          <p className="text-sm text-gray-500 mt-1">Total Users</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-role">{present}</p>
          <p className="text-sm text-gray-500 mt-1">Present</p>
          <p className="text-sm text-gray-500">(With Late)</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-[#c53336]">{absent}</p>
          <p className="text-sm text-gray-500 mt-1">Absent</p>
        </div>
      </div>
    </div>
  );
};

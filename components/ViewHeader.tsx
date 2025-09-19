import React from 'react';

interface ViewHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const ViewHeader: React.FC<ViewHeaderProps> = ({ title, description, children }) => {
  return (
    <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-indigo-800">{title}</h1>
        {description && <p className="mt-2 text-indigo-700">{description}</p>}
      </div>
      {children && <div className="ml-4">{children}</div>}
    </div>
  );
};

export default ViewHeader;

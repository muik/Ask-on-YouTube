import React, { useState } from 'react';

interface InclusionsProps {
  onInclusionsChange?: (inclusions: { transcript: boolean; comments: boolean }) => void;
  commentCount?: number;
  onLoadMoreComments?: () => void;
}

export const Inclusions: React.FC<InclusionsProps> = ({ 
  onInclusionsChange,
  commentCount,
  onLoadMoreComments 
}) => {
  const [inclusions, setInclusions] = useState({
    transcript: true,
    comments: true,
  });

  const handleCheckboxChange = (key: keyof typeof inclusions) => {
    const newInclusions = {
      ...inclusions,
      [key]: !inclusions[key],
    };
    setInclusions(newInclusions);
    onInclusionsChange?.(newInclusions);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={inclusions.transcript}
          onChange={() => handleCheckboxChange('transcript')}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Include Transcript</span>
      </label>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inclusions.comments}
            onChange={() => handleCheckboxChange('comments')}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Include Comments {commentCount !== undefined && `(${commentCount})`}
          </span>
        </label>
        {inclusions.comments && onLoadMoreComments && (
          <button
            onClick={onLoadMoreComments}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}; 
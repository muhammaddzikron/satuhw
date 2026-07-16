import React from 'react';

export default function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hw-green"></div>
    </div>
  );
}

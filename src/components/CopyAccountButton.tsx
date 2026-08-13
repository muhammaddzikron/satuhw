import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyAccountButtonProps {
  accountNumber?: string;
  className?: string;
  textClassName?: string;
  showNumber?: boolean;
}

export const CopyAccountButton: React.FC<CopyAccountButtonProps> = ({
  accountNumber = '7307427448',
  className = '',
  textClassName = 'text-xs font-black text-gray-800 tracking-wide font-mono',
  showNumber = false
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanNum = String(accountNumber || '7307427448').replace(/[^0-9]/g, '') || '7307427448';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleanNum);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = cleanNum;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {showNumber && <span className={textClassName}>{accountNumber}</span>}
      <button
        type="button"
        onClick={handleCopy}
        className="px-2.5 py-1 text-gray-700 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-extrabold select-none active:scale-95 shadow-2xs"
        title="Salin Nomor Rekening"
      >
        {copied ? (
          <>
            <Check size={12} className="text-emerald-600" />
            <span className="text-[10px] text-emerald-600 font-bold">Tersalin</span>
          </>
        ) : (
          <>
            <Copy size={12} />
            <span className="text-[10px] text-gray-700 font-bold">Salin</span>
          </>
        )}
      </button>
    </div>
  );
};

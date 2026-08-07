import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyAccountButtonProps {
  accountNumber?: string;
  className?: string;
  textClassName?: string;
}

export const CopyAccountButton: React.FC<CopyAccountButtonProps> = ({
  accountNumber = '7307427448',
  className = '',
  textClassName = 'text-xs font-black text-gray-800 tracking-wide font-mono'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(accountNumber);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = accountNumber;
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
      <span className={textClassName}>{accountNumber}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="px-1.5 py-0.5 text-gray-500 hover:text-emerald-700 bg-gray-100 hover:bg-emerald-50 border border-gray-200/80 hover:border-emerald-200 rounded-md transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold select-none active:scale-95"
        title="Salin Nomor Rekening"
      >
        {copied ? (
          <>
            <Check size={11} className="text-emerald-600" />
            <span className="text-[9px] text-emerald-600 font-bold">Tersalin</span>
          </>
        ) : (
          <>
            <Copy size={11} />
            <span className="text-[9px] text-gray-600 font-semibold">Salin</span>
          </>
        )}
      </button>
    </div>
  );
};

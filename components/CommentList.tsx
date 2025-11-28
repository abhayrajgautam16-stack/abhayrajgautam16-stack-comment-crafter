import React, { useState } from 'react';
import { CommentResponse } from '../types';
import { Copy, Check, ThumbsUp, AlertTriangle } from 'lucide-react';

interface CommentListProps {
  response: CommentResponse | null;
  onReset: () => void;
}

const CommentList: React.FC<CommentListProps> = ({ response, onReset }) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (!response) return null;

  if (response.status === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
            <h3 className="text-sm font-bold text-red-900">Rejected</h3>
            <p className="text-xs text-red-700 mt-1">{response.rejection_reason || "Content policy violation."}</p>
        </div>
        <button onClick={onReset} className="text-xs font-semibold text-red-800 hover:underline">Try Again</button>
      </div>
    );
  }

  if (response.status === 'ok' && (!response.comments || response.comments.length === 0)) {
       return null;
  }

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-bold text-slate-800">Generated Drafts</h2>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{response.comments?.length} options</span>
      </div>
      
      <div className="space-y-3">
        {response.comments?.map((comment) => {
          const isRecommended = response.recommendation?.comment_id === comment.id;
          
          return (
            <div 
              key={comment.id}
              className={`group relative rounded-lg transition-all duration-200 ${
                isRecommended 
                  ? 'bg-white border border-indigo-500 shadow-md z-10' 
                  : 'bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm'
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-2 left-3 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                  <ThumbsUp className="w-2.5 h-2.5" /> Recommended
                </div>
              )}

              <div className="p-3">
                <div className="mb-2">
                   <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {comment.text}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
                  <p className="text-[10px] text-slate-400 font-mono">
                    {comment.length_chars}c • {comment.rationale}
                  </p>
                  
                  <button
                    onClick={() => handleCopy(comment.id, comment.text)}
                    className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold uppercase ${
                      copiedId === comment.id
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    {copiedId === comment.id ? (
                        <>
                        <Check className="w-3 h-3" /> Copied
                        </>
                    ) : (
                        <>
                        <Copy className="w-3 h-3" /> Copy
                        </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onReset} className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors border border-dashed border-slate-200 hover:border-indigo-200">
        Start Over / New Post
      </button>
    </div>
  );
};

export default CommentList;

import React, { useState } from 'react';
import { CommentResponse, ToneOption, CommentTypeOption } from '../types';
import { Loader2, ArrowRight, MessageCircle, Sparkles, PlusCircle } from 'lucide-react';

interface SelectionFormProps {
  response: CommentResponse;
  onSubmit: (tone: string, commentType: string) => void;
  isLoading: boolean;
  onCancel: () => void;
}

const SelectionForm: React.FC<SelectionFormProps> = ({ response, onSubmit, isLoading, onCancel }) => {
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Default fallbacks if API returns nothing (safety net)
  const toneOptions = response.tone_options || [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'encouraging', label: 'Encouraging' }
  ];

  const typeOptions = response.comment_type_options || [
    { value: 'supportive', label: 'Supportive', description: 'Express support' },
    { value: 'question', label: 'Question', description: 'Ask a question' }
  ];

  const handleAdditionalTypeClick = (val: string) => {
    // If it's a composite type like "supportive+question", just treat it as a string
    setSelectedType(val);
  }

  const handleSubmit = () => {
    if (selectedTone && selectedType) {
      onSubmit(selectedTone, selectedType);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-bold text-slate-800">Refine Your Reply</h2>
        <p className="text-slate-500 text-sm">Select a tone and intent to generate the best responses.</p>
      </div>

      {/* Tone Selection */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Desired Tone</h3>
        <div className="flex flex-wrap gap-2">
          {toneOptions.map((tone: ToneOption) => (
            <button
              key={tone.value}
              onClick={() => setSelectedTone(tone.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                selectedTone === tone.value
                  ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-offset-1 ring-slate-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              {tone.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comment Type Selection */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Comment Intent</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {typeOptions.map((type: CommentTypeOption) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                selectedType === type.value
                  ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                  : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold text-slate-800 text-sm mb-0.5 flex items-center justify-between">
                {type.label}
                {selectedType === type.value && <MessageCircle className="w-4 h-4 text-indigo-600" />}
              </div>
              <div className="text-xs text-slate-500 leading-snug">{type.description}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Additional Suggestions */}
      {response.additional_suggested_comment_types && response.additional_suggested_comment_types.length > 0 && (
         <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <h4 className="text-xs font-bold uppercase text-amber-700 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Smart Suggestions
            </h4>
            <div className="space-y-2">
                {response.additional_suggested_comment_types.map((extra, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAdditionalTypeClick(extra.value)}
                        className={`w-full text-left p-2 rounded-lg border border-amber-200 bg-white hover:bg-amber-100 transition-colors flex items-center justify-between group ${selectedType === extra.value ? 'ring-2 ring-amber-400' : ''}`}
                    >
                        <div>
                            <span className="text-sm font-semibold text-slate-800">{extra.label}</span>
                            <span className="text-xs text-slate-500 block">Why: {extra.why}</span>
                        </div>
                        <PlusCircle className={`w-4 h-4 text-amber-400 group-hover:text-amber-600 ${selectedType === extra.value ? 'text-amber-600 fill-amber-100' : ''}`} />
                    </button>
                ))}
            </div>
         </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedTone || !selectedType || isLoading}
          className="flex-[2] px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Generate Replies <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SelectionForm;

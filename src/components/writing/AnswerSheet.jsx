import React, { forwardRef } from 'react';

const AnswerSheet = forwardRef(({ value, onChange, onFocus, onBlur, readOnly, correctedHtml, wordCount, isFocused, placeholder = 'Start typing...' }, ref) => {
    return (
        <div className={`w-[62%] flex-grow flex flex-col rounded-2xl overflow-hidden bg-paper border shadow-sm transition-colors duration-200 ${isFocused ? 'border-primary-400 ring-2 ring-primary-100' : 'border-paper-edge'}`}>
            <div className="flex items-center gap-2 px-6 py-3 border-b border-paper-edge">
                <span className="font-semibold text-sm text-paper-text">Answer Sheet</span>
                <span className="ml-auto font-roboto-mono text-xs font-semibold text-paper-text/70">
                    {correctedHtml ? 'Corrected' : `${wordCount} words`}
                </span>
            </div>
            <div
                ref={ref}
                className="flex-grow p-8 leading-9 font-roboto-mono text-paper-text text-[15.5px] overflow-y-auto bg-[repeating-linear-gradient(#fffbf0_0px,#fffbf0_35px,#efe9da_35px,#efe9da_36px)] bg-local"
            >
                {correctedHtml ? (
                    <div className="graded-essay whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: correctedHtml }} />
                ) : (
                    <textarea
                        value={value}
                        onChange={onChange}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        readOnly={readOnly}
                        className="w-full h-full bg-transparent border-none outline-none resize-none leading-9"
                        placeholder={placeholder}
                    />
                )}
            </div>
        </div>
    );
});

AnswerSheet.displayName = 'AnswerSheet';

export default AnswerSheet;

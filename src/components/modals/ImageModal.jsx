import React from 'react';

const ImageModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
                <img src={imageUrl} alt="Generated Task Graph" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
                <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl font-bold">&times;</button>
            </div>
        </div>
    );
};

export default ImageModal;

import React from 'react';

const ConfirmationModal = ({ onConfirm, onCancel, message }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl font-inter">
            <p className="text-lg mb-4">{message}</p>
            <div className="flex justify-end gap-4">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Confirm</button>
            </div>
        </div>
    </div>
);

export default ConfirmationModal;

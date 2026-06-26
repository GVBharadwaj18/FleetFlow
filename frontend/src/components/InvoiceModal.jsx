import React from "react";

export default function InvoiceModal({ visible, onClose, invoice }) {
    if (!visible || !invoice) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-surface-900 p-6 rounded shadow-lg w-[500px] max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-center mb-4">🧾 Invoice Details</h2>

                <p><strong>🧍 Customer:</strong>
                    {invoice.customer
                        ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
                        : "—"}
                </p>
                <p><strong>🚗 Vehicle:</strong> {invoice.vehicle?.brand} {invoice.vehicle?.model} ({invoice.vehicle?.plateNumber})</p>
                <p><strong>📅 Date:</strong> {new Date(invoice.date).toLocaleDateString()}</p>

                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Services:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        {invoice.services.map((srv, idx) => (
                            <li key={idx}>{srv.description} — €{Number(srv.price || 0).toLocaleString()}</li>
                        ))}
                    </ul>
                </div>
                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Parts Used:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        {Array.isArray(invoice.maintenanceId?.partsUsed) &&
                            invoice.maintenanceId.partsUsed.length > 0 ? (
                            invoice.maintenanceId.partsUsed.map((part, idx) => (
                                <li key={idx}>{part.name}</li>
                            ))
                        ) : (
                            <li className="text-gray-400">None</li>
                        )}

                    </ul>
                </div>
                <p className="mt-4 font-bold text-right text-lg">💰 Total: €{Number(invoice.totalPrice || 0).toLocaleString()}</p>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

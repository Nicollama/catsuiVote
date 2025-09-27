// src/components/Modal.jsx
export default function Modal({ title, children, onClose, actions = [] }) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-xl w-96">
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <div className="mb-4">{children}</div>
          <div className="flex justify-end space-x-2">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className={`px-4 py-2 rounded ${action.className}`}
              >
                {action.label}
              </button>
            ))}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }
  
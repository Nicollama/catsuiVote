export default function PendingApproval() {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-2xl shadow-md w-96 text-center">
          <h1 className="text-2xl font-bold mb-4">Pending Approval</h1>
          <p className="text-gray-700 mb-4">
            Your registration has been received, but you cannot vote yet.
          </p>
          <p className="text-gray-600">
            Please wait for an administrator to approve your account.
          </p>
        </div>
      </div>
    );
  }
  
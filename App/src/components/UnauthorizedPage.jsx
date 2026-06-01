export default function UnauthorizedPage() {
  return (
    <div className="p-6">           
        <h1 className="text-2xl font-bold mb-4">Unauthorized Access</h1>
        <p className="text-sm text-[#6B7280] mb-2">
          You do not have permission to view this page. Please contact your administrator if you believe this is an error.
        </p>
        <p className="text-sm text-[#6B7280]">
          <a href="/login" className="text-[#7B1A1A] underline">Return to Login</a>
        </p>
    </div>
  );
};          

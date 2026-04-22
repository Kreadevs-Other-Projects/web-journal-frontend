import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center border rounded-2xl p-8 shadow-sm bg-card">
        {/* Icon */}
        <div className="text-5xl mb-4">🚫</div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>

        {/* Description */}
        <p className="text-muted-foreground mt-2 text-sm">
          You don’t have permission to view this page. Please check your account
          role or go back to a safe page.
        </p>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/"
            className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition"
          >
            Go to Home
          </Link>

          <Link
            to="/login"
            className="w-full rounded-lg border py-2 text-sm font-medium hover:bg-muted transition"
          >
            Login with another account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="text-center p-10">
      <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
      <p className="mt-4">Oops! The page you're looking for doesn't exist.</p>
      <Link to="/" className="text-blue-500 underline mt-4 block">
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;

import { Navigate } from 'react-router-dom';
import { getValidToken } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  const token = getValidToken();
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default ProtectedRoute;

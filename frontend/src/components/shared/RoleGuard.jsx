import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const RoleGuard = ({
	allowedRoles = [],
	children,
	fallbackTo = "/dashboard",
}) => {
	const location = useLocation();
	const { isAuthenticated, user } = useAuthStore();

	if (!isAuthenticated) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	if (!user?.role || !allowedRoles.includes(user.role)) {
		return <Navigate to={fallbackTo} replace />;
	}

	return children;
};

export default RoleGuard;

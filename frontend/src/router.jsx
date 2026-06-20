import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import PatientList from "./pages/patients/PatientList";
import PatientForm from "./pages/patients/PatientForm";
import PatientDetail from "./pages/patients/PatientDetail";
import AppointmentPage from "./pages/appointments/AppointmentPage";
import EncounterPage from "./pages/encounters/EncounterPage";
import BillingPage from "./pages/billing/BillingPage";
import InventoryPage from "./pages/inventory/InventoryPage";
import LabPage from "./pages/lab/LabPage";
import SettingsPage from "./pages/settings/SettingsPage";
import useAuthStore from "./store/authStore";
import UsersPage from "./pages/users/UsersPage";
import RoleGuard from "./components/shared/RoleGuard";

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
	const { isAuthenticated } = useAuthStore();
	if (!isAuthenticated) return <Navigate to="/login" replace />;
	return children;
};

const withRoles = (element, allowedRoles) => (
	<RoleGuard allowedRoles={allowedRoles}>{element}</RoleGuard>
);

export const router = createBrowserRouter([
	{
		path: "/login",
		element: <Login />,
	},
	{
		path: "/",
		element: (
			<ProtectedRoute>
				<AppLayout />
			</ProtectedRoute>
		),
		children: [
			{ index: true, element: <Navigate to="/dashboard" replace /> },
			{ path: "dashboard", element: <Dashboard /> },
			{
				path: "patients",
				element: withRoles(<PatientList />, [
					"ADMIN",
					"DOCTOR",
					"RECEPTIONIST",
				]),
			},
			{
				path: "patients/new",
				element: withRoles(<PatientForm />, [
					"ADMIN",
					"DOCTOR",
					"RECEPTIONIST",
				]),
			},
			{
				path: "patients/:id",
				element: withRoles(<PatientDetail />, [
					"ADMIN",
					"DOCTOR",
					"RECEPTIONIST",
				]),
			},
			{
				path: "patients/:id/edit",
				element: withRoles(<PatientForm />, [
					"ADMIN",
					"DOCTOR",
					"RECEPTIONIST",
				]),
			},
			{
				path: "appointments",
				element: withRoles(<AppointmentPage />, [
					"ADMIN",
					"DOCTOR",
					"RECEPTIONIST",
				]),
			},
			{
				path: "encounters",
				element: withRoles(<EncounterPage />, ["ADMIN", "DOCTOR"]),
			},
			{
				path: "billing",
				element: withRoles(<BillingPage />, ["ADMIN", "RECEPTIONIST"]),
			},
			{
				path: "inventory",
				element: withRoles(<InventoryPage />, ["ADMIN", "RECEPTIONIST"]),
			},
			{
				path: "lab",
				element: withRoles(<LabPage />, ["ADMIN", "DOCTOR", "LAB_TECH"]),
			},
			{
				path: "users",
				element: withRoles(<UsersPage />, ["ADMIN"]),
			},
			{
				path: "settings",
				element: withRoles(<SettingsPage />, ["ADMIN"]),
			},
		],
	},
]);

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

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
	const { isAuthenticated } = useAuthStore();
	if (!isAuthenticated) return <Navigate to="/login" replace />;
	return children;
};

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
			{ path: "patients", element: <PatientList /> },
			{ path: "patients/new", element: <PatientForm /> },
			{ path: "patients/:id", element: <PatientDetail /> },
			{ path: "patients/:id/edit", element: <PatientForm /> },
			{ path: "appointments", element: <AppointmentPage /> },
			{ path: "encounters", element: <EncounterPage /> },
			{ path: "billing", element: <BillingPage /> },
			{ path: "inventory", element: <InventoryPage /> },
			{ path: "lab", element: <LabPage /> },
			{ path: "settings", element: <SettingsPage /> },
		],
	},
]);

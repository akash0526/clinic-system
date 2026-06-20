import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import useAuthStore from "./store/authStore";
import RoleGuard from "./components/shared/RoleGuard";

// Login is needed immediately — keep it eager.
import Login from "./pages/auth/Login";

// Everything else is code-split (lazy) → smaller initial bundle.
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const PatientList = lazy(() => import("./pages/patients/PatientList"));
const PatientForm = lazy(() => import("./pages/patients/PatientForm"));
const PatientDetail = lazy(() => import("./pages/patients/PatientDetail"));
const AppointmentPage = lazy(
	() => import("./pages/appointments/AppointmentPage"),
);
const EncounterPage = lazy(() => import("./pages/encounters/EncounterPage"));
const BillingPage = lazy(() => import("./pages/billing/BillingPage"));
const InventoryPage = lazy(() => import("./pages/inventory/InventoryPage"));
const LabPage = lazy(() => import("./pages/lab/LabPage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const UsersPage = lazy(() => import("./pages/users/UsersPage"));

const PageLoader = () => (
	<div className="flex h-64 items-center justify-center text-gray-400">
		Loading…
	</div>
);

// Wrap lazy elements in Suspense.
const L = (element) => <Suspense fallback={<PageLoader />}>{element}</Suspense>;

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
	const { isAuthenticated } = useAuthStore();
	if (!isAuthenticated) return <Navigate to="/login" replace />;
	return children;
};

const withRoles = (element, allowedRoles) => (
	<RoleGuard allowedRoles={allowedRoles}>{L(element)}</RoleGuard>
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
			{ path: "dashboard", element: L(<Dashboard />) },
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

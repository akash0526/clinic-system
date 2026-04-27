const patientService = require("./patient.service");
const {
	createPatientSchema,
	updatePatientSchema,
} = require("./patient.validation");
const {
	sendSuccess,
	sendCreated,
	sendError,
} = require("../../utils/apiResponse");
const { createAuditLog } = require("../../middleware/audit");
const validate = require("../../middleware/validate");

// GET /api/patients — List with search & pagination
const list = async (req, res, next) => {
	try {
		const result = await patientService.getPatients(req.query);
		return sendSuccess(res, result.data, "Patients fetched", 200, result.meta);
	} catch (err) {
		next(err);
	}
};

// GET /api/patients/:id — Single patient
const show = async (req, res, next) => {
	try {
		const patient = await patientService.getPatientById(req.params.id);
		return sendSuccess(res, patient, "Patient fetched");
	} catch (err) {
		next(err);
	}
};

// POST /api/patients — Create
const create = [
	validate(createPatientSchema),
	async (req, res, next) => {
		try {
			const patient = await patientService.createPatient(req.body);

			await createAuditLog({
				userId: req.user.id,
				userEmail: req.user.email,
				action: "CREATE",
				tableName: "patients",
				recordId: patient.id,
				newValues: {
					patientCode: patient.patientCode,
					fullName: patient.fullName,
				},
				ipAddress: req.ip,
			});

			return sendCreated(res, patient, "Patient registered successfully");
		} catch (err) {
			next(err);
		}
	},
];

// PUT /api/patients/:id — Update
const update = [
	validate(updatePatientSchema),
	async (req, res, next) => {
		try {
			const { updated, old } = await patientService.updatePatient(
				req.params.id,
				req.body,
			);

			await createAuditLog({
				userId: req.user.id,
				userEmail: req.user.email,
				action: "UPDATE",
				tableName: "patients",
				recordId: updated.id,
				oldValues: old,
				newValues: req.body,
				ipAddress: req.ip,
			});

			return sendSuccess(res, updated, "Patient updated successfully");
		} catch (err) {
			next(err);
		}
	},
];

// DELETE /api/patients/:id — Soft delete (admin only)
const remove = async (req, res, next) => {
	try {
		await patientService.deletePatient(req.params.id);

		await createAuditLog({
			userId: req.user.id,
			userEmail: req.user.email,
			action: "DELETE",
			tableName: "patients",
			recordId: req.params.id,
			ipAddress: req.ip,
		});

		return sendSuccess(res, null, "Patient deleted successfully");
	} catch (err) {
		next(err);
	}
};

module.exports = { list, show, create, update, remove };

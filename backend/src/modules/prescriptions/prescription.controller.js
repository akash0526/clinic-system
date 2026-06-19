const {
	sendSuccess,
	sendCreated,
} = require("../../utils/apiResponse");
const { createAuditLog } = require("../../middleware/audit");
const service = require("./prescription.service");

const list = async (req, res, next) => {
	try {
		const result = await service.getPrescriptions(req.query);
		return sendSuccess(res, result.data, "Prescriptions fetched", 200, result.meta);
	} catch (err) {
		next(err);
	}
};

const show = async (req, res, next) => {
	try {
		const prescription = await service.getPrescriptionById(req.params.id);
		return sendSuccess(res, prescription, "Prescription fetched");
	} catch (err) {
		next(err);
	}
};

const create = async (req, res, next) => {
	try {
		const prescription = await service.createPrescription(req.body, req.user.id);

		await createAuditLog({
			userId: req.user.id,
			userEmail: req.user.email,
			action: "CREATE",
			tableName: "prescriptions",
			recordId: prescription.id,
			newValues: {
				prescriptionNumber: prescription.prescriptionNumber,
				patientId: prescription.patientId,
				encounterId: prescription.encounterId,
				itemCount: prescription.items.length,
			},
			ipAddress: req.ip,
			userAgent: req.headers["user-agent"],
		});

		return sendCreated(res, prescription, "Prescription created");
	} catch (err) {
		next(err);
	}
};

const update = async (req, res, next) => {
	try {
		const prescription = await service.updatePrescription(req.params.id, req.body);

		await createAuditLog({
			userId: req.user.id,
			userEmail: req.user.email,
			action: "UPDATE",
			tableName: "prescriptions",
			recordId: prescription.id,
			newValues: {
				prescriptionNumber: prescription.prescriptionNumber,
				itemCount: prescription.items.length,
				notes: prescription.notes,
				status: prescription.status,
			},
			ipAddress: req.ip,
			userAgent: req.headers["user-agent"],
		});

		return sendSuccess(res, prescription, "Prescription updated");
	} catch (err) {
		next(err);
	}
};

const dispense = async (req, res, next) => {
	try {
		const prescription = await service.dispensePrescription(
			req.params.id,
			req.body,
			req.user.id,
		);

		await createAuditLog({
			userId: req.user.id,
			userEmail: req.user.email,
			action: "UPDATE",
			tableName: "prescriptions",
			recordId: prescription.id,
			newValues: {
				prescriptionNumber: prescription.prescriptionNumber,
				status: prescription.status,
				dispensedAt: prescription.dispensedAt,
				dispensedItems: req.body.items.map((item) => ({
					prescriptionItemId: item.prescriptionItemId,
					quantity: item.quantity,
				})),
			},
			description: "Prescription items dispensed",
			ipAddress: req.ip,
			userAgent: req.headers["user-agent"],
		});

		return sendSuccess(res, prescription, "Prescription dispensed successfully");
	} catch (err) {
		next(err);
	}
};

module.exports = {
	list,
	show,
	create,
	update,
	dispense,
};

const prisma = require("../../config/db");
const { paginate, paginateMeta } = require("../../utils/pagination");
const { parseDateOnly, startOfDay, endOfDay } = require("../../utils/date");

const getAppointments = async (query) => {
	const { page, limit, skip } = paginate(query);
	const { search, doctorId, status, today, date, dateAD } = query;

	const selectedDate = today ? new Date() : date || dateAD;
	const dayStart = selectedDate ? startOfDay(selectedDate) : null;
	const dayEnd = selectedDate ? endOfDay(selectedDate) : null;

	const where = {
		...(status && { status }),
		...(doctorId && { doctorId }),
		...(dayStart && dayEnd && {
			appointmentDateAD: { gte: dayStart, lte: dayEnd },
		}),
		...(search && {
			patient: {
				OR: [
					{ fullName: { contains: search, mode: "insensitive" } },
					{ patientCode: { contains: search, mode: "insensitive" } },
					{ phone: { contains: search } },
				],
			},
		}),
	};

	const [data, total] = await Promise.all([
		prisma.appointment.findMany({
			where,
			skip,
			take: limit,
			orderBy: [{ appointmentDateAD: "desc" }, { tokenNumber: "asc" }],
			include: {
				patient: {
					select: {
						id: true,
						fullName: true,
						patientCode: true,
						phone: true,
						gender: true,
					},
				},
				doctor: { select: { id: true, fullName: true, specialization: true } },
			},
		}),
		prisma.appointment.count({ where }),
	]);

	return { data, meta: paginateMeta(total, page, limit) };
};

const getAppointmentById = (id) =>
	prisma.appointment.findUniqueOrThrow({
		where: { id },
		include: {
			patient: true,
			doctor: { select: { id: true, fullName: true, specialization: true } },
			encounter: true,
		},
	});

const createAppointment = async (data, createdById) => {
	const appointmentDateAD = parseDateOnly(data.appointmentDateAD);
	if (!appointmentDateAD) {
		const err = new Error("Invalid appointment date. Please use YYYY-MM-DD.");
		err.statusCode = 400;
		throw err;
	}

	const dayStart = startOfDay(appointmentDateAD);
	const dayEnd = endOfDay(appointmentDateAD);

	// Referenced rows must exist, and doctorId must be an active DOCTOR —
	// otherwise Prisma raises a FK error (P2003). Check explicitly so the
	// client gets a clean 4xx with a useful message.
	const patient = await prisma.patient.findUnique({
		where: { id: data.patientId },
		select: { id: true },
	});
	if (!patient) {
		const err = new Error("Patient not found");
		err.statusCode = 404;
		throw err;
	}
	const doctor = await prisma.user.findUnique({
		where: { id: data.doctorId },
		select: { id: true, role: true, isActive: true },
	});
	if (!doctor) {
		const err = new Error("Doctor not found");
		err.statusCode = 404;
		throw err;
	}
	if (doctor.role !== "DOCTOR" || !doctor.isActive) {
		const err = new Error("doctorId must reference an active user with role DOCTOR");
		err.statusCode = 400;
		throw err;
	}

	const token =
		(await prisma.appointment.count({
			where: {
				doctorId: data.doctorId,
				appointmentDateAD: { gte: dayStart, lte: dayEnd },
			},
		})) + 1;

	return prisma.appointment.create({
		data: {
			patient: { connect: { id: data.patientId } },
			doctor: { connect: { id: data.doctorId } },
			createdBy: { connect: { id: createdById } },
			appointmentDateAD,
			appointmentTime: data.appointmentTime,
			type: data.type || "OPD",
			chiefComplaint: data.chiefComplaint || "",
			duration: data.duration || 15,
			notes: data.notes || "",
			tokenNumber: token,
		},
		include: {
			patient: { select: { id: true, fullName: true, phone: true } },
			doctor: { select: { id: true, fullName: true } },
		},
	});
};

const updateAppointmentStatus = (id, status) =>
	prisma.appointment.update({ where: { id }, data: { status } });

const getDoctors = () =>
	prisma.user.findMany({
		where: { role: "DOCTOR", isActive: true },
		select: { id: true, fullName: true, specialization: true },
	});

module.exports = {
	getAppointments,
	getAppointmentById,
	createAppointment,
	updateAppointmentStatus,
	getDoctors,
};

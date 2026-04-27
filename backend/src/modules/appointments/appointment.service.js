const prisma = require("../../config/db");
const { adToBS, bsToAD, parseBSDate, todayBS } = require("../../utils/bsDate");
const { paginate, paginateMeta } = require("../../utils/pagination");

const getAppointments = async (query) => {
	const { page, limit, skip } = paginate(query);
	const { search, doctorId, status, today, dateBS } = query;

	const bsDate = today ? todayBS() : dateBS;

	const where = {
		...(status && { status }),
		...(doctorId && { doctorId }),
		...(bsDate && { appointmentDateBS: bsDate }),
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
			orderBy: [{ appointmentDateBS: "desc" }, { tokenNumber: "asc" }],
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
	// Auto-assign token number for the day
	const token =
		(await prisma.appointment.count({
			where: {
				doctorId: data.doctorId,
				appointmentDateBS: data.appointmentDateBS,
			},
		})) + 1;

	const adDate = bsToAD(data.appointmentDateBS);
	const { year, month, day } = parseBSDate(data.appointmentDateBS);

	return prisma.appointment.create({
		data: {
			...data,
			createdById,
			tokenNumber: token,
			appointmentDateAD: adDate,
			appointmentDateBSYear: year,
			appointmentDateBSMonth: month,
			appointmentDateBSDay: day,
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

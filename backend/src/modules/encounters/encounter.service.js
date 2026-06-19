const prisma = require("../../config/db");
const { paginate, paginateMeta } = require("../../utils/pagination");
const { parseDateOnly } = require("../../utils/date");

const getEncounters = async (query) => {
	const { page, limit, skip } = paginate(query);
	const { patientId, doctorId, search } = query;

	const where = {
		...(patientId && { patientId }),
		...(doctorId && { doctorId }),
		...(search && {
			patient: { fullName: { contains: search, mode: "insensitive" } },
		}),
	};

	const [data, total] = await Promise.all([
		prisma.encounter.findMany({
			where,
			skip,
			take: limit,
			orderBy: { visitDateAD: "desc" },
			include: {
				patient: { select: { id: true, fullName: true, patientCode: true } },
				doctor: { select: { id: true, fullName: true } },
				prescriptions: { select: { id: true } },
			},
		}),
		prisma.encounter.count({ where }),
	]);

	return { data, meta: paginateMeta(total, page, limit) };
};

const normalizeEncounterDates = (data = {}) => ({
	...data,
	...(Object.prototype.hasOwnProperty.call(data, "followUpDateAD") && {
		followUpDateAD: data.followUpDateAD ? parseDateOnly(data.followUpDateAD) : null,
	}),
});

const createEncounter = async (data, doctorId) => {
	return prisma.encounter.create({
		data: {
			...normalizeEncounterDates(data),
			doctorId,
			visitDateAD: new Date(),
		},
		include: {
			patient: { select: { id: true, fullName: true, patientCode: true } },
			doctor: { select: { id: true, fullName: true } },
		},
	});
};

const updateEncounter = (id, data) =>
	prisma.encounter.update({ where: { id }, data: normalizeEncounterDates(data) });

const getEncounterById = (id) =>
	prisma.encounter.findUniqueOrThrow({
		where: { id },
		include: {
			patient: true,
			doctor: { select: { id: true, fullName: true, specialization: true } },
			prescriptions: true,
			labResults: { include: { test: true } },
		},
	});

module.exports = {
	getEncounters,
	createEncounter,
	updateEncounter,
	getEncounterById,
};

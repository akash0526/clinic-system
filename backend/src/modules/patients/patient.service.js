const prisma = require("../../config/db");
const { paginate, paginateMeta } = require("../../utils/pagination");
const { parseDateOnly } = require("../../utils/date");

const generatePatientCode = async () => {
	const year = new Date().getFullYear();
	const count = await prisma.patient.count({
		where: { patientCode: { startsWith: `P-${year}-` } },
	});
	return `P-${year}-${String(count + 1).padStart(5, "0")}`;
};

const normalizeDOB = (data) => ({
	dobAD: data.dobAD ? parseDateOnly(data.dobAD) : null,
});

const getPatients = async (query) => {
	const { page, limit, skip } = paginate(query);
	const { search, gender, province } = query;

	const where = {
		deletedAt: null,
		...(search && {
			OR: [
				{ fullName: { contains: search, mode: "insensitive" } },
				{ fullNameNe: { contains: search, mode: "insensitive" } },
				{ patientCode: { contains: search, mode: "insensitive" } },
				{ phone: { contains: search } },
			],
		}),
		...(gender && { gender }),
		...(province && { province }),
	};

	const [data, total] = await Promise.all([
		prisma.patient.findMany({
			where,
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				patientCode: true,
				fullName: true,
				fullNameNe: true,
				gender: true,
				dobAD: true,
				phone: true,
				bloodGroup: true,
				province: true,
				district: true,
				createdAt: true,
			},
		}),
		prisma.patient.count({ where }),
	]);

	return { data, meta: paginateMeta(total, page, limit) };
};

const getPatientById = (id) =>
	prisma.patient.findFirstOrThrow({ where: { id, deletedAt: null } });

const createPatient = async (data) => {
	const patientCode = await generatePatientCode();
	const { dobAD } = normalizeDOB(data);
	const { dobAD: _dobAD, ...rest } = data;

	return prisma.patient.create({
		data: {
			...rest,
			patientCode,
			dobAD,
		},
	});
};

const updatePatient = async (id, data) => {
	const old = await prisma.patient.findFirstOrThrow({
		where: { id, deletedAt: null },
	});
	const dobFields = Object.prototype.hasOwnProperty.call(data, "dobAD")
		? normalizeDOB(data)
		: {};
	const { dobAD: _dobAD, ...rest } = data;

	const updated = await prisma.patient.update({
		where: { id },
		data: { ...rest, ...dobFields },
	});
	return { updated, old };
};

const deletePatient = (id) =>
	prisma.patient.update({ where: { id }, data: { deletedAt: new Date() } });

module.exports = {
	getPatients,
	getPatientById,
	createPatient,
	updatePatient,
	deletePatient,
};

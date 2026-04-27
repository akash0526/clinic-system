// FIXED: moved require to top level, not inside function
const prisma = require("../../config/db");
const { adToBS, bsToAD, parseBSDate } = require("../../utils/bsDate");
const { paginate, paginateMeta } = require("../../utils/pagination");

// Load bikram-sambat at module level
let BikramSambat;
try {
	BikramSambat = require("bikram-sambat").BikramSambat;
} catch {}

const generatePatientCode = async () => {
	let year = new Date().getFullYear() + 57; // approximate BS year fallback
	if (BikramSambat) {
		try {
			const bs = BikramSambat.fromAD(new Date());
			year = bs.year;
		} catch {}
	}

	const count = await prisma.patient.count({
		where: { patientCode: { startsWith: `P-${year}-` } },
	});
	return `P-${year}-${String(count + 1).padStart(5, "0")}`;
};

const normalizeDOB = (data) => {
	let dobAD = data.dobAD ? new Date(data.dobAD) : null;
	let dobBS = data.dobBS || null;

	if (dobBS && !dobAD) dobAD = bsToAD(dobBS);
	if (dobAD && !dobBS) dobBS = adToBS(dobAD);

	const { year, month, day } = parseBSDate(dobBS);
	return { dobAD, dobBS, dobBSYear: year, dobBSMonth: month, dobBSDay: day };
};

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
				dobBS: true,
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
	const dobFields = normalizeDOB(data);
	const { dobAD, dobBS, dobBSYear, dobBSMonth, dobBSDay } = dobFields;

	// Remove raw dob fields from data before spreading
	const { dobAD: _a, dobBS: _b, ...rest } = data;

	return prisma.patient.create({
		data: {
			...rest,
			patientCode,
			dobAD,
			dobBS,
			dobBSYear,
			dobBSMonth,
			dobBSDay,
		},
	});
};

const updatePatient = async (id, data) => {
	const old = await prisma.patient.findFirstOrThrow({
		where: { id, deletedAt: null },
	});
	const dobFields = data.dobBS || data.dobAD ? normalizeDOB(data) : {};
	const { dobAD: _a, dobBS: _b, ...rest } = data;

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

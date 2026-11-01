// Retry a unit of work when it fails with a unique-constraint violation
// (Prisma P2002). Used for code generation that is based on count()+1
// (patient codes, inventory item codes): two concurrent requests can compute
// the same next code, and the loser fails with P2002. Retrying recomputes the
// count and wins. Bills/prescriptions avoid this via counter tables; this is
// the no-migration equivalent for the remaining generators.

const isUniqueConflict = (err) =>
	err?.name === "PrismaClientKnownRequestError" && err?.code === "P2002";

const withConflictRetry = async (fn, attempts = 3) => {
	let lastErr;
	for (let i = 0; i < attempts; i++) {
		try {
			return await fn();
		} catch (err) {
			lastErr = err;
			if (!isUniqueConflict(err)) throw err;
		}
	}
	throw lastErr;
};

module.exports = { withConflictRetry, isUniqueConflict };

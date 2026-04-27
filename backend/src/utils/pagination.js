// Reusable pagination utility for all list endpoints

const paginate = (query = {}) => {
	const page = Math.max(1, parseInt(query.page) || 1);
	const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
	const skip = (page - 1) * limit;
	return { page, limit, skip };
};

const paginateMeta = (total, page, limit) => ({
	total,
	page,
	limit,
	totalPages: Math.ceil(total / limit),
	hasNext: page < Math.ceil(total / limit),
	hasPrev: page > 1,
});

module.exports = { paginate, paginateMeta };

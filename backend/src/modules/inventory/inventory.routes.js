const router = require("express").Router();
const authenticate = require("../../middleware/auth");
const { isStaff } = require("../../middleware/rbac");
const prisma = require("../../config/db");
const { sendSuccess, sendCreated } = require("../../utils/apiResponse");
const { paginate, paginateMeta } = require("../../utils/pagination");

router.use(authenticate, isStaff);

// GET /api/inventory
router.get("/", async (req, res, next) => {
	try {
		const { page, limit, skip } = paginate(req.query);
		const { search, category } = req.query;

		const where = {
			...(category && { category }),
			...(search && {
				OR: [
					{ name: { contains: search, mode: "insensitive" } },
					{ genericName: { contains: search, mode: "insensitive" } },
					{ itemCode: { contains: search, mode: "insensitive" } },
				],
			}),
		};

		const [data, total] = await Promise.all([
			prisma.inventoryItem.findMany({
				where,
				skip,
				take: limit,
				orderBy: { name: "asc" },
			}),
			prisma.inventoryItem.count({ where }),
		]);

		return sendSuccess(
			res,
			data,
			"Inventory fetched",
			200,
			paginateMeta(total, page, limit),
		);
	} catch (err) {
		next(err);
	}
});

// GET /api/inventory/low-stock
// FIXED: Prisma doesn't support field-to-field comparisons — use raw query
router.get("/low-stock", async (req, res, next) => {
	try {
		const items = await prisma.$queryRaw`
      SELECT id, item_code as "itemCode", name, generic_name as "genericName",
             category, unit, current_stock as "currentStock", minimum_stock as "minimumStock",
             selling_price as "sellingPrice"
      FROM inventory_items
      WHERE current_stock <= minimum_stock
      ORDER BY (current_stock::float / NULLIF(minimum_stock, 0)) ASC
      LIMIT 20
    `;
		return sendSuccess(res, items);
	} catch (err) {
		next(err);
	}
});

// POST /api/inventory
router.post("/", async (req, res, next) => {
	try {
		const {
			name,
			genericName,
			category,
			unit,
			purchasePrice,
			sellingPrice,
			currentStock,
			minimumStock,
			manufacturer,
			batchNumber,
		} = req.body;

		// Auto-generate item code
		const count = await prisma.inventoryItem.count();
		const prefix =
			category === "MEDICINE"
				? "MED"
				: category === "CONSUMABLE"
					? "CON"
					: "EQP";
		const itemCode = `${prefix}-${String(count + 1).padStart(3, "0")}`;

		const item = await prisma.inventoryItem.create({
			data: {
				itemCode,
				name,
				genericName,
				category,
				unit,
				purchasePrice: parseFloat(purchasePrice),
				sellingPrice: parseFloat(sellingPrice),
				currentStock: parseInt(currentStock) || 0,
				minimumStock: parseInt(minimumStock) || 10,
				manufacturer,
				batchNumber,
			},
		});
		return sendCreated(res, item);
	} catch (err) {
		next(err);
	}
});

// PUT /api/inventory/:id
router.put("/:id", async (req, res, next) => {
	try {
		const item = await prisma.inventoryItem.update({
			where: { id: req.params.id },
			data: req.body,
		});
		return sendSuccess(res, item, "Item updated");
	} catch (err) {
		next(err);
	}
});

// POST /api/inventory/:id/stock
router.post("/:id/stock", async (req, res, next) => {
	try {
		const { type, quantity, notes, reference } = req.body;
		if (!type || !quantity) {
			return res
				.status(400)
				.json({ success: false, message: "type and quantity required" });
		}

		const item = await prisma.inventoryItem.findUniqueOrThrow({
			where: { id: req.params.id },
		});

		const isOut = ["DISPENSED", "EXPIRED"].includes(type);
		const delta = isOut
			? -Math.abs(parseInt(quantity))
			: Math.abs(parseInt(quantity));
		const newStock = Math.max(0, item.currentStock + delta);

		const [updated] = await prisma.$transaction([
			prisma.inventoryItem.update({
				where: { id: req.params.id },
				data: { currentStock: newStock },
			}),
			prisma.stockTransaction.create({
				data: {
					itemId: req.params.id,
					type,
					quantity: Math.abs(parseInt(quantity)),
					balanceAfter: newStock,
					notes: notes || null,
					reference: reference || null,
				},
			}),
		]);

		return sendSuccess(res, updated, "Stock adjusted");
	} catch (err) {
		next(err);
	}
});

module.exports = router;

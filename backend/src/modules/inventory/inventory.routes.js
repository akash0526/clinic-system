const router = require("express").Router();
const authenticate = require("../../middleware/auth");
const { isStaff } = require("../../middleware/rbac");
const prisma = require("../../config/db");
const validate = require("../../middleware/validate");
const {
	createItemSchema,
	updateItemSchema,
	stockMovementSchema,
} = require("./inventory.validation");
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
// Prisma can't compare two columns directly — use a raw query.
router.get("/low-stock", async (req, res, next) => {
	try {
		const items = await prisma.$queryRaw`
			SELECT id, "itemCode", name, "genericName", category, unit,
			       "currentStock", "minimumStock", "sellingPrice"
			FROM inventory_items
			WHERE "currentStock" <= "minimumStock"
			ORDER BY ("currentStock"::float / NULLIF("minimumStock", 0)) ASC
			LIMIT 20
		`;
		return sendSuccess(res, items);
	} catch (err) {
		next(err);
	}
});

// POST /api/inventory  (validated)
router.post("/", validate(createItemSchema), async (req, res, next) => {
	try {
		const d = req.body;

		// Auto-generate item code atomically with creation.
		const prefix =
			d.category === "MEDICINE"
				? "MED"
				: d.category === "CONSUMABLE"
					? "CON"
					: "EQP";

		const item = await prisma.$transaction(async (tx) => {
			const count = await tx.inventoryItem.count({
				where: { category: d.category },
			});
			const itemCode = `${prefix}-${String(count + 1).padStart(3, "0")}`;

			return tx.inventoryItem.create({
				data: {
					itemCode,
					name: d.name,
					genericName: d.genericName,
					category: d.category,
					unit: d.unit,
					purchasePrice: d.purchasePrice,
					sellingPrice: d.sellingPrice,
					currentStock: d.currentStock ?? 0,
					minimumStock: d.minimumStock ?? 10,
					manufacturer: d.manufacturer,
					batchNumber: d.batchNumber,
				},
			});
		});

		return sendCreated(res, item);
	} catch (err) {
		next(err);
	}
});

// PUT /api/inventory/:id  (validated — no longer trusts raw req.body)
router.put("/:id", validate(updateItemSchema), async (req, res, next) => {
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

// POST /api/inventory/:id/stock  (validated + race-safe)
router.post(
	"/:id/stock",
	validate(stockMovementSchema),
	async (req, res, next) => {
		try {
			const { type, quantity, notes, reference } = req.body;
			const id = req.params.id;
			const qty = Math.abs(quantity);
			const isOut = ["DISPENSED", "EXPIRED"].includes(type);

			const updated = await prisma.$transaction(async (tx) => {
				if (isOut) {
					// Atomic, guarded decrement: only succeeds if enough stock exists.
					const result = await tx.inventoryItem.updateMany({
						where: { id, currentStock: { gte: qty } },
						data: { currentStock: { decrement: qty } },
					});
					if (result.count === 0) {
						const err = new Error("Insufficient stock for this movement");
						err.statusCode = 400;
						throw err;
					}
				} else {
					await tx.inventoryItem.update({
						where: { id },
						data: { currentStock: { increment: qty } },
					});
				}

				const item = await tx.inventoryItem.findUniqueOrThrow({
					where: { id },
					select: { currentStock: true },
				});

				await tx.stockTransaction.create({
					data: {
						itemId: id,
						type,
						quantity: qty,
						balanceAfter: item.currentStock,
						notes: notes || null,
						reference: reference || null,
					},
				});

				return tx.inventoryItem.findUnique({ where: { id } });
			});

			return sendSuccess(res, updated, "Stock adjusted");
		} catch (err) {
			next(err);
		}
	},
);

module.exports = router;

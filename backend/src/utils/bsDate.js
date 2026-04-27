// FIXED: Use ES module import, not require()
// FIXED: BikramSambat v2 API usage

let _BS = null;

const getBS = async () => {
	if (_BS) return _BS;
	try {
		const mod = await import("bikram-sambat");
		_BS = mod.BikramSambat;
		return _BS;
	} catch {
		return null;
	}
};

// Sync version for components that need it immediately
let _BSSync = null;
try {
	// This works because Vite handles it
	import("bikram-sambat").then((m) => {
		_BSSync = m.BikramSambat;
	});
} catch {}

export const adToBS = (adDate) => {
	if (!adDate || !_BSSync) return "";
	try {
		const bs = _BSSync.fromAD(new Date(adDate));
		return `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`;
	} catch {
		return "";
	}
};

export const bsToAD = (bsString) => {
	if (!bsString || !_BSSync) return null;
	try {
		const [y, m, d] = bsString.split("-").map(Number);
		return new _BSSync(y, m, d).toAD();
	} catch {
		return null;
	}
};

export const todayBSString = () => {
	if (!_BSSync) {
		// Approximate fallback: AD year + 56/57
		const now = new Date();
		const approxYear = now.getFullYear() + 56;
		const m = String(now.getMonth() + 1).padStart(2, "0");
		const d = String(now.getDate()).padStart(2, "0");
		return `${approxYear}-${m}-${d}`;
	}
	try {
		const bs = _BSSync.fromAD(new Date());
		return `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`;
	} catch {
		return "";
	}
};

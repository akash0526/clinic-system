import { BikramSambat } from "bikram-sambat";

export const adToBS = (adDate) => {
	if (!adDate) return null;
	try {
		const bs = BikramSambat.fromAD(new Date(adDate));
		return `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`;
	} catch {
		return null;
	}
};

export const bsToAD = (bsString) => {
	if (!bsString) return null;
	try {
		const [y, m, d] = bsString.split("-").map(Number);
		return new BikramSambat(y, m, d).toAD();
	} catch {
		return null;
	}
};

export const todayBSString = () => {
	try {
		const bs = BikramSambat.fromAD(new Date());
		return `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`;
	} catch {
		return "";
	}
};

const val1 = "0.0002870000";
const val2 = "10";
const val3 = null;
const val4 = "4.0";

function multiFromStringValues(...values) {
	if (values.some((val) => val == null || val === "")) {
		throw "parameter is not String Number";
	}
	if (values.some((val) => typeof val != "string")) {
		throw "parameter is not String";
	}

	// 小数点位置を保持
	const dotPositions = values.map((val) =>
		getDotPositionFromStringNumber(val)
	);
	const scale = dotPositions.reduce((sum, val) => sum + val, 0);

	// 小数点を取り除く
	const stringValues = values.map((val) => val.replace(".", ""));

	// BigIntに変換して計算
	const bigIntValues = stringValues.map((val) => BigInt(val));
	const bigIntResult = bigIntValues.reduce(
		(acc, val) => acc * val,
		BigInt(1)
	);
	let stringResult = String(bigIntResult);

	console.log({
		dotPositions: dotPositions,
		scale: scale,
		stringValues: stringValues,
		bigIntValues: bigIntValues,
		bigIntResult: bigIntResult,
		stringResult: stringResult,
	});

	if (scale === 0) {
		return stringResult;
	} else {
		stringResult = stringResult.padStart(scale + 1, "0");
		const prefix = stringResult.slice(0, -scale) || "0";
		const suffix = stringResult.slice(-scale);
		const formattedResult = `${prefix}.${suffix}`;

		console.log({
			prefix: prefix,
			suffix: suffix,
			formattedResult: formattedResult,
		});

		return formattedResult
			.replace(/(\.\d*?)0+$/, "$1")
			.replace(/\.$/, "")
			.replace(/^0+/, "0");
	}
}

function getDotPositionFromStringNumber(value) {
	if (value === null || value === "" || value === undefined) {
		return 0;
	}
	if (typeof value != "string") {
		return 0;
	}

	var strVal = value;
	var dotPosition = 0;

	if (strVal.lastIndexOf(".") >= 0) {
		dotPosition = strVal.length - 1 - strVal.lastIndexOf(".");
	}

	return dotPosition;
}

// const data = [val1,val2,val3,val4];
const data = [val1, "", val3, val4];
const calcData = data.filter((value) => value != null && value !== "");
console.log({data: data, calcData: calcData});
if (calcData.length > 0) {
	// console.log(multiFromStringValues(...calcData));
}

const obj = [
	{name: "namae1", value: 1},
	{name: "namae2", value: 2},
];

const list = obj.map((ob) => ob.name);

// console.log(list);

const ym = "2024/4";
const target = "2024-04-01";

function convertToFullDate(input) {
	const [year, month] = input.split("/"); // 年と月を分割
	const paddedMonth = month.padStart(2, "0"); // 月を2桁にする
	return `${year}-${paddedMonth}-01`; // フォーマットを整える
}

function dateFormat(dateVal, format, splitter) {
	const formats = format.split(splitter);
	let isFirst = true;
	let ret = "";
	for (var i = 0; i < formats.length; i++) {
		if (isFirst) {
			isFirst = false;
		} else {
			ret = ret + splitter;
		}
		if (["yyyy", "YYYY"].includes(formats[i])) {
			ret = ret + dateVal.getFullYear();
		} else if (["mm", "MM"].includes(formats[i])) {
			ret = ret + (dateVal.getMonth() + 1).toString().padStart(2, "0");
		} else if (["m", "M"].includes(formats[i])) {
			ret = ret + (dateVal.getMonth() + 1).toString();
		} else if (["dd", "DD"].includes(formats[i])) {
			ret = ret + dateVal.getDate().toString().padStart(2, "0");
		} else if (["d", "D"].includes(formats[i])) {
			ret = ret + dateVal.getDate().toString();
		}
	}
	return ret;
}

console.log(dateFormat(ym, "yyyy-MM-dd", "/"));
console.log(convertToFullDate(ym) === target);

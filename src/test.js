const EMISSION_RESULT_HEADER = {
	emissionSourceId: {key: "emission_source_id", name: "排出源"},
	linkage: {key: "", name: "連携"},
	resultDate: {key: "result_date", name: "年月日"},
	seqNo: {key: "seq_no", name: "枝番"},
	emissionFactor: {key: "emission_factor", name: "排出原単位"},
	activity: {key: "activity", name: "活動量"},
	emissionCorr1: {key: "emission_correct_1", name: "補正値"},
	emissionCorr2: {key: "emission_correct_2", name: "補正値"},
	co2Emission: {key: "co2_emission", name: "排出量"},
	memo: {key: "memo", name: "メモ"},
	evidence: {key: "evidence", name: "エビデンス"},
	updatedAt: {key: "updated_at", name: "更新日"},
	updatedBy: {key: "updated_by", name: "更新者"},
};

const getEmissionResultHeader = (hasLinkage, hasCorrection) => {
	const keysToExclude = [];
	if (!hasLinkage) {
		keysToExclude.push("linkage");
	}
	if (!hasCorrection) {
		keysToExclude.push("emissionCorr1", "emissionCorr2");
	}

	// 除外後のオブジェクトを作成
	return Object.entries(EMISSION_RESULT_HEADER).reduce(
		(acc, [key, value]) => {
			if (!keysToExclude.includes(key)) {
				acc[key] = value;
			}
			return acc;
		},
		{}
	);
};

// console.log(getEmissionResultHeader(false, false));

const res = Object.entries(EMISSION_RESULT_HEADER).map(([key, value]) => {
	switch (key) {
		case "emissionFactor":
			return `${value.name}(${10 - 1})`;
		default:
			return value.name;
	}
});

const indexes = Object.keys(EMISSION_RESULT_HEADER).reduce(
	(acc, key, index) => {
		acc[key] = index;
		return acc;
	},
	{}
);

const colLength = Object.keys(EMISSION_RESULT_HEADER).length;

const row = new Array(colLength).fill("");
row[indexes.resultDate] = "202411";

const CORRECTION_CALC_METHOD = Object.freeze({
	addition: {type: 1, name: "加算", symbols: "+"},
	subtraction: {type: 2, name: "減算", symbols: "&minus;"},
	multiplication: {type: 3, name: "乗算", symbols: "&times;"},
	division: {type: 4, name: "除算", symbols: "&divide;"},
});

function getCorrectionCalcSymbol(typeInt) {
	return Object.values(CORRECTION_CALC_METHOD).find(
		(method) => method.type === typeInt
	).symbols;
}

const emissionFactor = "0.0002870000";
const activity = "100";
const corrVal1 = "20.1200000000";
const corrVal2 = "40.1200000000";
const ZERO_SUFFIX_REGEXP = /0+$/;
const ZERO_PREFIX_REGEXP = /^0+/;

function calcCo2EmissionFromStringNumbers(
    factor,
    activity,
    value1,
    method1,
    value2,
    method2
) {
    if (
        factor == null ||
        factor === "" ||
        activity == null ||
        activity === ""
    ) {
        throw "parameter is not String Number";
    }
    if (typeof factor != "string" || typeof activity != "string") {
        throw "parameter is not String ";
    }

    // 小数点以下の桁数を取得する関数
    function getDecimalPlaces(value) {
        const parts = value.toString().split(".");
        return parts.length > 1 ? parts[1].length : 0;
    }

    // 小数を整数（BigInt）に変換する関数
    const toScaledBigInt = (value, scale) => {
        const currentScale = getDecimalPlaces(value);
        const factor = 10 ** (scale - currentScale); // 必要なスケールを計算
        return BigInt(value.toString().replace(".", "")) * BigInt(factor);
    };

    // BigInt の計算結果を小数に戻す関数
    const toStringNumber = (resultNum, scale) => {
        let resultStr = resultNum.toString();

        // 小数点以下の桁数がない場合、そのまま返す
        if (scale === 0) {
            return resultStr.replace(/^0+/, ""); // 先頭のゼロを削除
        }

        // 小数点位置を計算
        resultStr = resultStr.padStart(scale + 1, "0"); // 必要に応じてゼロを埋める
        const integerPart = resultStr.slice(0, -scale) || "0"; // 整数部分
        const decimalPart = resultStr.slice(-scale).padStart(scale, "0"); // 小数部分

        console.log({integerPart: integerPart, decimalPart: decimalPart});

        // 小数点を挿入して結果を作成
        const formattedResult = `${integerPart}.${decimalPart}`;

        // 不要なゼロを削除し、小数点末尾が "." で終わらないようにする
        return formattedResult.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "").replace(/^0+/, "0");
    };

    // 小数点位置を保持
    const factorDotPosition = getDecimalPlaces(factor);
    const activityDotPosition = getDecimalPlaces(activity);
    const value1DotPosition = getDecimalPlaces(value1);
    const value2DotPosition = getDecimalPlaces(value2);

    // 原単位 * 活動量 のスケール
    const scale = factorDotPosition + activityDotPosition;

    // 補正値同士のスケール
    const method2Scale =
        method2 == "+" || method2 == "-"
            ? Math.max(value1DotPosition, value2DotPosition)
            : value1DotPosition + value2DotPosition;
    console.log('method2Scale: ', method2Scale);

    // 除算時の value1 のスケール調整 (+10 桁)
    const value1Scale = method2 === "÷" ? method2Scale + 10 : method2Scale;

    // 小数を整数（BigInt）に変換
    const factorBigInt = toScaledBigInt(factor, factorDotPosition);
    const activityBigInt = toScaledBigInt(activity, activityDotPosition);
    const value1BigInt = toScaledBigInt(value1, value1Scale);
    const value2BigInt = toScaledBigInt(value2, value2DotPosition);
    console.log({factorBigInt: factorBigInt, activityBigInt: activityBigInt, value1BigInt: value1BigInt, value2BigInt, value2BigInt});

    // 原単位 * 活動量 の計算
    const result1 = factorBigInt * activityBigInt;

    // 結果を元のスケールで復元
    const result1Str = toStringNumber(result1, scale);

    // 補正値の計算
    let result2 = BigInt(0);
    switch (method2) {
        case "+":
            result2 = value1BigInt + value2BigInt;
            break;
        case "-":
            result2 = (value1BigInt - value2BigInt) < BigInt(0) ? BigInt(0) : value1BigInt - value2BigInt;
            break;
        case "×":
            result2 = value1BigInt * value2BigInt;
            break;
        case "÷":
            result2 = value2BigInt === BigInt(0) ? BigInt(0) : value1BigInt / value2BigInt;
            break;
        default:
            throw "Invalid operation";
    }
    console.log('result2: ', result2);

    // 補正値を元のスケールで復元
    const result2Str = toStringNumber(result2, method2 === "÷" ? value1Scale - value2DotPosition : method2Scale);

    console.log("\n==============================\n");

    
    // 小数点位置を保持
    const result1DotPosition = getDecimalPlaces(result1Str);
    const result2DotPosition = getDecimalPlaces(result2Str);

    const method1Scale =
        method2 == "+" || method2 == "-"
            ? Math.max(result1DotPosition, result2DotPosition)
            : result1DotPosition + result2DotPosition;
    console.log('method1Scale: ', method1Scale);

    // 除算時の result2 のスケール調整 (+10 桁)
    const result1Scale = method1 === "÷" ? method1Scale + 10 : method1Scale;


    // 小数を整数（BigInt）に変換
    const result1BigInt = toScaledBigInt(result1Str, result1Scale);
    const result2BigInt = toScaledBigInt(result2Str, result2DotPosition);
    console.log({result1BigInt: result1BigInt, result2BigInt: result2BigInt});

    let result = BigInt(0);
    switch (method1) {
        case "+":
            result = result1BigInt + result2BigInt;
            break;
        case "-":
            result = (result1BigInt - result2BigInt) < BigInt(0) ? BigInt(0) : result1BigInt - result2BigInt;
            break;
        case "×":
            result = result1BigInt * result2BigInt;
            break;
        case "÷":
            result = result1BigInt === BigInt(0) ? BigInt(0) : result1BigInt / result2BigInt;
            break;
        default:
            throw "Invalid operation";
    }
    console.log('result: ', result);

    // 補正値を元のスケールで復元
    console.log('scale: ',  method1 === "÷" ? result1Scale - result2DotPosition : method1Scale);
    const resultStr = toStringNumber(result, method1 === "÷" ? result1Scale - result2DotPosition : method1Scale);

    return { result1: result1Str, result2: result2Str, result: resultStr };
}

// 実行例
const result = calcCo2EmissionFromStringNumbers(
    emissionFactor,
    activity,
    corrVal1,
    "×",
    corrVal2,
    "÷"
);
console.log(result);




function calcMultiFromStringNumber(value1, value2) {
	if (value1 === null || value1 === "" || value1 === undefined) {
		throw "parameter is not String Number";
	}
	if (typeof value1 != "string") {
		throw "parameter is not String ";
	}
	if (value2 === null || value2 === "" || value2 === undefined) {
		throw "parameter is not String Number";
	}
	if (typeof value2 != "string") {
		throw "parameter is not String ";
	}

	// 小数点位置を保持
	var dotPosition1 = getDotPositionFromStringNumber(value1);
	var dotPosition2 = getDotPositionFromStringNumber(value2);
	var max = dotPosition1 + dotPosition2;
	console.log("max: ", max);

	// 小数点を取り除く
	var value1Str = value1.replace(".", "");
    console.log("value1Str: ", value1Str);
	var value2Str = value2.replace(".", "");
    console.log("value2Str: ", value2Str);

	// BigIntに変換して計算
	var bigIntValue1 = BigInt(value1Str);
	var bigIntValue2 = BigInt(value2Str);

	var result = bigIntValue1 * bigIntValue2;
	var resultStr = String(result);

	if (max == 0) {
		// maxが0なら整数なので、そのまま返す
		return resultStr;
	} else {
		// 文字列分割して、元の小数点位置で結合
		resultStr = "0".repeat(max) + resultStr;
		var prefix = resultStr.slice(0, -max);
		prefix = prefix.replace(ZERO_PREFIX_REGEXP, "");
		if (prefix.length == 0) {
			prefix = "0";
		}
		var suffix = resultStr.slice(-max);
		suffix = suffix.replace(ZERO_SUFFIX_REGEXP, "");
		if (suffix.length == 0) {
			return prefix;
		} else {
			return prefix + "." + suffix;
		}
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

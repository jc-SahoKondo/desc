const emissionFactor = "0.0002870000";
const activity = "100";
const corrVal1 = "20.0000000000";
const corrVal2 = "40.0000000000";

function calcCo2EmissionFromStringNumbers(
    factor,
    activity,
    value1,
    method1,
    value2,
    method2
) {
    if (
        factor == null || factor === "" ||
        activity == null || activity === "" ||
        (value1 != null && value1 === "") ||
        (value2 != null && value2 === "")
    ) {
        throw "parameter is not String Number";
    }
    if (typeof factor != "string" ||
        typeof activity != "string" ||
        (value1 != null && typeof value1 != "string") ||
        (value2 != null && typeof value2 != "string")
    ) {
        throw "parameter is not String ";
    }

    // 小数点以下の桁数を取得する関数
    const getDecimalPlaces = (value) => {
        const parts = value.toString().split(".");
        return parts.length > 1 ? parts[1].length : 0;
    };

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

        // 小数点を挿入して結果を作成
        const formattedResult = `${integerPart}.${decimalPart}`;

        // 不要なゼロを削除し、小数点末尾が "." で終わらないようにする
        return formattedResult.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "").replace(/^0+/, "0");
    };

    const calculate = (value1, value2, method) => {
        if (!value1) {
            return value2;
        }
        if (!value2) {
            return value1;
        }

        // 小数点位置を保持
        const value1DotPosition = getDecimalPlaces(value1);
        const value2DotPosition = getDecimalPlaces(value2);
        console.log({ value1DotPosition: value1DotPosition, value2DotPosition: value2DotPosition });

        // スケールを計算
        const scale = method === "+" || method === "-"
            ? Math.max(value1DotPosition, value2DotPosition)
            : value1DotPosition + value2DotPosition;

        // 除算時のスケール調整 (+10 桁)
        const value1Scale = method === "÷"
            ? Math.max(value1DotPosition, value2DotPosition) + 10
            : value1DotPosition;

        const value2Scale = method === "+" || method === "-"
            ? scale
            : value2DotPosition;

        console.log({ scale: scale, value1Scale: value1Scale, value2Scale: value2Scale });

        // 小数を整数（BigInt）に変換
        const value1BigInt = toScaledBigInt(value1, value1Scale);
        const value2BigInt = toScaledBigInt(value2, value2Scale);

        console.log({ value1BigInt: value1BigInt, value2BigInt: value2BigInt });

        let result = BigInt(0);
        switch (method) {
            case "+":
                result = value1BigInt + value2BigInt;
                break;
            case "-":
                result = (value1BigInt - value2BigInt) < BigInt(0) ? BigInt(0) : value1BigInt - value2BigInt;
                break;
            case "×":
                result = value1BigInt * value2BigInt;
                break;
            case "÷":
                result = value2BigInt === BigInt(0) ? BigInt(0) : value1BigInt / value2BigInt;
                break;
            default:
                throw "Invalid operation";
        }

        // 最終スケールを計算
        const finalScale = method === "÷"
            ? value1Scale - value2Scale
            : scale;

        console.log({ result: result, finalScale: finalScale });

        // 元のスケールで復元
        return toStringNumber(result, finalScale);
    };

    // 排出原単位×活動量
    const result1 = calculate(factor, activity, "×");
    console.log("result1: ", result1);
    console.log("=========");

    // 補正値同士
    const result2 = calculate(value1, value2, method2);
    console.log("result2: ", result2);
    console.log("=========");

    // 最終結果
    const result = calculate(result1, result2, value1 ? method1 : method2);
    console.log("result: ", result);
    console.log("=========");

    return result;
}

// 実行例
const ans = calcCo2EmissionFromStringNumbers(
    emissionFactor,
    activity,
    corrVal1,
    "+",
    corrVal2,
    "+"
);

// console.log("最終結果: ", ans);


// const emissionCorr1 = " ( 20.0000000000 ".match(/([+\-×÷])\s*\(\s*([\d.]+)/);
// const emissionCorr2 = "÷ 40.0000000000 )".match(/([+\-×÷])\s*([\d.]+)/);


// const [method1, val1] = emissionCorr1 ? [emissionCorr1[1], emissionCorr1[2]] : [null, null];
// const [method2, val2] = emissionCorr2 ? [emissionCorr2[1], emissionCorr2[2]] : [null, null];

// const ans = calcCo2EmissionFromStringNumbers(
//     emissionFactor,
//     activity,
//     val1,
//     method1,
//     val2,
//     method2
// );

// console.log({ope: method1, val: val1});
// console.log({ope: emissionCorr2[1], val: emissionCorr2[2]});
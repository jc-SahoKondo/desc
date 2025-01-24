const str = "04/2024";

console.log(str.replace(/^(\d{2})\/(\d{4})$/, "$2-$1"));
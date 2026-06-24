// @ts-nocheck
import validateVat, { CountryCodes } from "validate-vat-ts";

async function run() {
    try {
        const result = await validateVat("NL" as CountryCodes, "echo is pretty cool");
        console.log(result);
    } catch(e) {
        console.error("Error from validateVatEU:", e);
    }
}
run();

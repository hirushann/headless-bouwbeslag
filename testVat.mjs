import { validateVatEU } from "./node_modules/@salespark/validate-vat-eu/index.js";

async function run() {
    try {
        console.log(validateVatEU);
    } catch(e) {
        console.error(e);
    }
}
run();

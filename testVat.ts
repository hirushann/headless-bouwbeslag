import { validateVatEU } from "@salespark/validate-vat-eu";

async function run() {
    try {
        const result = await validateVatEU("NL", "echo is pretty cool");
        console.log(result);
    } catch(e) {
        console.error("Error from validateVatEU:", e);
    }
}
run();

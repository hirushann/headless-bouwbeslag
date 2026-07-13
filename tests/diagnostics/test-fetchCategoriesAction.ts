import { config } from "dotenv";
config({ path: ".env.local" });

import { fetchCategoriesAction } from "../../src/app/actions.ts";

async function run() {
    console.log("Running fetchCategoriesAction...");
    const res = await fetchCategoriesAction();
    if (res.success) {
        console.log("Success! Categories count:", res.data.length);
        const parents = res.data.filter((c: any) => c.parent === 0);
        console.log("Parents count:", parents.length);
        parents.forEach((c: any) => {
            console.log(c.name, c.image ? c.image.src : "no image");
        });
    } else {
        console.log("Failed:", res.error);
    }
}
run();

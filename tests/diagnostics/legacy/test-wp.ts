import { wpApi } from '../../../src/lib/wordpress';
async function test() {
    try {
        const res = await wpApi.get('wp/v2/posts');
        console.log("Posts:", res?.data?.length);
    } catch (e: any) {
        console.log("Post error:", e.message);
    }
}
test();

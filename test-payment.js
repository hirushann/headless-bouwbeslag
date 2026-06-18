import { createMollieClient } from '@mollie/api-client';

const mollieClient = createMollieClient({ apiKey: 'test_Cukw2ycGdqqzGNjqVr6SU8zcEb9m3p' });

async function test() {
    try {
        const payment = await mollieClient.payments.get('tr_PhdVw5FUVH4i3GKfc7mSJ');
        console.log("Payment status:", payment.status);
    } catch (e) {
        console.error(e);
    }
}
test();

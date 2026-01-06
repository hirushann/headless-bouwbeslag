import { createMollieClient } from '@mollie/api-client';

const apiKey = process.env.MOLLIE_API_KEY || 'test_Cukw2ycGdqqzGNjqVr6SU8zcEb9m3p';

const mollieClient = createMollieClient({
    apiKey: apiKey,
});

export default mollieClient;

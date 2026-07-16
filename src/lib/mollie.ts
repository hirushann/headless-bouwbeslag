import { createMollieClient } from '@mollie/api-client';

const apiKey = process.env.MOLLIE_API_KEY;

if (!apiKey) {
    throw new Error('MOLLIE_API_KEY is not configured');
}

const mollieClient = createMollieClient({
    apiKey: apiKey,
});

export default mollieClient;

const fs = require('fs');

const file = 'src/app/checkout/actions.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace local session save with POST to Empire
const postToEmpireCode = `
        // Save session locally FIRST (without transaction_id)
        // await saveCheckoutSession(orderReference, empirePayload);

        // POST order directly to Empire API with pending_payment status
        empirePayload.status = "pending";
        const empireUrl = (process.env.EMPIRE_BACKEND_API_URL || "http://empire.test").replace(/\\/$/, "");
        const isGuest = !data.customer_id;
        const endpoint = isGuest ? "/api/guest/orders" : "/api/account/orders";
        
        const headers: any = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        };
        
        if (!isGuest && data.auth_token) {
            headers["Authorization"] = \`Bearer \${data.auth_token}\`;
        }
        
        const payloadToSend = { ...empirePayload };
        delete payloadToSend.auth_token;

        const axios = require('axios');
        try {
            await axios.post(\`\${empireUrl}\${endpoint}\`, payloadToSend, { headers });
        } catch (empireError: any) {
            console.error("Failed to push order to Empire:", empireError?.response?.data || empireError.message);
            return { success: false, message: "Failed to create order in backend" };
        }
`;

content = content.replace(
    '        // Save session locally FIRST (without transaction_id)\n        await saveCheckoutSession(orderReference, empirePayload);',
    postToEmpireCode
);

// Remove the transaction_id local session save
const removeTxCode = `
        // Update session with transaction_id so checkOrderStatus can find it
        if (payment && payment.id) {
            empirePayload.transaction_id = payment.id;
            // await saveCheckoutSession(orderReference, empirePayload);
            // Optionally PATCH empire here with transaction_id, but webhook will handle status
        }
`;

content = content.replace(
    /        \/\/ Update session with transaction_id so checkOrderStatus can find it\n        if \(payment && payment\.id\) {\n            empirePayload\.transaction_id = payment\.id;\n            await saveCheckoutSession\(orderReference, empirePayload\);\n        }/g,
    removeTxCode
);

fs.writeFileSync(file, content);
console.log('Updated src/app/checkout/actions.ts');

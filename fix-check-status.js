const fs = require('fs');

const file = 'src/app/checkout/actions.ts';
let content = fs.readFileSync(file, 'utf8');

const checkStatusLogic = `
                    if (payment.status === 'paid') {
                        const empireUrl = (process.env.EMPIRE_BACKEND_API_URL || "http://empire.test").replace(/\\/$/, "");
                        const isGuest = session.customer_id === 0;
                        const endpoint = isGuest ? "/api/guest/orders" : "/api/account/orders";
                        
                        const headers: any = { "Accept": "application/json", "Content-Type": "application/json" };
                        if (!isGuest && session.auth_token) {
                            headers["Authorization"] = \`Bearer \${session.auth_token}\`;
                        }
                        
                        const payloadToSend = { status: "processing", email: session.billing?.email };
                        
                        try {
                            await axios.patch(\`\${empireUrl}\${endpoint}/\${orderIdStr}/status\`, payloadToSend, { headers });
                            await deleteCheckoutSession(orderIdStr);
                            return { success: true, status: 'processing' };
                        } catch (e: any) {
                            console.error("Empire API Error in success check:", e?.response?.data || e.message);
                            return {
                                success: false,
                                status: 'backend_failed',
                                message: "De betaling is gelukt, maar de bestelling kon niet worden verwerkt. Neem contact op met de klantenservice en vermeld je ordernummer."
                            };
                        }
                    } else if (['canceled', 'expired', 'failed'].includes(payment.status)) {
                        const empireUrl = (process.env.EMPIRE_BACKEND_API_URL || "http://empire.test").replace(/\\/$/, "");
                        const isGuest = session.customer_id === 0;
                        const endpoint = isGuest ? "/api/guest/orders" : "/api/account/orders";
                        const headers: any = { "Accept": "application/json", "Content-Type": "application/json" };
                        if (!isGuest && session.auth_token) headers["Authorization"] = \`Bearer \${session.auth_token}\`;
                        
                        try {
                            await axios.patch(\`\${empireUrl}\${endpoint}/\${orderIdStr}/status\`, { status: "failed", email: session.billing?.email }, { headers });
                        } catch (e) {}
                        
                        await deleteCheckoutSession(orderIdStr);
                        return { success: true, status: payment.status === 'canceled' ? 'cancelled' : 'failed' };
                    }
                    return { success: true, status: 'pending' };
`;

content = content.replace(
    /                    if \(payment\.status === 'paid'\) \{[\s\S]*?return \{ success: true, status: 'pending' \};\n                    \}/g,
    checkStatusLogic.trim()
);

fs.writeFileSync(file, content);
console.log('Updated checkOrderStatusAction');

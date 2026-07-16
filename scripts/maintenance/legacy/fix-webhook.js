const fs = require('fs');

const file = 'src/app/api/webhooks/mollie/route.ts';
let content = fs.readFileSync(file, 'utf8');

const webhookLogic = `
        // Check if this is the new checkout session flow
        if (orderReference.startsWith("NEXT-") || orderReference.startsWith("BW-")) {
            const isPaid = payment.status === 'paid';
            const isFailed = ['canceled', 'expired', 'failed'].includes(payment.status);
            
            if (isPaid || isFailed) {
                const sessionPayload = await getCheckoutSession(orderReference);
                
                if (sessionPayload) {
                    const empireUrl = (process.env.EMPIRE_BACKEND_API_URL || "http://empire.test").replace(/\\/$/, "");
                    
                    try {
                        const isGuest = metadata.is_guest !== false && sessionPayload.customer_id === 0;
                        const endpoint = isGuest ? "/api/guest/orders" : "/api/account/orders";
                        
                        const headers: any = {
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        };
                        
                        if (!isGuest && sessionPayload.auth_token) {
                            headers["Authorization"] = \`Bearer \${sessionPayload.auth_token}\`;
                        }
                        
                        const payloadToSend = { 
                            status: isPaid ? "processing" : "failed",
                            email: sessionPayload.billing?.email
                        };
                        
                        await axios.patch(\`\${empireUrl}\${endpoint}/\${orderReference}/status\`, payloadToSend, { headers });
                        
                        // Delete session once processed
                        await deleteCheckoutSession(orderReference);
                    } catch (empireError: any) {
                        console.error("Failed to update order status in Empire:", empireError?.response?.data || empireError.message);
                        return NextResponse.json({ message: "Empire API Error" }, { status: 500 });
                    }
                }
            }
            
            return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
        }
`;

content = content.replace(
    /\/\/ Check if this is the new checkout session flow[\s\S]*return NextResponse\.json\(\{ message: "Webhook processed" \}, \{ status: 200 \}\);\n        }/g,
    webhookLogic.trim()
);

fs.writeFileSync(file, content);
console.log('Updated webhook');

const getArray = (val: any) => Array.isArray(val) ? val : (val && typeof val === 'object' ? Object.values(val) : []);

function simulateBody(body: any) {
  const rawShipping = getArray(body.shipping);
  const rawDelivery = getArray(body.delivery);

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const validShipping = rawShipping.filter((d: any) => typeof d === 'string' && dateRegex.test(d as string));
  const validDelivery = rawDelivery.filter((d: any) => typeof d === 'string' && dateRegex.test(d as string));

  console.log("rawShipping:", rawShipping);
  console.log("validShipping:", validShipping);
  console.log("rawDelivery:", rawDelivery);
  console.log("validDelivery:", validDelivery);
}

const payload1 = {
  shipping: ["2024-05-01", "2025-12-23"],
  delivery: ["2026-02-19"]
};

console.log("Payload 1");
simulateBody(payload1);

const payload2 = {
  shipping: { "0": "2024-05-01", "1": "2025-12-23" },
  delivery: { "0": "2026-02-19" }
};

console.log("Payload 2");
simulateBody(payload2);

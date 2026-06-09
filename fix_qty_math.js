const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Fix totalPrice
    content = content.replace(/displayBasePrice \* quantity/g, 'displayBasePrice * (Number(quantity) || 1)');
    content = content.replace(/basePrice \* quantity/g, 'basePrice * (Number(quantity) || 1)');

    // Fix findDiscountIndex
    content = content.replace(/findDiscountIndex\(quantity\)/g, 'findDiscountIndex(Number(quantity) || 1)');

    // Fix availableStock check
    content = content.replace(/quantity > availableStock/g, '(Number(quantity) || 1) > availableStock');

    // Fix checkStockBeforeAdd
    content = content.replace(/checkStockBeforeAdd\(product\.id, quantity\)/g, 'checkStockBeforeAdd(product.id, Number(quantity) || 1)');

    // Fix openModal quantity and cartItemQuantity math
    // We will do a generic replace for `quantity + cartItemQuantity`
    content = content.replace(/quantity \+ cartItemQuantity/g, '(Number(quantity) || 1) + cartItemQuantity');

    // Fix `quantity,` inside object properties for openModal / addItem
    // This is risky, but we can target specific lines:
    // "        quantity,"
    content = content.replace(/\n\s{8}quantity,\n/g, '\n        quantity: Number(quantity) || 1,\n');
    content = content.replace(/\n\s{10}quantity,\n/g, '\n          quantity: Number(quantity) || 1,\n');

    fs.writeFileSync(file, content);
}

fixFile('src/app/[...slug]/ProductPageClient.tsx');
fixFile('src/app/product-template-2/[...slug]/ProductPageClientV2.tsx');

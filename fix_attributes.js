const fs = require('fs');

const files = [
    'src/app/[...slug]/ProductPageClient.tsx',
    'src/app/product-template-2/[...slug]/ProductPageClientV2.tsx'
];

const translationMap = `
                                    const attrTranslations: Record<string, string> = {
                                      "Material": "Materiaal",
                                      "Color": "Kleur",
                                      "Series": "Serie",
                                      "Offset": "Verkropping",
                                      "Finish": "Afwerking",
                                      "Afsluitbaarheid": "Afsluitbaarheid",
                                      "Package Content": "Verpakkingsinhoud",
                                      "Size": "Maat",
                                      "Width": "Breedte",
                                      "Height": "Hoogte",
                                      "Length": "Lengte",
                                      "Thickness": "Dikte",
                                      "Diameter": "Diameter",
                                      "Weight": "Gewicht",
                                      "Style": "Stijl",
                                      "Brand": "Merk",
                                      "Packing Type": "Verpakkingstype",
                                      "Brandvertragend": "Brandvertragend"
                                    };
                                    
                                    const translatedName = attrTranslations[attr.name] || attr.name;
                                    
                                    // Add measurement units for specific attributes if they are missing
                                    let displayUnit = unitValue;
                                    if (!displayUnit) {
                                      const lowerName = attr.name.toLowerCase();
                                      if (['width', 'height', 'length', 'thickness', 'diameter', 'size', 'maat', 'dikte', 'breedte', 'hoogte', 'lengte'].includes(lowerName)) {
                                        displayUnit = 'mm';
                                      } else if (['weight', 'gewicht'].includes(lowerName)) {
                                        displayUnit = 'kg';
                                      }
                                    }
`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the td that shows {attr.name}
    content = content.replace(
        /const unitAttrName = \`\$\{attr\.name\} Unit\`\;/g,
        translationMap.trim() + '\n                                    const unitAttrName = `${attr.name} Unit`;'
    );
    
    content = content.replace(
        /<td className="px-6 py-3 font-medium text-gray-900">\s*\{attr\.name\}\s*<\/td>/g,
        '<td className="px-6 py-3 font-medium text-gray-900">\n                                          {translatedName}\n                                        </td>'
    );
    
    content = content.replace(
        /\{formatSpecValue\(mainValue\)\} \{unitValue\}/g,
        '{formatSpecValue(mainValue)} {displayUnit}'
    );

    fs.writeFileSync(file, content);
});

console.log("Done");

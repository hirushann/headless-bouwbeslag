function getBrandId(bName) {
  return Math.abs(bName.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffff, 0));
}
console.log("Winlock:", getBrandId("Winlock"));
console.log("winlock:", getBrandId("winlock"));
console.log("WINLOCK:", getBrandId("WINLOCK"));

fetch('http://empire.test/api/categories/raamkruk')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

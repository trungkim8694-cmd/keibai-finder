require('ts-node/register');
const { getProperties } = require('./src/actions/propertyActions.ts');

async function main() {
  const result = await getProperties({ types: ['マンション'], listOnly: true, page: 1 });
  console.log("Found properties:", result.length);
  if(result.length > 0) console.log("First item type:", result[0].property_type);
}
main().catch(console.error);

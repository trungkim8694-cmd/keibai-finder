require('ts-node').register({ transpileOnly: true });
const { getProperties } = require('./src/actions/propertyActions.ts');

async function main() {
  console.log("Testing getProperties:");
  const res = await getProperties({});
  console.log("Result length:", res.length);
  if(res.length > 0) console.log("First item:", res[0]);
}

main().catch(console.error);

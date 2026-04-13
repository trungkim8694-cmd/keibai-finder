import { getProperties } from './src/actions/propertyActions';

async function main() {
  console.log("Testing getProperties()");
  const results = await getProperties({});
  console.log(`Found ${results.length} properties.`);
  if (results.length > 0) {
    console.log("Sample property:", {
      address: results[0].address,
      prefecture: results[0].prefecture,
      city: results[0].city,
      status: results[0].status
    });
  }
}

main();

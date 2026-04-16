import { getProperties } from './src/actions/propertyActions';

async function testFilter() {
    const res = await getProperties({ types: ['土地'], listOnly: true, limit: 20 });
    console.log("Filtered Length:", res.length);
    res.forEach(r => console.log(" -", r.property_type));
}
testFilter();

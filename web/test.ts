import { getProperties } from './src/actions/propertyActions';

async function test() {
  const props = await getProperties({});
  console.log("Returned:", props.length);
  if (props.length > 0) {
    console.log("First item sample:", props[0]);
  }
}

test();

const MLIT_API_KEY = "3cee958080dc40b2854698b6407d4b5a";
const BASE_URL = "https://www.reinfolib.mlit.go.jp/ex-api/external";

async function test() {
  const res = await fetch(`${BASE_URL}/XIT001?year=2023&city=13101`, {
    headers: { "Ocp-Apim-Subscription-Key": MLIT_API_KEY }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.data[0], null, 2));
}
test();

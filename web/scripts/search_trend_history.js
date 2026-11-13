const fs = require('fs');
const readline = require('readline');

async function searchTranscript() {
  const fileStream = fs.createReadStream('C:\\Users\\admin\\.gemini\\antigravity\\brain\\87dc7b44-9212-4062-b5ed-d3e3be8f82f9\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  let count = 0;
  for await (const line of rl) {
    if (line.includes('hot trend') || line.includes('Hot Trend') || line.includes('keyword-trends') || line.includes('b2b-seo-engine')) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'USER_INPUT') {
          console.log('[USER INPUT]:', obj.content?.substring(0, 300));
        } else if (obj.type === 'PLANNER_RESPONSE' && obj.content && (obj.content.includes('chiến lược') || obj.content.includes('tính năng') || obj.content.includes('hot trend') || obj.content.includes('Hot Trend'))) {
          console.log('[PLANNER_RESPONSE step ' + obj.step_index + ']:', obj.content.substring(0, 400));
          console.log('---');
        }
      } catch(e){}
    }
  }
}
searchTranscript();

import { readFileSync } from "fs";

function getMetadata(input: string) {
  const [metadataRaw, ...linesRaw] = input.split('\n#');

  return metadataRaw?.startsWith('#') ? {
    linesRaw: [metadataRaw.slice(1), ...linesRaw],
    metadata: {}
  } : {
    linesRaw,
    metadata: Object.fromEntries(metadataRaw.split('\n').map(v => v.split(':').map(v => v.trim())))
  }
}

const chartName = process.argv[2];
const chart = readFileSync(chartName).toString();
const { linesRaw, metadata } = getMetadata(chart);
const lines = ('#' + linesRaw.join('\n#')).split('\n').filter(v => v).map(v => ({
  type: v.startsWith('#') ? 'title' : v.match(/^[ \t0-9msuadno/|()]+$/) ? 'chords' : 'lyrics' as 'title' | 'chords' | 'lyrics',
  line: v,
}))
// .reduce((n, v, i, a) => 
//   v.type === 'lyrics' && a[i - 1]?.type === 'chords'
//     ? [...n.slice(0, -1), {type: 'lyrics+chords' as 'lyrics+chords', chords: a[i-1].line, lyrics: v.line,}]
//     : [...n, v],
//   [] as ({type: 'chords'|'lyrics'|'title', line: string} | {type: 'lyrics+chords', lyrics: string, chords: string})[])  

console.log("# Title")
console.log(metadata.Title);
lines.forEach((line) => {
  if (line.type === 'title') {
    console.log()
    console.log(`${line.line}`)
  } else if (line.type === 'lyrics') {
    console.log(`${line.line.replace(/[,.;?]/g, "").replace(/ +/, " ").replace(/ ?- ?/g, "")}`);
  }
})


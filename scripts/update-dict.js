const fs = require("fs");
const path = require("path");
const axios = require("axios");
const csv = require("csv-parser");
const cliProgress = require("cli-progress");
const { countWords, formatNumber, DICT_DIR } = require("./utils");

const ECDICT_URL =
  "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv";

async function downloadDict() {
  console.log("Downloading dict from " + ECDICT_URL);

  const { data, headers } = await axios({
    method: "get",
    url: ECDICT_URL,
    responseType: "stream",
  });

  const totalLength = headers["content-length"];
  const progressBar = new cliProgress.SingleBar(
    {
      format: "Downloading [{bar}] {percentage}% | {value}/{total} bytes",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );

  let downloadedLength = 0;
  // Check if content-length is available
  if (totalLength) {
    progressBar.start(parseInt(totalLength, 10), 0);
  } else {
    // If unknown length, just show downloaded bytes? Or maybe indeterminate bar?
    // For simplicity, let's start with 100MB estimate or just log.
    // GitHub raw content usually sends content-length.
    progressBar.start(100 * 1024 * 1024, 0); // Estimate 100MB
  }

  const { PassThrough } = require("stream");
  const monitorStream = new PassThrough();

  data.pipe(monitorStream);

  data.on("data", (chunk) => {
    downloadedLength += chunk.length;
    progressBar.update(downloadedLength);
  });

  data.on("end", () => {
    progressBar.stop();
    console.log("\nDownload complete.");
  });

  return monitorStream;
}

function processDict(stream) {
  return new Promise((resolve, reject) => {
    const dicts = {};

    stream
      .pipe(csv())
      .on("data", (row) => {
        const word = row.word;
        if (!word || word.length < 2) return;

        const prefix = word.substring(0, 2).toLowerCase();
        // Ensure prefix is valid filename characters just in case
        if (!/^[a-z]{2}$/.test(prefix)) return;

        if (!dicts[prefix]) {
          dicts[prefix] = {};
        }

        dicts[prefix][word] = {
          w: word,
          p: row.phonetic || "",
          t: row.translation || row.definition || "",
        };
      })
      .on("end", () => {
        resolve(dicts);
      })
      .on("error", reject);
  });
}

async function main() {
  try {
    if (!fs.existsSync(DICT_DIR)) {
      fs.mkdirSync(DICT_DIR, { recursive: true });
    }

    console.log("Calculating initial word count...");
    const initialCount = countWords();
    console.log(`Initial word count: ${formatNumber(initialCount)}`);

    const stream = await downloadDict();
    console.log("Processing dictionary data...");
    const dicts = await processDict(stream);

    console.log("Writing dictionary files...");
    let fileCount = 0;
    for (const [prefix, content] of Object.entries(dicts)) {
      const filePath = path.join(DICT_DIR, `${prefix}.json`);
      fs.writeFileSync(filePath, JSON.stringify(content));
      fileCount++;
    }

    console.log(`Updated ${fileCount} dictionary files.`);

    console.log("Calculating final word count...");
    const finalCount = countWords();
    const diff = finalCount - initialCount;

    console.log("----------------------------------------");
    console.log(`Final word count: ${formatNumber(finalCount)}`);
    console.log(`Change: ${diff > 0 ? "+" : ""}${formatNumber(diff)} words`);
    console.log("----------------------------------------");
  } catch (error) {
    console.error("Error updating dictionary:", error);
    process.exit(1);
  }
}

main();

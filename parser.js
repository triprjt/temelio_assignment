import fs from "fs";

function readFile(path) {
  return fs.readFileSync(path, "utf8");
}

function writeFile(path, data) {
  fs.writeFileSync(path, data);
}

function parseSubmission(submission) {
  //   return submission;
  return JSON.parse(submission);
}
const listOfKeys = [
  "legalName",
  "name",
  "stage",
  "grantAmount.minAmount",
  "grantAmount.maxAmount",
  "awardedAmount",
  "grantType",
  "tags",
  "pipelineInfo.name",
  "pipelineInfo",
  "nonprofit.legalName",
  "duration.start",
  "duration.end",
  "id",
];
function isNestedObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}
function objectParserLogic(obj, accumulatedObj = {}, parentKey = null) {
  for (const key in obj) {
    const currentValue = obj[key];
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (isNestedObject(currentValue)) {
      objectParserLogic(obj[key], accumulatedObj, fullKey);
    } else if (listOfKeys.includes(fullKey)) {
      accumulatedObj[fullKey] = obj[key];
    }
  }
  return accumulatedObj;
}
function writeToCSV(data, fileName) {
  const headers = [
    "nonprofit.legalName",
    "name",
    "stage",
    "grantAmount.minAmount",
    "awardedAmount",
    "grantType",
    "tags",
    "pipelineInfo.name",
    "duration.start",
    "duration.end",
    "id",
  ];
  const hashmap = {
    id: "Grant submission ID",
    "nonprofit.legalName": "Organisation legal name",
    name: "Grant submission name",
    stage: "Stage",
    "grantAmount.minAmount": "Requested amount",
    awardedAmount: "Awarded amount",
    grantType: "Grant type",
    tags: "Tags",
    "pipelineInfo.name": "Pipeline/Workflow Associated",
    "duration.start": "Duration start",
    "duration.end": "Duration end",
  };

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date
      .getFullYear()
      .toString()
      .slice(-2)}`;
  }
  let csvContent =
    headers.map((header) => hashmap[header] || header).join(",") + "\n";
  data.forEach((obj) => {
    const row = headers.map((header) => {
      let value = obj[header];
      if (Array.isArray(value)) {
        value = value.join(";");
      }
      if (header === "duration.start" || header === "duration.end") {
        value = formatDate(value);
      }
      if (value === null) {
        value = "";
      }
      // Handle values that might contain commas
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes(";"))
      ) {
        value = `"${value}"`;
      }
      return value;
    });
    csvContent += row.join(",") + "\n";
  });
  writeFile(fileName, csvContent);
}
function main() {
  const submission = readFile("./submissions.json");
  const parsedSubmission = parseSubmission(submission);

  const formattedResults = parsedSubmission.responses.map((response) =>
    objectParserLogic(response, {})
  );

  writeFile("./finalResult.json", JSON.stringify(formattedResults, null, 2));
  writeToCSV(formattedResults, "./resultOutput.csv");
}

main();

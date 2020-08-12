const core = require('@actions/core');
const github = require('@actions/github');
const {promisify} = require('util');
const { appendFile, exists, writeFile, stat, readFileSync } = require("fs");

const appendFileAsync = promisify(appendFile);
const existsAsync = promisify(exists);
const writeFileAsync = promisify(writeFile);
const statAsync = promisify(stat);

main().catch((error) => setFailed(error.message));

async function main() {
  try {
    // `who-to-greet` input defined in action metadata file
    let prBody = github.context.payload.pull_request.body ? github.context.payload.pull_request.body : '';
    const prLink = github.context.payload.pull_request.html_url;
    const prNum = github.context.payload.pull_request.number;
  
    if (prBody.indexOf('-->') !== -1) {
      prBody = prBody.split("-->")[1];
    }
    const feature = prBody.indexOf('[Feature]');
    const patch = prBody.indexOf('[Patch]'); 
    const release = prBody.indexOf('[Release]');

    const changelogLocation = feature !== -1 ? feature :
      (patch !== -1 ? patch : release)
    if (changelogLocation === -1) {
      return;
    }
    const changelogKey = feature !== -1 ? '[Feature]' :
    (patch !== -1 ? '[Patch]' : '[Release]')

    let prSplit = prBody.split(changelogKey)[1];

    prSplit = prSplit.split("\n")[0];
    console.log("prSplit");
    console.log(prSplit);
    let changelogLine = `- ${changelogKey}${prSplit}`
    changelogLine += ` ([#${prNum}](${prLink}))`;

    const path = "./Readme.md";
    const fileContents = readFileSync(path,'utf8');
    console.log("splitting file");
    const splitFile = fileContents.split("## Unreleased\n");
    let finalContents = `${splitFile[0]}## Unreleased\n`;
    finalContents += changelogLine;
    finalContents += "\n";
    finalContents += splitFile[1];

    await writeFileAsync(path, finalContents);
    // const statResult = await statAsync("./Readme.md");
    // setOutput("size", `${statResult.size}`);
    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}
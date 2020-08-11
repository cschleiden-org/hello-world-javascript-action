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

    let prSearchableBody = prBody;
    if (prBody.search('-->') !== -1) {
      prSearchableBody = prBody.split("-->");
    }
    const feature = prSearchableBody.search('[Feature]');
    const patch = prSearchableBody.search('[Patch]'); 
    const release = prSearchableBody.search('[Release]');
    const changelogLocation = feature !== -1 ? feature :
      (patch !== -1 ? patch : release)
    if (changelogLocation === -1) {
      return;
    }
    const changelogKey = feature !== -1 ? '[Feature]' :
    (patch !== -1 ? '[Patch]' : '[Release]')

    let prSplit = prSearchableBody.split(changelogKey)[1];
    prSplit = prSplit.split("\n")[0];
    const changelogLine = `\n- ${changelogKey}${prSplit} ([#${prNum}](${prLink}))`;
    // let prSplit = prName.split("(");
    // let changelogLine = "\n- ";
    // switch (prSplit[0]) {
    //   case 'feat':
    //     changelogLine += "[Feature]";
    //     break;
    //   case 'patch':
    //     changelogLine += "[Patch]";
    //     break;
    //   case 'real':
    //     changelogLine += "[Release]";
    //     break;
    //   default:
    //     return;
    // }
    // prSplit = prSplit[1].split(")");
    // changelogLine += `${prSplit[1]} in **${prSplit[0]}** ([#${prNum}](${prLink}))`;
    // console.log(changelogLine);

    const path = "./Readme.md";
    const fileContents = readFileSync(path,'utf8');
    const splitFile = fileContents.split("## Unreleased\n");
    let finalContents = `${splitFile[0]}## Unreleased\n`;
    finalContents += changelogLine;
    // console.log(splitFile[1][0:10])
    if (splitFile[1][2] == "#") {
      finalContents += "\n";
    }
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
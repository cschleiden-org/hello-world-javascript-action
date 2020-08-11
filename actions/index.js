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
    const prName = github.context.payload.pull_request.title;
    const prLink = github.context.payload.pull_request.html_url;
    const prNum = github.context.payload.pull_request.number;
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

    // const path = "./Readme.md";
    // const fileContents = readFileSync(path,'utf8');
    // const splitFile = fileContents.split("## Unreleased\n");
    // let finalContents = `${splitFile[0]}## Unreleased\n`;
    // finalContents += changelogLine;
    // // console.log(splitFile[1][0:10])
    // if (splitFile[1][2] == "#") {
    //   finalContents += "\n";
    // }
    // finalContents += splitFile[1];

    // await writeFileAsync(path, finalContents);
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
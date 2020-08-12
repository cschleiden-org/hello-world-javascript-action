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
    // Get PR information
    let prBody = github.context.payload.pull_request.body;
    const prLink = github.context.payload.pull_request.html_url;
    const prNum = github.context.payload.pull_request.number;
  
    // Parse out the explanation comment if necessary
    if (prBody.indexOf('-->') !== -1) {
      prBody = prBody.split("-->")[1];
    }

    // Find the location of the changelog line in the PR comment
    const feature = prBody.indexOf('[Feature]');
    const patch = prBody.indexOf('[Patch]'); 
    const release = prBody.indexOf('[Release]');

    const changelogLocation = feature !== -1 ? feature :
      (patch !== -1 ? patch : release)
    // if not present quit action
    if (changelogLocation === -1) {
      core.setOutput("success", false);
      return;
    }

    // Get the changelog line
    const changelogKey = feature !== -1 ? '[Feature]' :
    (patch !== -1 ? '[Patch]' : '[Release]')
    let prSplit = prBody.split(changelogKey)[1];
    prSplit = prSplit.split(/\r?\n/)[0];
    
    // format the final changelog line
    let changelogLine = "- ";
    changelogLine = changelogLine.concat(changelogKey, prSplit, " ([#", prNum, '](', prLink, "))");

    // get the changelog file
    const path = "./CHANGELOG.md";
    const fileContents = readFileSync(path,'utf8');

    // Parse through the changelog to find insertion point
    const splitFile = fileContents.split("## Unreleased\n");
    let finalContents = `${splitFile[0]}## Unreleased\n`;

    // add the the changelogline
    finalContents += changelogLine;
    finalContents += "\n";
    finalContents += splitFile[1];

    // write to file
    await writeFileAsync(path, finalContents);

    core.setOutput("success", true);
  } catch (error) {
    core.setFailed(error.message);
  }
}
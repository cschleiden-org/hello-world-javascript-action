const core = require('@actions/core');
const github = require('@actions/github');
const {promisify} = require('util');
const { appendFile, exists, writeFile, stat } = require("fs");

const appendFileAsync = promisify(appendFile);
const existsAsync = promisify(exists);
const writeFileAsync = promisify(writeFile);
const statAsync = promisify(stat);

main().catch((error) => setFailed(error.message));

async function main() {
  try {
    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput('who-to-greet');
    console.log(`Hello ${nameToGreet}!`);
    console.log(github.context.payload.pull_request.title);
    await appendFileAsync("./Readme.md", "\n New line");
    const statResult = await statAsync("./Readme.md");
    setOutput("size", `${statResult.size}`);
    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    // const payload = JSON.stringify(github.context.payload, undefined, 2)
    // console.log(`The event payload: ${payload}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}
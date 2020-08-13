const core = require('@actions/core');
const github = require('@actions/github');
const {promisify} = require('util');
const { appendFile, exists, writeFile, stat, readFileSync, write } = require("fs");

const appendFileAsync = promisify(appendFile);
const existsAsync = promisify(exists);
const writeFileAsync = promisify(writeFile);
const statAsync = promisify(stat);

main().catch((error) => setFailed(error.message));

async function writeToFile(changelogLine) {
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
}

async function main() {
  try {
    const {
      payload
    } = github.context;
    // Get PR information
    // const payload2 = JSON.stringify(payload, undefined, 2)
    // console.log(`The event payload: ${payload2}`);
    let prBody = payload.pull_request.body;
    const prLink = payload.pull_request.html_url;
    const prNum = payload.pull_request.number;

    if (!payload.pull_request.head.repo) {
      core.info('unable to determine repository from request type');
      core.setOutput("success", false);
      return;
    }
    console.log("prBody", prBody);
    console.log("prLink", prLink);
    console.log("PrNum", prNum);
    const full_name = payload.pull_request.head.repo.full_name;
    console.log("full_name", full_name);
    const [owner, repo] = full_name.split('/');

    const repoToken = process.env['GITHUB_TOKEN'];
    const octokit = github.getOctokit(repoToken);
  
    // Parse out the explanation comment if necessary
    if (prBody.indexOf('-->') !== -1) {
      console.log("prBody -->", prBody);
      prBody = prBody.split("-->")[1];
    }
    // Find the location of the changelog line in the PR comment
    const feature = prBody.indexOf('[Feature]');
    const patch = prBody.indexOf('[Patch]'); 
    const release = prBody.indexOf('[Release]');

    const changelogLocation = feature !== -1 ? feature :
      (patch !== -1 ? patch : release)

    let foundline = true;
    let pushComment = true;
    let commentMessage = ":warning: No Changelog line provided, please update Changelog.md";
    
    const prComments = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: prNum,
    });

    let lastComment = "";
    if (prComments.data.length > 0) {
      lastComment = prComments.data.pop().body;
    } 
    // if not present quit action
    if (changelogLocation === -1) {
      if (lastComment === commentMessage ) {
        pushComment = false;
      }
      foundline = false;
    } else {

      // Get the changelog line
      const changelogKey = feature !== -1 ? '[Feature]' :
      (patch !== -1 ? '[Patch]' : '[Release]')
      console.log("prBody changekey", prBody);
      let prSplit = prBody.split(changelogKey)[1];
      console.log("prSplit rn", prSplit);
      prSplit = prSplit.split(/\r?\n/)[0];
      
      // format the final changelog line
      let changelogLine = "- ";
      changelogLine = changelogLine.concat(changelogKey, prSplit, " ([#", prNum, '](', prLink, "))");

      console.log("lastComment", lastComment);
      lastComment = lastComment.split("```\n")[1];
      lastComment = lastComment.split("\n```")[0];
      if (lastComment === changelogLine) { pushComment= false}

      await writeToFile(changelogLine);
      commentMessage= ":tada:  Updated the Unreleased section of the Changelog with: \n```\n".concat(changelogLine, "\n```");
    }

    // if (shouldCreateComment) {
    if (pushComment) {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNum,
        body: commentMessage,
      })
    }
      // }

    //  core.setOutput('comment-created', 'true')
    //} else {
    //   core.setOutput('comment-created', 'false')
    // }
    console.log("success", !foundline);

    core.setOutput("success", foundline);
  } catch (error) {
    core.setFailed(error.message);
  }
}
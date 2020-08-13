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
    const {
      payload: {pull_request: number, html_url, body, repository},
      sha: commitSha,
    } = github.context;
    // Get PR information
    let prBody = body;
    const prLink = html_url;
    const prNum = number;
  
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

    let foundline = true;
    // if not present quit action
    if (changelogLocation === -1) {
      core.setOutput("success", false);
      foundline= false;
    } else {

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
    }

    // start process for writing PR comment
    if (!repository) {
      core.info('unable to determine repository from request type')
      return;
    }
    
    const {full_name: repoFullName} = repository;
    const [owner, repo] = repoFullName.split('/');

    const repoToken = process.env['GITHUB_TOKEN'];
    const octokit = github.getOctokit(repoToken)
    
    let shouldCreateComment = true

    // if (!allowRepeats) {
    //   core.debug('repeat comments are disallowed, checking for existing')

    //   const {data: comments} = await octokit.issues.listComments({
    //     owner,
    //     repo,
    //     issue_number: issueNumber,
    //   })

    //   if (isMessagePresent(message, comments, repoTokenUserLogin)) {
    //     core.info('the issue already contains an identical message')
    //     shouldCreateComment = false
    //   }
    // }
    let message = ":warning: No Changelog line provided, please update Changelog.md"
    if (foundline) {
      message= ":tada: Updated the Unreleased section of the Changelog with `" + changelogLine + "`"
    }

    // if (shouldCreateComment) {
        await octokit.issues.createComment({
          owner,
          repo,
          issue_number: prNum,
          body: message,
        })
      // }

    //  core.setOutput('comment-created', 'true')
    //} else {
    //   core.setOutput('comment-created', 'false')
    // }
    

    core.setOutput("success", true);
  } catch (error) {
    core.setFailed(error.message);
  }
}
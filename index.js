const axios = require('axios');
const core = require('@actions/core');
const fs = require('fs');

const BASE_URL = core.getInput('base-url');
const API_KEY = core.getInput('api-key');
const TEST_CASE_SET_ID = core.getInput('test-case-set-id');


// test_case_set_id: int
// git_repo_url: str
// git_branch: str
// git_commit_hash: str

const repository = process.env.GITHUB_REPOSITORY;
const GIT_REPO_URL = `https://github.com/${repository}.git`;
const GIT_BRANCH = process.env.GITHUB_REF.replace('refs/', '');
const GIT_COMMIT_HASH = process.env.GITHUB_SHA;

async function callEndpoint() {

  const body = {
    test_case_set_id: TEST_CASE_SET_ID,
    git_repo_url: GIT_REPO_URL,
    git_branch: GIT_BRANCH,
    git_commit_hash: GIT_COMMIT_HASH,
  };

  try {
    const response = await axios({
      method: 'POST',
      url: `${BASE_URL}/api/evals/git`,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: body,
    });

    console.log('Success:', response.data);

    const result = {
      batchUrl: `${BASE_URL}/sessions?run_session_batch_ids=${response.data.batch_id}`,
      batchId: response.data.batch_id,
      sessionIds: response.data.session_ids,
    }

    // Set the outputs for GitHub Actions
    core.setOutput('batch-url', result.batchUrl);
    core.setOutput('batch-id', result.batchId);
    core.setOutput('session-ids', result.sessionIds);

    core.summary.addRaw(JSON.stringify(result, null, 2));

    // Add a more detailed summary
    await core.summary
      .addHeading('Plato Test Results')
      .addTable([
        [{data: 'Metric', header: true}, {data: 'Value', header: true}],
        ['Batch URL', result.batchUrl],
        ['Batch ID', result.batchId],
        ['Session IDs', result.sessionIds.join(', ')]
      ])
      .write();

    // Add a comment to the pull request if this is a PR
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
      const context = github.context;

      await octokit.rest.issues.createComment({
        ...context.repo,
        issue_number: context.payload.pull_request.number,
        body: `### Plato Test Results
- [View Results](${result.batchUrl})
- Batch ID: ${result.batchId}
- Session IDs: ${result.sessionIds.join(', ')}`
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

callEndpoint();

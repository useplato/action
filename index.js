const axios = require('axios');
const core = require('@actions/core');

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
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

callEndpoint();

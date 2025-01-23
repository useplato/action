const https = require('https');
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
const branchRef = process.env.GITHUB_REF; // e.g., "refs/heads/main"
const branch = branchRef.replace('refs/heads/', ''); // Extract "main"
const GIT_BRANCH = branch;
const GIT_COMMIT_HASH = process.env.GITHUB_SHA;

async function callEndpoint() {
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      test_case_set_id: TEST_CASE_SET_ID,
      git_repo_url: GIT_REPO_URL,
      git_branch: GIT_BRANCH,
      git_commit_hash: GIT_COMMIT_HASH,
    })
  };

  return new Promise((resolve, reject) => {
    const req = https.request(`${BASE_URL}/api/evals/git`, options, (res) => {
      let data = '';

      // Handle stream data
      res.on('data', (chunk) => {
        data += chunk;
      });

      // Handle end of stream
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Request failed with status code ${res.statusCode}`));
          return;
        }

        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(`API returned error: ${response.error}`));
            return;
          }
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    // Handle request errors
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.end();
  });
}

// Run the function
callEndpoint()
  .then(response => {
    console.log('Success:', response);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });

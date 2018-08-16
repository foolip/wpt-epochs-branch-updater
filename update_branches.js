const fetch = require('node-fetch');
const octokit = require('@octokit/rest')();

async function updateBranch(branch, sha) {
    try {
        console.log(`Updating ${branch} (${sha})`);
        await octokit.gitdata.updateReference({
            owner: 'web-platform-tests',
            repo: 'wpt',
            ref: `heads/${branch}`, // no leading 'refs/'
            sha: sha,
            force: true,
        });
    } catch (e) {
        console.log(`Creating ${branch} (${sha}) instead`);
        await octokit.gitdata.createReference({
            owner: 'web-platform-tests',
            repo: 'wpt',
            ref: `refs/heads/${branch}`, // must start with 'refs/'
            sha: sha,
        });
    }
}

async function main() {
    const latest = await (await fetch('https://wpt.fyi/api/revisions/latest')).json();

    octokit.authenticate({
        type: 'token',
        token: process.env.GH_TOKEN,
    });

    for (const epoch of latest['epochs']) {
        // ignore epochs faster than daily
        if (epoch.min_duration_sec < 24*3600) {
            continue;
        }
        const id = epoch.id;
        const sha = latest.revisions[id].hash;

        await updateBranch(`epochs/${id}`, sha);
    }
}

main();

const github = require('github-user-contributions');
const clientId = '167ded022abc0fc4e6cc';
const clientSecret = 'd214eda008ca408c21707a5a22dcca82df23ad13';
const moment = require('moment');

const client = github.client(clientId, clientSecret);

const today = moment(moment().format(), 'YYYY-MM-DD h:mm:ss');

client.commits('KoheiMisu', function(err, data) {
  if (err) {
    return console.error(err);
  }
  data.forEach(printRepositoryCommits);
});

function printRepositoryCommits(branches) {
  let response = {
    repository: '', // name of repository is stored under each branch object
    branches: [], // list of branches where commits occured
    commits: [],
  };

  let commitsTree = {};
  branches.forEach(function(branch) {
    // console.log(branch);
    response.repository = branch.repository;
    let commits = branch.commits;

    if (commits.length) {
      response.branches.push(branch.branch);
      commits.forEach(function(c) {
        let sha = c.sha;
        
        // we won't log duplicated commits that appears on another branch
        // neither if they are merge commits
        if (!(commitsTree.hasOwnProperty(sha) || c.parents.length > 1)) {
          let commit = c.commit;
          
          if (moment(commit.author.date).format('YYYY-MM') == '2017-07') {
          // if (today.diff(moment(commit.author.date, 'YYYY-MM-DD h:mm:ss'), 'days') == 0) {
            commitsTree[sha] = {
              sha: sha,
              author: commit.author.name,
              date: moment(commit.author.date).format('YYYY-MM-DD h:mm:ss'),
              message: commit.message,
              url: commit.url,
            };
          }
        }
      });
    }
  });

  let shas = Object.keys(commitsTree);
  if (shas.length) {
    response.commits = shas.map(function(sha) {
      return commitsTree[sha];
    });
    if (Object.keys(response.commits).length > 0) {
      // Store Objectをグローバルにおく？
    }
  }
}

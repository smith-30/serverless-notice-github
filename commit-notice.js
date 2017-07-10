'use strict';

const github = require('github-user-contributions');
const clientId = process.env.github_client_id;
const clientSecret = process.env.github_client_secret;
const moment = require('moment');
const request = require('request');
const async = require('async');

const client = github.client(clientId, clientSecret);
const webhookUrl = process.env.slack_webhook_url;
const githubUserName = process.env.github_user_name;

const today = moment(moment().format(), 'YYYY-MM-DD h:mm:ss');

let count = 0;

module.exports.notice = function(event, context) {
  client.commits(githubUserName, function(err, data) {
    if (err) {
      return console.error(err);
    }
    data.forEach(printRepositoryCommits);
    
    let message = 'There was a commit today!!';
    let emoji = ':ghost:';
    
    if (count === 0) {
      message = 'You have not committed today';
      emoji = ':fearful:';
    }
  
    /**
     * webhook でチャンネルにメッセージを返す
     */
    let options = {
      uri: webhookUrl,
      headers: { 'Content-Type': 'application/json' },
      json: {
        username: 'github',
        icon_emoji: emoji,
        text: message,
      },
    };
  
    request.post(options, function(error, response, body){
      if (!error && response.statusCode == 200) {
        console.log(body);
      } else {
        console.log('error: '+ response.statusCode + '\n' + response.body);
      }
    });
  });
};

/**
 * @param branches
 */
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
          
          if (today.diff(moment(commit.author.date, 'YYYY-MM-DD h:mm:ss'), 'days') == 0) {
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
      count++;
    }
  }
}

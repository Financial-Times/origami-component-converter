workflow "run tests" {
  on = "push"
  resolves = ["GitHub Action for npm"]
}

action "npm install" {
  uses = "actions/npm@3c8332795d5443adc712d30fa147db61fd520b5a"
  args = "install"
}

action "GitHub Action for npm" {
  uses = "actions/npm@3c8332795d5443adc712d30fa147db61fd520b5a"
  args = "test"
  needs = ["npm install"]
}

# “Scales” for Git Things Done

A weight tracker for [Git Things Done](https://github.com/git-things-done/gtd).


## Workflow

```yaml
name: Scales
on:
  issue_comment:
    types:
      - created
    # - edited   #TODO
    # - deleted  #TODO
jobs:
  scales:
    runs-on: ubuntu-latest
    if: github.event.issue_comment.user.login != 'github-actions[bot]'
    steps:
      - uses: actions/checkout@v2
      - uses: fregante/setup-git-user@v1
      - uses: git-things-done/scales@main
        with:
          height: 5'7"  # optional for BMI
```

## Usage

Enter a new comment whenever you take your weight:

```markdown
# Weight

167 lbs
```

> Yes, yes, the units are required. Indeed, this should be a configuration
> option. Fork and fix!

A file will be created or edited in your repository `weight.json`. The comment will be replaced with a markdown table showing your stats.

## Units

Yes, yes we only take imperial units currently. Fork and fix!

# Changesets

This folder contains [changesets](https://github.com/changesets/changesets) for this repository.

When you make a change that should be released, add a changeset:

```bash
pnpm changeset
```

Commit the generated Markdown file with your change. The release workflow
collects pending changesets into a "Version Packages" pull request; merging that
pull request publishes the new version to npm and creates the GitHub release.

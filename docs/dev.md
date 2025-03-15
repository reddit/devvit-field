# Development

Supplemental development notes.

## Codeveloping Dependencies

It's often useful to codevelop dependencies by linking them because it doesn't
require publishing. The workflow is usually:

1. `npm install` (if not already done).
2. `npm link <local dep1> <local dep2> <local dep3>...` (must specify all
   linkage in one command). @devvit/public-api is required. Verify symbolic links
   to your local folders with `ls -l node_modules/@devvit`.
3. Start playtest.
4. Edit and build dependencies as needed.
5. Cleanup; unlink all dependencies by re-running `npm install`.
   `npm link --save-dev` if you want links to persist past install.

<details markdown>
<summary>@devvit polyrepo example…</summary>

```bash
npm link \
  ~/work/reddit/src/devvit/packages/protos \
  ~/work/reddit/src/devvit/packages/public-api
```

</details>

## Ignoring OS Cache Files

Unwanted environment-specific files such as `.DS_Store` and `Thumbs.db` should
be excluded by the user's global Git configuration. They're unwanted in every
repository and not specific to play. See
[gitignore documentation](https://git-scm.com/docs/gitignore) for details.

<details markdown>
<summary>`.DS_Store` example…</summary>

1. Add a global exclusions file by executing
   `git config --global core.excludesfile '~/.gitignore'` or updating your
   `~/.gitconfig` manually:

```gitconfig
excludesfile = ~/.gitignore
```

2. Always ignore `.DS_Store` files by executing `echo .DS_Store >> ~/.gitignore`
   or updating your `~/.gitignore` manually:

```gitignore
.DS_Store
```

</details>

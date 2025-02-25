# BanField

## Development

Install all dependencies once after cloning (and whenever they change).

```sh
npm install
```

Run `npm test` to execute tests. See
[supplemental development notes](docs/dev.md).

### Secrets

You will need to add the following secrets to interact with some features of the app. Reach out to a 
team member for dev credentials.

```sh
devvit settings set aws-access-key --config ./devvit.dev.yaml
devvit settings set aws-secret --config ./devvit.dev.yaml
```

### Local Iframe Development

Develop locally for iframe (web view code under src/iframe and src/shared).

```sh
npm start
```

Visit **[http://localhost:1234](http://localhost:1234)** in your web browser. No
code or data is uploaded. Append `?seed=#` to seed.

### Playtest Production and Devvit Blocks

Develop in prod with playtest for Devvit Blocks (src/main.ts, src/devvit, and
src/shared).

First, copy the template and upload an initial version. This only needs to be
done once.

```sh
cp tools/devvit.template.yaml devvit.dev.yaml
# Edit the name field to be uniquely associated to you such as banfieldfoo; it
# must be 16 characters or less.

cp src/devvit/server/core/config.template.json src/devvit/server/core/config.dev.json
# Edit the T3 and T5 IDs at least.

# Un/comment the imports in src/devvit/server/core/levels.ts.

npx devvit upload --config=devvit.dev.yaml
```

Requires global Redis.

Now playtest whenever wanted.

```
npm run playtest -- r/<development subreddit uniquely associated to you>
```

Visit **`https://reddit.com/r/<sub>?playtest&devvitdebug=app`**. Also,
launches [local iframe development](#local-iframe-development).

⚠️ `devvit` logs do not include iframe output.

### NPM Scripts

- `install`: install app dependencies.
- `start`: run development server on
  [http://localhost:1234](http://localhost:1234).
- `playtest r/<sub>`: live-reload on reddit.com. Don't forget to append the
  `?playtest&devvitdebug=app` query parameters to the URL. Also starts the local
  development server.
- `test`: execute all tests. Anything that can be validated automatically before
  publishing runs through this command.
- `run test:unit`: run the unit tests. Pass `--update` to update all test
  snapshots.
- `run format`: apply lint fixes automatically where available.
- `run build`: compile source inputs to artifacts under `dist/` and `webroot/`.
- `run build:atlas`: compile Aseprite assets into atlas (requires `aseprite`).
- `run devvit:install`: build, upload, and install a new version to prod subs.

💡 Add `--` to pass arguments to the script command. For example,
`npm run test:unit -- --update` to update snapshots.

### Project Structure

- **assets**/: Devvit Blocks data uploads.
- **docs**/: supplemental documentation.
- **src**/: source inputs.
  - **devvit**/, **src/main.ts**: Devvit Blocks code.
  - **iframe**/: web view code.
  - **server**/: code that may only execute on the remote and is replaced with
                 circuit breakers in the client app bundle. Secrets too.
  - **shared**/: code that may run in iframe and / or Devvit.
  - **test**/, **\*.test.ts**: tests and test utils.
- **tools**/: development scripts and configs.
- **webroot**/: iframe uploads.
  - **assets**/: iframe data uploads.
  - **index.\***: iframe webpage code uploads.

## Attributions

- [Departure Mono](https://departuremono.com) font created by
  [Helena Zhang](https://helenazhang.com).
- Edit Undo font created by [Brian Kent](mailto:kentpw@norwich.net).

## [License (BSD-3-Clause)](docs/license.md)

# Contributing to Mandhi Calc

Thanks for helping improve the calculator. Small, focused contributions are welcome, including documentation, accessibility improvements, bug reports, and calculation fixes.

## Before you begin

- Check existing issues and pull requests to avoid duplicate work.
- For a substantial feature or a change to billing rules, open a feature request describing the problem and proposed behavior.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- Report vulnerabilities through [SECURITY.md](SECURITY.md), not a public bug report.

## Local setup

Fork the repository on GitHub, clone your fork, and create a branch:

```sh
git clone https://github.com/YOUR-USERNAME/mandhi-calc.git
cd mandhi-calc
git switch -c fix/short-description
npm start
```

Use Node.js 22 or newer and Python 3. No dependency installation or build step is needed. Open `http://localhost:4173` and refresh after edits.

## Making changes

- Edit the source directly in `dist/`.
- Keep calculation rules in `dist/calculator.mjs` and browser interactions in `dist/app.mjs`.
- Preserve the guided order: people, flavors, allocation, order review, then billing.
- Avoid adding dependencies unless they solve a clear problem.
- Treat names and custom flavors as text; do not interpolate unescaped user input into HTML.
- Keep controls labeled, keyboard-accessible, and usable on small screens and in both themes.
- Do not commit credentials, real diner data, private bills, or unrelated files.

### Billing changes

Include a small reproducible example with expected amounts. Tests should verify behavior, especially:

- Full / half / quarter prices belong to their respective consumers.
- Extras are charged only to selected users.
- Both percentage and direct-amount GST work.
- Missing prices or consumers do not produce a finalized bill.
- Individual amounts add up to the bill in whole paise.
- Final-bill adjustments do not apply tax twice.

## Validation

```sh
npm test
node --check dist/app.mjs
node --check dist/calculator.mjs
git diff --check
```

For interface changes, also check the full five-step flow, back navigation, custom flavors, smaller screens, keyboard interaction, saved data, and the copy summaries. Add screenshots for visible changes and describe any checks you could not run. Documentation-only changes do not need application tests.

## Pull requests

Push your branch and open a pull request against `main`. Explain the problem, the resulting behavior, and how you verified it. Keep the change focused; avoid unrelated formatting or refactoring.

There is no guaranteed review timeline. The maintainer may request changes or discuss alternatives before merging. Contributions are made under the project's [MIT license](LICENSE).

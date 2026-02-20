# Changelog

All notable changes to this project will be documented in this file. Dates use ISO 8601 formatting, and version numbers follow [Semantic Versioning](https://semver.org/).

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [1.1.6] - 2026-02-20
### Fixed
- Update trap focus logic to ignore hidden elements, selecting only visible focusable ones

### Added
- Informational debug statements for focus management
- Example JS now toggles `inert` on `<main>` when a modal opens

## [1.1.5] - 2026-02-19
### Fixed
- Remove the unnecessary `isToggle` parameter type definition from the `.d.ts` file.

## [1.1.4] - 2026-02-16
### Fixed
- Improve overlayless modal close logic. Removed the `isToggle` parameter from `removeA11yEvents` as it is no longer needed. The logic now works more smoothly, only unregisters modals in `removeA11yEvents` instead of the close handler wrapper, and preserves the overlayless modal bypass behavior

### Changed
- Update documentation, method order and chaining, and debug statements

## [1.1.3] - 2026-02-16
### Fixed
- Add missing parameter titles to `README.md`. 

## [1.1.2] - 2026-02-15
### Fixed
- Unify `README.md` formatting for all bullet points. Previously, in some Markdown views, the bullet points format from the `addA11yEvents` method was broken due to a code block. This has been corrected so everything now displays consistently.

## [1.1.1] - 2026-02-15
### Fixed
- Fix typos, update changelog, and add an example wrapper usage for the `closeHandler`.

## [1.1.0] - 2026-02-15
### Added
- Support automatic modal key generation
- Add a manual method to rebind the trap focus handler

### Changed
- Improve automation and simplify logic flow
- Improve event-bubbling guard by binding the overlay method with `capture: true` and removing the dependency on asynchronous behavior and `e.stopPropagation`
- Extend `closeHandler` method with a new `modalKey` parameter for caller usage

### Fixed
- Prevent overlayless modals from breaking the stacking order

## [1.0.3] - 2026-01-23
### Fixed
- Improve `README.md` format for usage section

## [1.0.2] - 2026-01-23
### Fixed
- Update `package.json` keywords

## [1.0.1] - 2026-01-23
### Fixed
- Update installation instructions for `README.md`

## [1.0.0] - 2026-01-23
### Added
- Initial release

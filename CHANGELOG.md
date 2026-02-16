# Changelog

All notable changes to this project will be documented in this file. Dates use ISO 8601 formatting, and version numbers follow [Semantic Versioning](https://semver.org/).

The format is based on [Keep a Changelog](https://keepachangelog.com/).

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
- Improved `README.md` format for usage section

## [1.0.2] - 2026-01-23
### Fixed
- Updated `package.json` keywords

## [1.0.1] - 2026-01-23
### Fixed
- Updated installation instructions for `README.md`

## [1.0.0] - 2026-01-23
### Added
- Initial release

# Changelog
All notable changes to this project will be documented in this file.

## [unreleased]
- TODO

## [1.7.0] - 2022-12-15
### Fixed
- Refactored the schema and validation modules to allow for more flexibility. (You can now put an $or operation at the root of the schema or validate arrays right away)

## [1.6.6] - 2022-12-13
### Fixed
- integer option not properly checked

## [1.6.5] - 2022-12-13
### Fixed
- $or operator bug when there is no match
- When an Array has a minEntries value abore 0, it automatically gets marked as required.
### Added
- Added enum property to Mixed validator.

## [1.6.0] - 2022-12-12
### Added
- Added enum property to Number validator.

## [1.5.0] - 2022-11-25
### Fixed
- Fixed Readme file. Was still using lowercase minlength instead of minLength in examples.

## [1.4.0] - 2022-03-14
### Added
- Added Mixed type to ElValidator for validating mixed inputs.
- Added Types static property to ElValidator.

## [1.3.0] - 2022-03-06
### Fixed
- Fixed minLength not being registered during checkSchema step.

## [1.2.0] - 2022-03-06
### Changed
- Renamed minlength and maxlength options to minLength and maxLength to match mongoose's schema.

## [1.1.0] - 2022-03-06
### Fixed
- Schema checker bug solved where name/type fields were being overwritten in the case of a sub-schema.

## [1.0.0] - 2022-03-05
### Added
- Initial implementation of the library

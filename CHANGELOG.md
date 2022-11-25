# Changelog
All notable changes to this project will be documented in this file.

## [unreleased]
- TODO

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

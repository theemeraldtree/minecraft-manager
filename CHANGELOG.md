# Changelog

Changelogs for development versions are located in their corresponding branch.

## 2.4.4

#### Currently WIP

### Features

- Massive performance improvements

### Fixes

- Search in Discover is no longer slow


## 2.4.3

#### Released 2020-05-18

### Features

- New, experimental privacy-respecting analytics
- New hover effect on buttons and cards

### Changed

- Small UI improvements

## 2.4.2

#### Released 2020-05-11

### Changed

- The application is now installed per user instead of per system

### Fixed

- Crash loading mods list
- Update throwing error
- Fixed bugs in Welcome page
- Missing mods from Curse cancelling install

### Removed

- Removed .mcjprofile file association

## 2.4.1

#### Released 2020-05-09

### Features

- New sidebar design in Edit Pages and Settings
- Improved UI consistency
- Better usage via keyboard
- Improved Error Handling

## 2.4.0

#### Released 2020-04-13

### Features

- Added a cool loading spinner
- Launch directly (bypass the Minecraft Launcher)
- Better error handling
- Minecraft Options, OptiFine Options, and Servers list are automatically copied on Profile creation
- Downloads Viewer is now transparent

### Removed

- Removed "in-game defaults" (e.g. autojump, tutorial) as those are now inferred from your Latest release Options

## 2.3.8

#### Released 2020-04-10

### Security

- Fixed "kind-of" security vulnerability (CVE-2019-20149)

### Features

- Detailed logging is now saved to disk

### Fixes

- Fixed inconsistencies in capitalization

## 2.3.7

#### Released 2020-04-08

### Fixes

- Fixed Dependencies not downloading correctly
- Fixed Fabric not showing install complete
- Fixed Snapshots running in seperate folders
- Fixed "Open Profile Folder" button

### Features

- Allow syncing of Minecraft Options, OptiFine Options, and Servers
- Allow copying of Options and Servers

### Changed

- Reorganized Edit Advanced page

## 2.3.6

#### Released 2020-03-23

### Fixes

- Fixed Downloads not appearing in the viewer
- Fixed a small Toast bug

## 2.3.5

#### Released 2020-03-22

### Features

- Dropdowns for Minecraft Versions now include search and type selection
- Sort and Filter when adding assets from CurseForge
- Improve modloader installation
  - Allow installing of custom versions
- Add Full License Disclaimer to About Page
- Show Downloads info in Asset Cards
- The option to disable News checks on start up
- MultiMC Importing (experimental)
- Release date is now shown on versions
- Added the option to run the Snapshot profile in the same game directory as Latest release

### Changed

- Adjusted spacing between Profiles
- "Framework is installing" persists between edit page changes
- Downloads are now logged in the main process console
- Improve CurseForge HTML rendering
- Improve About page
- Improve Update dialog

### Fixes

- Fixed Notice Toasts staying on the screen for a long time
- Fix clicking away from dropdowns
- Fixed Minecraft Version selection bugs
- Fix all Toasts dissappearing when one was dismissed

## 2.3.4

#### Released 2020-03-17

Version for testing GitHub Actions and Releases. No new features or bug fixes.

## 2.3.3

#### Released 2020-03-17

Version for testing GitHub Actions and Releases. No new features or bug fixes.

## 2.3.2

#### Released 2020-03-17

Version for testing GitHub Actions and Releases. No new features or bug fixes.

## 2.3.1

#### Released 2020-03-16

Minecraft Manager 2.3.1 includes Worlds, Datapacks, UI Improvements, and more.

### New Features

- Improved Auto-Import of Resource Packs ands mods
- Support for Datapack Management
- Support for Worlds
  - Both Worlds and Datapacks are automatically imported.
- New Default Profiles
  - Latest Version and Latest Snapshot are available
  - Latest Snapshot is turned off by default, but can be enabled with a new settings
- Improved Crash UI
- Add "Data Dump"
- "Copy to..." and "Move to..." with assets
- New Profile Default: Show Multiplayer Content Warning Screen
- Automatically infer amount of dedicated RAM on install
- UI Tweaks
  - Asset Cards increase in size on hover
  - You can now select UI Elements with the keyboard

### Bug Fixes

- Linux support is improved
- Fix "HTTPS Required" error for certain Minecraft libraries.

#### [View older changelogs here](https://theemeraldtree.net/mcm/changelogs/)

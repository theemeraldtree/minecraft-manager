# Minecraft Manager 3

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0) ![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/theemeraldtree/minecraft-manager/major)

Minecraft Manager is an experimental Minecraft launcher that lets you easily manage multiple instances. You can install mods, modpacks, and more in a clean, user-friendly interface.

## Features

- Install mods, modpacks, resource packs, and worlds directly from CurseForge
- Modern, user-friendly, and powerful interface
- Supports import and export for Twitch and MultiMC formats 

Not all features are currently working. **This is a development branch. Nothing is guaranteed to be stable**.

## Getting Started

If you'd like prebuilt binaries, [you can find them here for Windows, macOS, and Linux](https://theemeraldtree.net/mcm/download).

If you would like to build it and run it for yourself, it's pretty simple

### Clone the repo & install packages

```
git clone https://github.com/theemeraldtree/minecraft-manager.git
cd minecraft-manager
yarn
```

Yarn should be used because of the lockfile.

### Running in a development environment

```
yarn dev
```

This will spawn the Electron process and start webpack-dev-server on port 9483.

### Building

The simplest way to build Minecraft Manager is to run

```
yarn package
```

This will compile Webpack, then run electron-builder and compile for your current OS and architecture.
However you can also compile Webpack and electron-builder separately.

To build webpack:

```
yarn compile
```

This will compile Webpack with the settings defined in `webpack.config.json` and place the output in /bundles

To run electron-builder

```
yarn build
```

This will run electron-builder for your current OS and architecture, and place the output in /dist

### Credits

Credits are viewable in the Settings menu of Minecraft Manager. You can also find a list of every package used in `package.json`.

### License

Minecraft Manager is licensed under the [GNU General Public License v3.0](https://github.com/theemeraldtree/minecraft-manager/blob/master/LICENSE), a free software license. If you have improvements you would like to make to Minecraft Manager, please consider making a Pull Request - contributions are welcome!

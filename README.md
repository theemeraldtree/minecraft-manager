# [Minecraft Manager](https://theemeraldtree.net/mcm/)

## The easiest way to install Mods, Modpacks, and more

### Install and manage mods, modpacks, worlds, and resource packs with ease

Minecraft Manager is a program used for installation of Minecraft mods, modpacks, resource packs and more.

You can create your own Profile with mods downloaded directly from CurseForge, or download a modpack and have it automatically installed.

## Getting Started

If you'd like prebuilt binaries for Windows, macOS, and Linux, [you can find them here](https://theemeraldtree.net/mcm/download).

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
yarn run dev
```

This will spawn the Electron process and start webpack-dev-server on port 9483.

### Building

The simplest way to build Minecraft Manager is to run

```
yarn package
```

This will compile Webpack, then run electron-builder and compile for your current OS and architecture.
However you can also compile Webpack and electron-builder seperately

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

Credits are viewable in the Settings menu of Minecraft Manager

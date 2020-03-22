# [Minecraft Manager](https://theemeraldtree.net/mcm/)

## The easiest way to manage your Minecraft Launcher

### Install and manage mods, modpacks, worlds, resource packs with ease

Minecraft Manager is a program used for installation of Minecraft mods/modpacks and more.

## Getting Started

If you'd like prebuilt binaries for Windows, macOS, and Linux, [you can find them here](https://theemeraldtree.net/mcm/download).

If you would like to build it and run it for yourself, it's pretty simple

### Clone the repo & install packages

```
git clone https://github.com/theemeraldtree/minecraft-manager.git
cd minecraft-manager
yarn
```

Personally I use Yarn instead of NPM, but you don't have to

### Running in a development environment

```
yarn run dev
```

This will spawn the Electron process and start webpack-dev-server on port 9483.

### Building

The simplest way to build Minecraft Manager is to run

```
yarn run package
```

This will compile Webpack, then run electron-builder and compile for your current OS and architecture.
However you can also compile Webpack and electron-builder seperately

To build webpack:

```
yarn run compile
```

This will compile Webpack with the settings defined in `webpack.config.json` and place the output in /bundles

To run electron-builder

```
yarn run build
```

This will run electron-builder for your current OS and architecture, and place the output in /dist

### Credits

Credits are viewable in the Settings menu of Minecraft Manager

# [Minecraft Manager](https://theemeraldtree.net/mcm/)
## the easiest way to manage minecraft mods/modpacks

Minecraft Manager is a program used for installation of Minecraft mods/modpacks and more.

[theemeraldtree.net/mcm](https://theemeraldtree.net/mcm)

## Getting Started
If you'd like prebuilt version, [you can download it from the website here](https://theemeraldtree.net/mcm/download)

If you would like to build it and run it for yourself, it is very easy.
### Clone the repo & install packages
```
git clone https://github.com/stairman06/minecraft-manager.git
cd minecraft-manager
yarn
```
Yarn is recommended over NPM as it is faster

### Running in a dev environment
```
yarn run dev
```

### Building
The simplest way to build Minecraft Manager is to run
```
yarn run package
```

However if you want to compile webpack or electron-builder seperately, you can either run
```
yarn run compile
```
for webpack, or
```
yarn run build
```
for electron-builder


### Credits
Credits are viewable in the Settings menu of Minecraft Manager

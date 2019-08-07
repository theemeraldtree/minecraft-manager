# [Minecraft Manager](https://theemeraldtree.net)
## app for minecraft mod/modpack installation and management

Minecraft Manager is an app used for installation of Minecraft mods/modpacks and more.

## Getting Started
If you'd like an already built version, [you can download it from the website here](https://theemeraldtree.net/download)

If you would like to build it and run it for yourself, it is very easy.
### Clone the repo & install packages
```
git clone https://github.com/stairman06/minecraft-manager.git
cd minecraft-manager
yarn
```
If you're attempting to build a development version, specify the branch with ```--specify-branch --branch=BRANCHNAME```  
Example: ```git clone --specify-branch --branch=rewrite-2.0 https://github.com/stairman06/minecraft-manager.git```

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
Credits are viewable in the Settings menu of Minecraft Manager, however I've listen them here because why not
- [Electron](https://electronjs.org)
- [React](https://reactjs.org)
- [Webpack](https://webpack.js.org)
- Google Roboto Font

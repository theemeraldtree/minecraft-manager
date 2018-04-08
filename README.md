# Minecraft Manager
Minecraft Manager is an Electron app written using React to help with installation of Minecraft mods and modpacks.

Minecraft Manager was created because of a few reasons. Number one is the Twitch app (which is the standard way of doing modded Minecraft) is bloated, and has many flaws. I didn't need an app full of things like Twitch streamers, and other games. I only wanted Minecraft content. 

I've been working on Minecraft Manager for a while now, and during that time many other launchers have been released. However, none of them provided the functionality that I wanted in a nice, clean looking interface. The app was provided to only friends of mine, but then I decided to open source it after I did a large migration in the code to use styled-components over compiled CSS using Stylus.

## Getting Started
If you're using Windows or Mac, you can grab a build [here](https://theemeraldtree.net/mcm). 

If you're using Linux or any other operating system, or you want to get the latest feature for Mac (as Mac builds are not updates as frequently as Windows builds), you can build the source code:

### Clone the repo and install all necessary packages (needed for both dev environment and build):
```
git clone https://github.com/stairman06/minecraft-manager.git
cd minecraft-manager
yarn
```
Yarn is recommended over NPM

### Running in a developer environment:
```
yarn run dev
```

### Building:
```
yarn run build
yarn run publish
```

## Where does the data come from?
The data for modpacks, mods, and their related info is gathered from [CurseForge](https://minecraft.curseforge.com).

The pages are scraped using [cheerio](https://github.com/cheeriojs/cheerio) to gather info needed to install mods and modpacks

## Acknowledgements
- Base code of the project is [pbarbiero's basic-electron-react-boilerplate](https://github.com/pbarbiero/basic-electron-react-boilerplate)
    - Modified for electron-builder support
- [electron-builder](https://electron.build)
- [react](https://reactjs.org)
- [electron](https://electronjs.org)
- [styled-components](https://styled-components.com)

Many other packages are used such as [adm-zip](https://www.npmjs.com/package/adm-zip), [cheerio](https://github.com/cheeriojs/cheerio), and [archiver](https://www.npmjs.com/package/archiver)
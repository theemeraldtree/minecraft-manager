import winston from 'winston';
import path from 'path';
import 'winston-daily-rotate-file';

const { remote } = require('electron');

const { app } = remote;

const logFormat = winston.format.printf(
  ({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}]: ${message}`
);

const rotateFile = new winston.transports.DailyRotateFile({
  filename: '%DATE%-electron.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '7d',
  createSymlink: true,
  symlinkName: 'latest-electron.log',
  auditFile: path.join(app.getPath('userData'), '/logs/electron-process/.mcm-electron-log-audit.json'),
  dirname: path.join(app.getPath('userData'), '/logs/electron-process'),
  format: winston.format.combine(
    winston.format.uncolorize(),
    winston.format.timestamp(),
    winston.format.align(),
    logFormat
  )
});

const logger = winston.createLogger({
  level: 'info',
  transports: [
    rotateFile,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(info => `${info.level.toLowerCase()}\x1b[32m: ${info.message}`)
      )
    })
  ]
});

function logInit(visibleName) {
  let beginning = `\x1b[36m[${visibleName}]\x1b[37m`;
  if (visibleName.substring(0, 1) === '{') {
    beginning = `\x1b[35m${visibleName}\x1b[37m`;
  }
  const custom = {
    info(text) {
      logger.info(`${beginning} ${text}`);
    },
    error(text) {
      logger.error(`${beginning} ${text}`);
    }
  };

  return custom;
}

export default logInit;

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('handOfGOD', {
  isDesktop: true,
  quit: () => ipcRenderer.send('game:quit'),
  version: () => ipcRenderer.invoke('game:version')
});

const { contextBridge, ipcRenderer } = require('electron');

/*let bridge_addProject = async (key, value) => {
  return await ipcRenderer.invoke('add-project', {key, value});
}

let bridge_getProject = async (key) => {
  return await ipcRenderer.invoke('get-project', key);
}

let bridge_getAllProjects = async () => {
  return await ipcRenderer.invoke('get-all-projects');
}
let bridge_navigate = async (url) => {
  return await ipcRenderer.invoke('navigate', url);
}*/
let bridge_getProcess = async (url) => {
  return await ipcRenderer.invoke('get-process', url);
}

let bridge_saveProcess = async (process) => {
  return await ipcRenderer.invoke('save-process', process);
}
let bridge_selectFile = async () => {
  return await ipcRenderer.invoke('select-file');
}
let bridge_downloadProcess = async (xml, defaultFileName) => {
  return await ipcRenderer.invoke('download-process', xml, defaultFileName);
}

let bridge_downloadSvg = async (svg) => {
  return await ipcRenderer.invoke('download-svg', svg);
}

let bridge_exportAs = async (data) => {
  return await ipcRenderer.invoke('export-as', data);
}

let bridge_saveChanges = async (path, xml) => {
  return await ipcRenderer.invoke('save-changes', path, xml);
}

let bridge_copyFile = (xml) => {
  return ipcRenderer.invoke('copy-file', xml);
}

let bridge_updateWindowTitle = async (fileName, isModified = false) => {
  return await ipcRenderer.invoke('update-window-title', fileName, isModified);
}

let bridge_getWindowTitle = async () => {
  return await ipcRenderer.invoke('get-window-title');
}

// Recent files bridge functions
let bridge_getRecentFiles = async () => {
  return await ipcRenderer.invoke('get-recent-files');
}

let bridge_addRecentFile = async (filePath) => {
  return await ipcRenderer.invoke('add-recent-file', filePath);
}

let bridge_removeRecentFile = async (filePath) => {
  return await ipcRenderer.invoke('remove-recent-file', filePath);
}

let bridge_openRecentFile = async (filePath) => {
  return await ipcRenderer.invoke('open-recent-file', filePath);
}

let bridge_showAboutDialog = async () => {
  return await ipcRenderer.invoke('show-about-dialog');
}

let apis = {
  onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
  onFileOpened: (callback) => ipcRenderer.on('file-opened', callback),
/*  addProject: bridge_addProject,
  getProject: bridge_getProject,
  getAllProjects: bridge_getAllProjects,
  navigate: bridge_navigate,*/
  selectFile: bridge_selectFile,
  getProcess: bridge_getProcess,
  saveProcess: bridge_saveProcess,
  downloadProcess: bridge_downloadProcess,
  downloadSvg: bridge_downloadSvg,
  exportAs: bridge_exportAs,
  saveChanges: bridge_saveChanges,
  copyFile: bridge_copyFile,
  updateWindowTitle: bridge_updateWindowTitle,
  getWindowTitle: bridge_getWindowTitle,
  getRecentFiles: bridge_getRecentFiles,
  addRecentFile: bridge_addRecentFile,
  removeRecentFile: bridge_removeRecentFile,
  openRecentFile: bridge_openRecentFile,
  showAboutDialog: bridge_showAboutDialog,
}


contextBridge.exposeInMainWorld('electronAPI', apis);


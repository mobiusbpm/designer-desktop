const {app, BrowserWindow, dialog, Menu, ipcMain, clipboard} = require("electron");
const url = require("url");
const path = require("path");
const loki = require('lokijs');
const fs = require('fs').promises;
const fsSync = require('fs');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
app.setName('Mobius Designer');

// const the db collection name
const COLLECTION_PROCESSES = 'processes';
const COLLECTION_BPMNFILES = 'bpmnfiles';

// Set the database file path
const dbFilePath = path.join(__dirname, `metadata.db`);
// Create a LokiJS database instance with persistence
const db = new loki(dbFilePath, {
  autoload: true, // Automatically load database
  autosave: true, // Automatically save changes
  autosaveInterval: 4000, // Save interval in ms
  autoloadCallback: databaseInitialize,
});

// Initialize database collections
function databaseInitialize() {
  let processes = db.getCollection(COLLECTION_PROCESSES);
  if (!processes) {
    db.addCollection(COLLECTION_PROCESSES, {key: 'url'});
  }
  let bpmnfiles = db.getCollection(COLLECTION_BPMNFILES);
  if (!bpmnfiles) {
    db.addCollection(COLLECTION_BPMNFILES, {key: 'url'});
  }
}

// create window
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 2560,
    height: 1440,
    icon: path.join(__dirname, 'src/assets/icon-png.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js'), // Ensure secure communication
    },
  });

  // Determine the correct path for index.html
  let indexPath;
  if (fsSync.existsSync(path.join(__dirname, '/dist/mobius-designer-desktop/browser/index.html'))) {
    // Development environment
    indexPath = path.join(__dirname, '/dist/mobius-designer-desktop/browser/index.html');
  } else if (fsSync.existsSync(path.join(__dirname, '/src/index.html'))) {
    // Packaged environment
    indexPath = path.join(__dirname, '/src/index.html');
  } else {
    console.error('Could not find index.html');
    return;
  }

  mainWindow.loadURL(
    url.format({
      pathname: indexPath,
      protocol: "file:",
      slashes: true,
    })
  ).then(r => {});

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  mainWindow.setTitle('Mobius Designer Desktop');

  // Create and set the menu
  createMenu();

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

function createMenu() {
  const menu = Menu.buildFromTemplate(getMenuTemplate());
  Menu.setApplicationMenu(menu);
}

function getMenuTemplate() {
  return [
    ...(process.platform === 'darwin'
      ? [
        {
          label: app.name, // Use the app name
          submenu: [
            {role: 'about', label: `About ${app.name}`},
            {type: 'separator'},
            {role: 'services'},
            {type: 'separator'},
            {role: 'hide'},
            {role: 'hideOthers'},
            {role: 'unhide'},
            {type: 'separator'},
            {role: 'quit', label: `Quit`},
          ],
        },
      ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          role: 'newFile', label: 'New File',
          submenu: [
            {
              label: 'BPMN Diagram',
              click: () => {
                mainWindow.webContents.send('menu-action', 'newBpmn');
              },
              accelerator: 'CmdOrCtrl+N'
            }
          ]
        },
        {type: 'separator'},
        {
          role: 'openFile', label: 'Open File...',
          click: async () => {
            const result = await dialog.showOpenDialog({
              properties: ['openFile'],
              filters: [{name: 'XML Files', extensions: ['xml']}],
            });

            if (!result.canceled) {
              const filePath = result.filePaths[0];
              const content = await fs.readFile(filePath, 'utf-8');
              const menu = 'openFile';
              
              // Update window title when file is opened
              const shortFileName = path.basename(filePath);
              mainWindow.setTitle(`${shortFileName} - Mobius Designer Desktop`);
              
              // Add to recent files
              addToRecentFiles(filePath);
              
              // Update menu to reflect new recent files
              createMenu();
              
              mainWindow.webContents.send('file-opened', menu, {path: filePath, content});
            }
          },
          accelerator: 'CmdOrCtrl+O'
        },
        {
          role: 'openRecent', label: 'Open Recent',
          submenu: getRecentFilesSubmenu(),
        },
        {type: 'separator'},
        {
          role: 'save', label: 'Save',
          click: () => {
            mainWindow.webContents.send('menu-action', 'save');
          },
          accelerator: 'CmdOrCtrl+S'
        },
        {
          role: 'saveAs', label: 'Save As',
          click: () => {
            mainWindow.webContents.send('menu-action', 'saveAs');
          },
          accelerator: 'CmdOrCtrl+Shift+S'
        },
        {type: 'separator'},
        {
          role: 'exportAs', label: 'Export As...',
          click: () => {
            mainWindow.webContents.send('menu-action', 'exportAs');
          },
          accelerator: 'CmdOrCtrl+E'
        },
        {type: 'separator'},
        {
          role: 'close', label: 'Close File',
          click: () => {
            mainWindow.webContents.send('menu-action', 'closeFile');
          },
          accelerator: 'CmdOrCtrl+W'
        },
        {type: 'separator'},
        {role: 'quit', label: 'Quit'},
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          click: () => {
            mainWindow.webContents.send('menu-action', 'undo');
          },
        },
        {
          label: 'Redo',
          click: () => {
            mainWindow.webContents.send('menu-action', 'redo');
          },
        },
        {type: 'separator'},
        {
          label: 'Copy',
          click: () => {
            mainWindow.webContents.send('menu-action', 'copy');
          },
          accelerator: 'CmdOrCtrl+C'
        },
/*        {
          label: 'Cut',
          click: () => {
            mainWindow.webContents.send('menu-action', 'cut');
          },
          accelerator: 'CmdOrCtrl+X'
        },*/
        {
          label: 'Paste',
          click: () => {
            const raw = clipboard.readText();
            mainWindow.webContents.send('menu-action', 'paste', raw);
          },
          accelerator: 'CmdOrCtrl+V'
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          click: () => {
            mainWindow.webContents.send('menu-action', 'zoomIn');
          },
          accelerator: 'CmdOrCtrl+Plus'
        },
        {
          label: 'Zoom Out',
          click: () => {
            mainWindow.webContents.send('menu-action', 'zoomOut');
          },
          accelerator: 'CmdOrCtrl+-'
        },
        {
          label: 'Zoom to Actual Size',
          click: () => {
            mainWindow.webContents.send('menu-action', 'zoomActual');
          },
          accelerator: 'CmdOrCtrl+0'
        },
        {type: 'separator'},
        {
          label: 'Zoom to Fit',
          click: () => {
            mainWindow.webContents.send('menu-action', 'zoomFit');
          },
          accelerator: 'CmdOrCtrl+9'
        },
        {
          role: 'togglefullscreen', label: 'Fullscreen',
          click: () => {
            mainWindow.webContents.send('menu-action', 'fullscreen');
          },
          accelerator: 'F11'
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            mainWindow.webContents.send('menu-action', 'documentation');
          },
        },
        {
          label: 'Report Issue',
          click: () => {
            mainWindow.webContents.send('menu-action', 'reportIssue');
          },
        },
        {type: 'separator'},
        {
          role: 'about', label: `About ${app.name}`,
          click: () => {
            mainWindow.webContents.send('menu-action', 'about');
          },
        },
      ],
    },
  ];
}

function getRecentFilesSubmenu() {
  const recentFiles = loadRecentFiles();
  
  if (recentFiles.length === 0) {
    return [
      {
        label: 'No recent files',
        enabled: false
      }
    ];
  }
  
  const submenu = recentFiles.map(fileObj => {
    const filePath = fileObj.path;
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);
    const abbreviatedPath = dirName.length > 40 ? '...' + dirName.slice(-37) : dirName;
    
    return {
      label: `${fileName} (${abbreviatedPath})`,
      click: async () => {
        try {
          // Check if file exists
          await fs.access(filePath);
          
          // File exists, open it
          const content = await fs.readFile(filePath, 'utf-8');
          const shortFileName = path.basename(filePath);
          mainWindow.setTitle(`${shortFileName} - Mobius Designer Desktop`);
          
          // Move to top of recent files
          addToRecentFiles(filePath);
          
          // Update menu to reflect new recent files order
          createMenu();
          
          mainWindow.webContents.send('file-opened', 'openRecentFile', {path: filePath, content});
        } catch (error) {
          // File doesn't exist, show error and remove from recent files
          dialog.showErrorBox('File Not Found', `The file "${filePath}" could not be found. It has been removed from the recent files list.`);
          removeFromRecentFiles(filePath);
          
          // Update menu to reflect removal
          createMenu();
        }
      }
    };
  });
  
  // Add separator and "Clear Recent Files" option
  submenu.push(
    {type: 'separator'},
    {
      label: 'Clear Recent Files',
      click: () => {
        saveRecentFiles([]);
        createMenu();
      }
    }
  );
  
  return submenu;
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) createWindow();
});

ipcMain.handle('get-process', (event, url) => {
    const processes = db.getCollection(COLLECTION_PROCESSES);
    const process = processes.data.find(process => process.key === url);
    return process ? {success: true, data: process} : {success: false, error: 'Process not found'};
  }
);

// this is for 'save' changes of an existing file
ipcMain.handle('save-changes', async (event, filePath, xml) => {
  try {
    await fs.writeFile(filePath, xml, 'utf-8');
    
    // Update window title when file is saved (remove asterisk)
    if (mainWindow) {
      const shortFileName = path.basename(filePath);
      mainWindow.setTitle(`${shortFileName} - Mobius Designer Desktop`);
    }
    
    // Add to recent files when file is saved
    addToRecentFiles(filePath);
    
    // Update menu to reflect new recent files
    createMenu();
    
    return {success: true, message: 'Changes are saved.', path: filePath};
  } catch (error) {
    console.error('Error saving file:', error);
    return {success: false, message: 'Error saving file', error: error.message};
  }
});
let dialogOpen = false;
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{name: 'XML Files', extensions: ['xml']}],
  });
  if (result.canceled) {
    dialogOpen = false;
    return {canceled: true};
  } else {
    const content = await fs.readFile(result.filePaths[0], 'utf-8');
    const filePath = result.filePaths[0];
    
    // Add to recent files when file is opened
    addToRecentFiles(filePath);
    
    // Update menu to reflect new recent files
    createMenu();
    
    dialogOpen = false;
    return {canceled: false, path: filePath, content: content};
  }
});

// this is for first time 'save' and 'saveAs'
ipcMain.handle('download-process', async (event, xml, defaultFileName) => {
  // Use provided default filename or fallback to 'bpmn'
  const defaultPath = defaultFileName || 'bpmn';
  
  const filePath = await dialog.showSaveDialog({
    title: 'Save BPMN File',
    defaultPath: defaultPath,
    filters: [{name: 'XML Files', extensions: ['xml']}],
  });

  if (filePath.canceled) {
    return {success: true, canceled: true, message: 'Canceled!'};
  }

  try {
    await fs.writeFile(filePath.filePath, xml, 'utf-8');
    
    // Update window title when file is saved
    if (mainWindow) {
      const shortFileName = path.basename(filePath.filePath);
      mainWindow.setTitle(`${shortFileName} - Mobius Designer Desktop`);
    }
    
    // Add to recent files
    addToRecentFiles(filePath.filePath);
    
    // Update menu to reflect new recent files
    createMenu();
    
    return {success: true, canceled: false, message: 'File saved successfully', path: filePath.filePath};
  } catch (error) {
    console.error('Error saving file:', error);
    return {success: false, message: 'Error saving file', error: error.message};
  }
});

ipcMain.handle('download-svg', async (event, svg) => {
  const filePath = await dialog.showSaveDialog({
    title: 'Save SVG Image',
    defaultPath: 'diagram.svg',
    filters: [{name: 'SVG Files', extensions: ['svg']}],
  });

  if (filePath.canceled) {
    return {success: true, canceled: true, message: 'Canceled!'};
  }

  try {
    await fs.writeFile(filePath.filePath, svg);
    return {success: true, canceled: false, message: 'Image saved successfully'};
  } catch (error) {
    console.error('Error saving file:', error);
    return {success: false, message: 'Error saving file', error: error.message};
  }
});

async function exportAsPDF(buffer, filePath) {
  // Convert SVG buffer to PNG buffer
  const pngBuffer = await sharp(buffer).png().toBuffer();

  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedPng(pngBuffer);

  // Define padding
  const padding = 20;

  // Calculate page dimensions with padding
  const pageWidth = image.width + padding * 2;
  const pageHeight = image.height + padding * 2;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Draw the image with padding
  page.drawImage(image, {
    x: padding,
    y: padding,
    width: image.width,
    height: image.height,
  });

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(filePath, pdfBytes);
}

ipcMain.handle('export-as', async (event, data) => {
  const fileName = data['fileName'] || 'diagram';
  const svg = data['svg'];
  const filePath = await dialog.showSaveDialog({
    title: 'Export As',
    defaultPath: fileName+'',
    filters: [
      {name: 'PNG Files', extensions: ['png']},
      {name: 'JPEG Files', extensions: ['jpeg']},
      {name: 'PDF Files', extensions: ['pdf']}
    ],
  });

  if (filePath.canceled) {
    return {success: true, canceled: true, message: 'Canceled!'};
  }

  try {
    const buffer = Buffer.from(svg);
    const format = path.extname(filePath.filePath).toLowerCase();

    if (format === '.png') {
      await sharp(buffer).png().toFile(filePath.filePath);
    } else if (format === '.jpeg' || format === '.jpg') {
      await sharp(buffer).jpeg().toFile(filePath.filePath);
    } else if (format === '.pdf') {
      await exportAsPDF(buffer, filePath.filePath);
    } else {
      throw new Error('Unsupported file format');
    }
    return {success: true, canceled: false, message: 'Exported successfully'};
  } catch (error) {
    console.error('Error saving file:', error);
    return {success: false, message: 'Error saving file', error: error.message};
  }
});

ipcMain.handle('copy-file', (event, json) => {
  clipboard.writeText(json);
  return {success: true, message: 'Copied to clipboard'};
});

// IPC handler for updating window title
ipcMain.handle('update-window-title', (event, fileName, isModified = false) => {
  if (!mainWindow) return;
  
  let title = 'Mobius Designer Desktop';
  
  if (fileName) {
    const shortFileName = path.basename(fileName);
    title = `${isModified ? '* ' : ''}${shortFileName}`;
  }
  
  mainWindow.setTitle(title);
  return { success: true, title };
});

// IPC handler for getting current window title
ipcMain.handle('get-window-title', () => {
  if (!mainWindow) return { success: false };
  return { success: true, title: mainWindow.getTitle() };
});

// IPC handlers for recent files
ipcMain.handle('get-recent-files', () => {
  const recentFiles = loadRecentFiles();
  return { success: true, files: recentFiles };
});

ipcMain.handle('add-recent-file', (event, filePath) => {
  const recentFiles = addToRecentFiles(filePath);
  createMenu(); // Update menu to reflect changes
  return { success: true, files: recentFiles };
});

ipcMain.handle('remove-recent-file', (event, filePath) => {
  const recentFiles = removeFromRecentFiles(filePath);
  createMenu(); // Update menu to reflect changes
  return { success: true, files: recentFiles };
});

ipcMain.handle('open-recent-file', async (event, filePath) => {
  try {
    // Check if file exists
    await fs.access(filePath);
    
    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Update window title
    const shortFileName = path.basename(filePath);
    mainWindow.setTitle(`${shortFileName} - Mobius Designer Desktop`);
    
    // Add to recent files (move to top)
    addToRecentFiles(filePath);
    createMenu(); // Update menu to reflect changes
    
    return { success: true, path: filePath, content: content };
  } catch (error) {
    console.error('Error opening recent file:', error);
    
    // File doesn't exist, remove from recent files
    removeFromRecentFiles(filePath);
    createMenu(); // Update menu to reflect changes
    
    return { 
      success: false, 
      error: 'File not found. It may have been moved or deleted.',
      fileRemoved: true 
    };
  }
});

// Recent files management
const RECENT_FILES_PATH = path.join(__dirname, 'recent-files.json');
const MAX_RECENT_FILES = 10;

// Load recent files from JSON file
function loadRecentFiles() {
  try {
    if (fsSync.existsSync(RECENT_FILES_PATH)) {
      const data = fsSync.readFileSync(RECENT_FILES_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading recent files:', error);
  }
  return [];
}

// Save recent files to JSON file
function saveRecentFiles(recentFiles) {
  try {
    fsSync.writeFileSync(RECENT_FILES_PATH, JSON.stringify(recentFiles, null, 2));
  } catch (error) {
    console.error('Error saving recent files:', error);
  }
}

// Add a file to recent files list
function addToRecentFiles(filePath) {
  let recentFiles = loadRecentFiles();
  
  // Remove if already exists (to move it to top)
  recentFiles = recentFiles.filter(file => file.path !== filePath);
  
  // Add to beginning
  recentFiles.unshift({
    path: filePath,
    name: path.basename(filePath),
    addedAt: new Date().toISOString()
  });
  
  // Keep only MAX_RECENT_FILES
  recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
  
  saveRecentFiles(recentFiles);
  return recentFiles;
}

// Remove a file from recent files list
function removeFromRecentFiles(filePath) {
  let recentFiles = loadRecentFiles();
  recentFiles = recentFiles.filter(file => file.path !== filePath);
  saveRecentFiles(recentFiles);
  return recentFiles;
}

// IPC handler for showing about dialog
ipcMain.handle('show-about-dialog', () => {
  const aboutOptions = {
    type: 'info',
    title: 'About Mobius Designer',
    message: 'Mobius Designer',
    detail: `Version: ${require('./package.json').version}\nA powerful BPMN process design tool.`,
    icon: path.join(__dirname, 'src/assets/icon-png.png'),
    buttons: ['OK']
  };
  
  dialog.showMessageBox(mainWindow, aboutOptions);
  return { success: true };
});



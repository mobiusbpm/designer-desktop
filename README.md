# Mobius Designer Desktop

A powerful desktop application for modeling and designing BPMN (Business Process Model and Notation) diagrams. Built with Angular, Electron, and BPMN.js for a seamless cross-platform experience.

## Overview

Mobius Designer Desktop is a comprehensive BPMN diagram editor designed for modeling and design purposes. It provides an intuitive interface for creating, editing, and managing business process diagrams.

## Features

- 🎨 **Visual BPMN Editor** - Create and edit BPMN diagrams with an intuitive drag-and-drop interface
- 🖥️ **Cross-Platform** - Runs on Windows, macOS, and Linux
- 📊 **Professional Modeling** - Full BPMN 2.0 specification support
- 🎯 **Designer Tools** - Comprehensive set of editing tools and properties panel

## Technology Stack

- **Frontend Framework**: Angular 17.3.x
- **Desktop Runtime**: Electron 33.x
- **BPMN Engine**: BPMN.js 18.x
- **UI Components**: ng-zorro-antd (Ant Design for Angular)
- **Styling**: Less CSS
- **Build Tools**: Angular CLI, Electron Builder

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mobius-designer-desktop
   ```

2. Install dependencies:
   ```bash
   npm install
   `````

## Development

### Running the Application

To start the application in development mode:

```bash
npm start
```

This command will:
1. Build the Angular application
2. Launch the Electron desktop app

### Development Commands

- **Start Development Server**: `npm start`
- **Build Angular App**: `npm run build`
- **Watch Mode**: `npm run watch`
- **Run Tests**: `npm test`

### Project Structure

```
src/
├── app/
│   ├── pages/
│   │   ├── designer/           # BPMN designer components
│   │   │   ├── designer-ui/    # Main designer interface
│   │   │   └── edit-tools/     # Editing tools and toolbar
│   │   ├── home/              # Home page components
│   │   └── service/           # Application services
│   └── assets/                # Static assets and icons
├── locale/                    # Internationalization files
└── styles.less               # Global styles
```

## Building for Production

### Build for All Platforms
```bash
npm run dist:all
```

### Platform-Specific Builds
```bash
npm run dist:mac     # macOS
npm run dist:win     # Windows
npm run dist:linux   # Linux
```

Built applications will be available in the `release/` directory.

## Key Components

### Designer Interface
- **Designer UI Component**: Main BPMN diagram editing interface
- **Edit Tools**: Comprehensive toolbar with editing capabilities
- **Custom Context Pad**: Enhanced context menu for BPMN elements
- **Properties Panel**: Element properties and configuration

### Services
- **Electron Service**: Desktop integration and native functionality
- **Title Service**: Window title management
- **Util Service**: Common utility functions

## Supported File Formats

- BPMN 2.0 XML files
- SVG export for diagrams
- PDF generation capabilities

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the terms specified in the LICENSE file.

## Support

For support and questions, please contact: mobius.bpm@gmail.com

## Version

Current version: 0.0.1

---

Built with ❤️ using Angular, Electron, and BPMN.js
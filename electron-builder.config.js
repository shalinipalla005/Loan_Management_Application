module.exports = {
  asar: true, // Disable asar for debugging asset loading
  appId: 'com.loanmanagement.desktop',
  productName: 'Loan Management',
  copyright: 'Copyright © 2024 Loan Management System',
  
  directories: {
    output: 'dist',
    buildResources: 'resources'
  },
  
  files: [
    'build/**/*',
    'frontend/dist/**/*',
    'backend/**/*',
    'electron/**/*',
    'node_modules/**/*',
    'package.json'
  ],
  
  extraResources: [
    {
      from: 'resources/database',
      to: 'database'
    },
    {
      from: 'backend/node_modules',
      to: 'backend/node_modules'
    }
  ],
  
  mac: {
    category: 'public.app-category.finance',
    icon: 'resources/icons/app-icon.icns',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ]
  },
  
  win: {
    icon: 'resources/icons/app-icon.png',
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32']
      }
    ]
  },
  
  nsis: {
    oneClick: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Loan Management'
  },
  
  dmg: {
    title: 'Loan Management',
    backgroundColor: '#ffffff',
    icon: 'resources/icons/app-icon.icns',
    iconSize: 80,
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications'
      }
    ]
  },
  
  publish: {
    provider: 'github',
    owner: 'shalinipalla005',
    repo: 'loan-management-desktop',
    private: false
  }
}; 

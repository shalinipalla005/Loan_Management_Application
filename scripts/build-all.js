const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ComprehensiveBuildSystem {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.buildDir = path.join(this.rootDir, 'build');
    this.distDir = path.join(this.rootDir, 'dist');
    this.frontendDir = path.join(this.rootDir, 'frontend');
    this.backendDir = path.join(this.rootDir, 'backend');
    this.resourcesDir = path.join(this.rootDir, 'resources');
  }

  async build() {
    console.log('🏗️  Starting comprehensive build process...');
    
    try {
      // Step 1: Clean previous builds
      await this.cleanBuild();
      
      // Step 2: Build frontend
      await this.buildFrontend();
      
      // Step 3: Build backend
      await this.buildBackend();
      
      // Step 4: Copy resources (including existing database)
      await this.copyResources();
      
      // Step 5: Create final build structure
      await this.createFinalBuild();
      
      console.log('✅ Build completed successfully!');
      
    } catch (error) {
      console.error('❌ Build failed:', error);
      throw error;
    }
  }

  async cleanBuild() {
    console.log('🧹 Cleaning previous builds...');
    
    const dirsToClean = [this.buildDir, this.distDir];
    
    for (const dir of dirsToClean) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
    
    // Recreate build directory
    fs.mkdirSync(this.buildDir, { recursive: true });
  }

  async buildFrontend() {
    console.log('⚛️  Building frontend...');
    
    try {
      // Set environment variables for frontend build
      const env = {
        ...process.env,
        VITE_API_BASE_URL: 'http://localhost:3000',
        VITE_APP_NAME: 'Loan Management',
        VITE_APP_VERSION: '1.0.0',
        VITE_IS_DESKTOP: 'true',
        VITE_AUTO_UPDATE_ENABLED: 'true'
      };

      execSync('npm run build', {
        cwd: this.frontendDir,
        stdio: 'inherit',
        env
      });
      
      console.log('✅ Frontend build completed');
      
    } catch (error) {
      console.error('❌ Frontend build failed:', error);
      throw error;
    }
  }

  async buildBackend() {
    console.log('🔧 Building backend...');
    
    try {
      // Copy backend source files
      console.log('ℹ️  Copying backend source files...');
      this.copyDirectory(
        this.backendDir,
        path.join(this.buildDir, 'backend')
      );
      
      // Install production dependencies
      execSync('npm ci --only=production', {
        cwd: path.join(this.buildDir, 'backend'),
        stdio: 'inherit'
      });
      
      console.log('✅ Backend build completed');
      
    } catch (error) {
      console.error('❌ Backend build failed:', error);
      throw error;
    }
  }

  async prepareDatabase() {
    console.log('💾 Preparing database...');
    
    try {
      // Run database migration
      execSync('node scripts/migrate-db.js', {
        cwd: this.rootDir,
        stdio: 'inherit'
      });
      
      console.log('✅ Database preparation completed');
      
    } catch (error) {
      console.error('❌ Database preparation failed:', error);
      throw error;
    }
  }

  async copyResources() {
    console.log('📁 Copying resources...');
    
    // Copy frontend build
    this.copyDirectory(
      path.join(this.frontendDir, 'dist'),
      path.join(this.buildDir, 'frontend')
    );
    
    // Copy backend build/source
    if (fs.existsSync(path.join(this.backendDir, 'dist'))) {
      this.copyDirectory(
        path.join(this.backendDir, 'dist'),
        path.join(this.buildDir, 'backend', 'dist')
      );
    }
    
    // Copy resources
    if (fs.existsSync(this.resourcesDir)) {
      this.copyDirectory(
        this.resourcesDir,
        path.join(this.buildDir, 'resources')
      );
    }
    
    console.log('✅ Resources copied');
  }

  async createFinalBuild() {
    console.log('📦 Creating final build structure...');
    
    // Create electron build directory
    const electronBuildDir = path.join(this.buildDir, 'electron');
    fs.mkdirSync(electronBuildDir, { recursive: true });
    
    // Copy electron files
    this.copyDirectory(
      path.join(this.rootDir, 'electron'),
      electronBuildDir
    );
    
    // Install electron dependencies
    execSync('npm ci --only=production', {
      cwd: electronBuildDir,
      stdio: 'inherit'
    });
    
    console.log('✅ Final build structure created');
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(src)) {
      console.warn(`⚠️  Source directory does not exist: ${src}`);
      return;
    }
    
    fs.mkdirSync(dest, { recursive: true });
    
    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// Execute build if run directly
if (require.main === module) {
  const builder = new ComprehensiveBuildSystem();
  builder.build().catch(process.exit);
}

module.exports = ComprehensiveBuildSystem; 
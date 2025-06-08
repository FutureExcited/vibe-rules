#!/usr/bin/env bun

import { $ } from "bun";
import { readdir, stat, readFile } from "fs/promises";
import { join } from "path";

interface ExampleProject {
  name: string;
  path: string;
  needsBuild: boolean;
  packageJson: any;
}

async function discoverExampleProjects(): Promise<ExampleProject[]> {
  const examplesDir = join(process.cwd(), "examples");
  
  try {
    const entries = await readdir(examplesDir);
    const projects: ExampleProject[] = [];
    
    for (const entry of entries) {
      const entryPath = join(examplesDir, entry);
      const entryStat = await stat(entryPath);
      
      // Skip files, only process directories
      if (!entryStat.isDirectory()) {
        continue;
      }
      
      // Check if directory has package.json
      const packageJsonPath = join(entryPath, "package.json");
      try {
        await stat(packageJsonPath);
        const packageJsonContent = await readFile(packageJsonPath, "utf-8");
        const packageJson = JSON.parse(packageJsonContent);
        
        // Determine if this project needs building
        const needsBuild = packageJson.scripts?.build !== undefined;
        
        projects.push({
          name: entry,
          path: entryPath,
          needsBuild,
          packageJson
        });
        
        console.log(`📦 Found example project: ${entry} ${needsBuild ? "(needs build)" : "(install only)"}`);
      } catch {
        // Skip directories without package.json
        console.log(`⚠️  Skipping ${entry} (no package.json)`);
      }
    }
    
    return projects;
  } catch (error) {
    console.error("❌ Failed to read examples directory:", error);
    process.exit(1);
  }
}

async function buildProject(project: ExampleProject): Promise<void> {
  console.log(`🔨 Building ${project.name}...`);
  
  try {
    // Always run npm install first
    await $`cd ${project.path} && npm install`.quiet();
    console.log(`✅ Installed dependencies for ${project.name}`);
    
    // Run build if needed
    if (project.needsBuild) {
      await $`cd ${project.path} && npm run build`.quiet();
      console.log(`✅ Built ${project.name}`);
    }
  } catch (error) {
    console.error(`❌ Failed to build ${project.name}:`, error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Building example projects...\n");
  
  const projects = await discoverExampleProjects();
  
  if (projects.length === 0) {
    console.log("📭 No example projects found");
    return;
  }
  
  console.log(`\n🔄 Processing ${projects.length} projects in parallel...\n`);
  
  try {
    // Run all projects in parallel
    await Promise.all(projects.map(buildProject));
    
    console.log("\n🎉 All example projects built successfully!");
    
    // Summary
    const builtProjects = projects.filter(p => p.needsBuild);
    const installedProjects = projects.filter(p => !p.needsBuild);
    
    if (builtProjects.length > 0) {
      console.log(`📦 Built projects: ${builtProjects.map(p => p.name).join(", ")}`);
    }
    if (installedProjects.length > 0) {
      console.log(`📦 Installed projects: ${installedProjects.map(p => p.name).join(", ")}`);
    }
  } catch (error) {
    console.error("\n❌ Build failed:", error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
}); 
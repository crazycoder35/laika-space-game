const path = require('path');
const glob = require('glob');
const { AssetPipeline } = require('../src/build/AssetPipeline');
const { ImageProcessingTask } = require('../src/build/tasks/ImageProcessingTask');
const { AudioProcessingTask } = require('../src/build/tasks/AudioProcessingTask');
const { ShaderProcessingTask } = require('../src/build/tasks/ShaderProcessingTask');
const buildConfig = require('../build.config');

async function buildAssets() {
  const pipeline = new AssetPipeline();
  const { assets } = buildConfig;

  // Process images
  const imageFiles = glob.sync(`${assets.images.input}/**/*.{png,jpg,jpeg}`);
  for (const file of imageFiles) {
    const relativePath = path.relative(assets.images.input, file);
    const outputPath = path.join(assets.images.output, relativePath);
    const task = assets.images.tasks.find(t => 
      glob.sync(path.join(assets.images.input, t.pattern)).includes(file)
    );

    if (task) {
      pipeline.addTask(new ImageProcessingTask({
        id: `image-${relativePath}`,
        inputPath: file,
        outputPath,
        options: task.options
      }));
    }
  }

  // Process audio
  const audioFiles = glob.sync(`${assets.audio.input}/**/*.{mp3,wav}`);
  for (const file of audioFiles) {
    const relativePath = path.relative(assets.audio.input, file);
    const outputPath = path.join(assets.audio.output, relativePath);
    const task = assets.audio.tasks.find(t =>
      glob.sync(path.join(assets.audio.input, t.pattern)).includes(file)
    );

    if (task) {
      pipeline.addTask(new AudioProcessingTask({
        id: `audio-${relativePath}`,
        inputPath: file,
        outputPath,
        options: task.options
      }));
    }
  }

  // Process shaders
  const shaderFiles = glob.sync(`${assets.shaders.input}/**/*.{vert,frag}`);
  for (const file of shaderFiles) {
    const relativePath = path.relative(assets.shaders.input, file);
    const outputPath = path.join(assets.shaders.output, relativePath);
    const task = assets.shaders.tasks.find(t =>
      glob.sync(path.join(assets.shaders.input, t.pattern)).includes(file)
    );

    if (task) {
      pipeline.addTask(new ShaderProcessingTask({
        id: `shader-${relativePath}`,
        inputPath: file,
        outputPath,
        options: task.options
      }));
    }
  }

  // Execute pipeline
  console.log('Starting asset processing...');
  const result = await pipeline.build();

  if (result.success) {
    console.log('Asset processing completed successfully.');
    result.tasks.forEach((taskResult, taskId) => {
      if (taskResult.success) {
        console.log(`✓ ${taskId}`);
      } else {
        console.warn(`⚠ ${taskId}: ${taskResult.error}`);
      }
    });
  } else {
    console.error('Asset processing failed:');
    result.errors.forEach(error => {
      console.error(`× ${error.taskId}: ${error.error}`);
    });
    process.exit(1);
  }
}

// Main execution
buildAssets().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
}); 
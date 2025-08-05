import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_IMAGE_DIMENSION = 1024;


function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Starting background removal process...');
    const segmenter = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
      device: 'webgpu',
    });
    
    // Convert HTMLImageElement to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Resize image if needed and draw it to canvas
    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Image ${wasResized ? 'was' : 'was not'} resized. Final dimensions: ${canvas.width}x${canvas.height}`);
    
    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Image converted to base64');
    
    // Process the image with the segmentation model
    console.log('Processing with segmentation model...');
    const result = await segmenter(imageData);
    
    console.log('Segmentation result:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('Invalid segmentation result');
    }
    
    // Create a new canvas for the masked image
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Apply the mask
    const outputImageData = outputCtx.getImageData(
      0, 0,
      outputCanvas.width,
      outputCanvas.height
    );
    const data = outputImageData.data;
    
    // Apply mask to alpha channel (BRIA models return foreground masks)
    for (let i = 0; i < result[0].mask.data.length; i++) {
      // BRIA models return foreground masks: high values = person, low values = background
      const alpha = Math.round(result[0].mask.data[i] * 255);
      data[i * 4 + 3] = alpha;
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('Mask applied successfully');
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Successfully created final blob');
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const addColorBackground = (
  imageWithTransparentBg: HTMLImageElement, 
  backgroundColor: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    canvas.width = imageWithTransparentBg.width;
    canvas.height = imageWithTransparentBg.height;
    
    // Fill with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the image with transparent background on top
    ctx.drawImage(imageWithTransparentBg, 0, 0);
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/png',
      1.0
    );
  });
};

export const addImageBackground = (
  imageWithTransparentBg: HTMLImageElement
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const backgroundImg = new Image();
    backgroundImg.crossOrigin = 'anonymous';
    
    backgroundImg.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Use background image dimensions
      canvas.width = backgroundImg.width;
      canvas.height = backgroundImg.height;
      
      // Draw background image first
      ctx.drawImage(backgroundImg, 0, 0);
      
      // Calculate scaling to fit person image within background while maintaining aspect ratio
      const personAspect = imageWithTransparentBg.width / imageWithTransparentBg.height;
      const backgroundAspect = backgroundImg.width / backgroundImg.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (personAspect > backgroundAspect) {
        // Person image is wider, fit to width
        drawWidth = backgroundImg.width * 0.8; // Leave some margin
        drawHeight = drawWidth / personAspect;
      } else {
        // Person image is taller, fit to height
        drawHeight = backgroundImg.height * 0.8; // Leave some margin
        drawWidth = drawHeight * personAspect;
      }
      
      // Center the person image
      drawX = (backgroundImg.width - drawWidth) / 2;
      drawY = (backgroundImg.height - drawHeight) / 2;
      
      // First, add subtle edge feathering underneath for natural blending
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.filter = 'blur(3px)';
      const featherSize = 6;
      ctx.drawImage(
        imageWithTransparentBg, 
        drawX - featherSize, 
        drawY - featherSize, 
        drawWidth + featherSize * 2, 
        drawHeight + featherSize * 2
      );
      ctx.restore();
      
      // Then draw the main person image with subtle shadow for natural integration
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
      
      ctx.drawImage(imageWithTransparentBg, drawX, drawY, drawWidth, drawHeight);
      
      ctx.restore();
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    };
    
    backgroundImg.onerror = () => {
      reject(new Error('Failed to load background image'));
    };
    
    // Load the mask image from public directory
    backgroundImg.src = '/mask_A.webp';
  });
};

export const addMaskBorders = (
  originalImage: HTMLImageElement
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const maskImg = new Image();
    maskImg.crossOrigin = 'anonymous';
    
    maskImg.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Set canvas dimensions: original width, height + 200px for borders
      canvas.width = originalImage.width;
      canvas.height = originalImage.height + 200;
      
      const borderHeight = 100; // 100px top + 100px bottom = 200px total
      
      // Draw top border from mask
      ctx.drawImage(
        maskImg,
        0, 0, // Source position
        maskImg.width, borderHeight, // Source dimensions
        0, 0, // Destination position  
        canvas.width, borderHeight // Destination dimensions
      );
      
      // Draw original image in the center
      ctx.drawImage(
        originalImage,
        0, borderHeight, // Position it after top border
        canvas.width, originalImage.height
      );
      
      // Draw bottom border from mask
      ctx.drawImage(
        maskImg,
        0, maskImg.height - borderHeight, // Source from bottom of mask
        maskImg.width, borderHeight, // Source dimensions
        0, canvas.height - borderHeight, // Destination at bottom
        canvas.width, borderHeight // Destination dimensions
      );
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    };
    
    maskImg.onerror = () => {
      reject(new Error('Failed to load mask image'));
    };
    
    // Load the mask image from public directory
    maskImg.src = '/mask_A.webp';
  });
};

export const createSocialBanner = (
  groupName: string,
  userName: string,
  backgroundColor: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    // Social media banner dimensions (3:1 ratio)
    canvas.width = 1200;
    canvas.height = 400;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, backgroundColor);
    gradient.addColorStop(1, backgroundColor + '80'); // Add transparency
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add geometric pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 20; i++) {
      const x = (i * 60) % canvas.width;
      const y = (i * 30) % canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${userName}`, canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`Group ${groupName} Member`, canvas.width / 2, canvas.height / 2 + 40);
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/png',
      1.0
    );
  });
};

export const createAdmissionBanner = (
  groupName: string,
  userName: string,
  backgroundColor: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    // Admission banner dimensions (4:3 ratio)
    canvas.width = 800;
    canvas.height = 600;
    
    // Create radial gradient background
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
    );
    gradient.addColorStop(0, backgroundColor);
    gradient.addColorStop(1, backgroundColor + '60');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add celebration elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 15 + 5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 CONGRATULATIONS! 🎉', canvas.width / 2, canvas.height / 2 - 80);
    
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`${userName}`, canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Welcome to Group ${groupName}!`, canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.font = '20px Arial';
    ctx.fillText('You have successfully joined the program', canvas.width / 2, canvas.height / 2 + 60);
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/png',
      1.0
    );
  });
};

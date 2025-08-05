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
  imageWithTransparentBg: HTMLImageElement,
  selectedGroup: 'A' | 'B' | 'C' | 'D' = 'A'
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
      reject(new Error(`Failed to load background image for group ${selectedGroup}`));
    };
    
    // Load the appropriate mask image based on selected group
    backgroundImg.src = `/mask_${selectedGroup}.png`;
  });
};

export const addMaskBorders = (
    originalImage: HTMLImageElement,
  selectedGroup: 'A' | 'B' | 'C' | 'D' = 'A'
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
      
      // Set canvas dimensions to 1000x1000 (square format)
      canvas.width = 1000;
      canvas.height = 1000;
      
      const borderHeight = 100; // 100px top + 100px bottom = 200px total
      const imageHeight = 800; // 1000 - 200 = 800px for the main image area
      
      // STEP 1: Crop-to-fill the original image to fit the 1000x800 area
      const availableWidth = canvas.width; // 1000px
      const availableHeight = imageHeight; // 800px
      
      // Calculate scale factors for both dimensions
      const scaleX = availableWidth / originalImage.width;
      const scaleY = availableHeight / originalImage.height;
      
      // Use the LARGER scale to ensure complete coverage (crop-to-fill)
      const scale = Math.max(scaleX, scaleY);
      
      // Calculate the scaled dimensions
      const scaledWidth = originalImage.width * scale;
      const scaledHeight = originalImage.height * scale;
      
      // Center the scaled image (crop excess parts equally from both sides)
      const offsetX = (availableWidth - scaledWidth) / 2;
      const offsetY = borderHeight + (availableHeight - scaledHeight) / 2;
      
      // STEP 2: Draw the processed image in the middle section
      ctx.drawImage(
        originalImage,
        offsetX, offsetY, // Centered position
        scaledWidth, scaledHeight // Scaled dimensions that fill the area
      );
      
      // STEP 3: Add borders on top as overlays (this ensures borders are never cropped)
      // Draw top border from mask
      ctx.drawImage(
        maskImg,
        0, 0, // Source position
        maskImg.width, borderHeight, // Source dimensions
        0, 0, // Destination position  
        canvas.width, borderHeight // Destination dimensions
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
      reject(new Error(`Failed to load mask image for group ${selectedGroup}`));
    };
    
    // Load the appropriate mask image based on selected group
    maskImg.src = `/mask_${selectedGroup}.png`;
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
    
    // Create theme-specific designs
    switch (groupName) {
      case 'A': // The Innovators - Epic/Fantasy theme
        // Epic radial gradient with dramatic lighting
        const gradientA = ctx.createRadialGradient(canvas.width * 0.8, 100, 50, canvas.width * 0.8, 100, 600);
        gradientA.addColorStop(0, '#fbbf24'); // Bright golden center
        gradientA.addColorStop(0.3, '#f59e0b');
        gradientA.addColorStop(0.7, '#dc2626');
        gradientA.addColorStop(1, '#7f1d1d'); // Deep red edges
        
        ctx.fillStyle = gradientA;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add dramatic light rays
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI * 2) / 12;
          const startX = canvas.width * 0.8;
          const startY = 100;
          const endX = startX + Math.cos(angle) * 300;
          const endY = startY + Math.sin(angle) * 300;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        ctx.restore();
        
        // Epic text styling
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 2;
        ctx.font = 'bold 52px serif';
        ctx.textAlign = 'left';
        ctx.strokeText(userName, 60, canvas.height / 2 - 10);
        ctx.fillText(userName, 60, canvas.height / 2 - 10);
        
        ctx.font = 'bold 28px serif';
        ctx.fillStyle = 'white';
        ctx.strokeText(`THE INNOVATOR`, 60, canvas.height / 2 + 35);
        ctx.fillText(`THE INNOVATOR`, 60, canvas.height / 2 + 35);
        break;
        
      case 'B': // The Guardians - Shield/Protection theme
        const gradientB = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradientB.addColorStop(0, '#065f46');
        gradientB.addColorStop(0.5, '#059669');
        gradientB.addColorStop(1, '#064e3b');
        
        ctx.fillStyle = gradientB;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Shield-like geometric patterns
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        for (let i = 0; i < 8; i++) {
          const x = (i * 150) + 75;
          const y = canvas.height / 2;
          const size = 40;
          ctx.beginPath();
          ctx.moveTo(x, y - size);
          ctx.lineTo(x + size * 0.6, y);
          ctx.lineTo(x, y + size);
          ctx.lineTo(x - size * 0.6, y);
          ctx.closePath();
          ctx.fill();
        }
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(userName, canvas.width / 2, canvas.height / 2 - 10);
        
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = 'white';
        ctx.fillText('GUARDIAN PROTECTOR', canvas.width / 2, canvas.height / 2 + 35);
        break;
        
      case 'C': // The Champions - Star/Excellence theme
        const gradientC = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 50, canvas.width / 2, canvas.height / 2, 400);
        gradientC.addColorStop(0, '#fed7aa');
        gradientC.addColorStop(0.4, '#fb923c');
        gradientC.addColorStop(0.8, '#ea580c');
        gradientC.addColorStop(1, '#9a3412');
        
        ctx.fillStyle = gradientC;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        // Championship stars
        ctx.fillStyle = 'rgba(254, 215, 170, 0.4)';
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const size = Math.random() * 20 + 10;
          
          // Draw star
      ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            const angle = (j * Math.PI * 2) / 5 - Math.PI / 2;
            const x1 = x + Math.cos(angle) * size;
            const y1 = y + Math.sin(angle) * size;
            const x2 = x + Math.cos(angle + Math.PI / 5) * size * 0.5;
            const y2 = y + Math.sin(angle + Math.PI / 5) * size * 0.5;
            
            if (j === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
          ctx.closePath();
      ctx.fill();
    }
    
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px serif';
        ctx.textAlign = 'center';
        ctx.fillText(userName, canvas.width / 2, canvas.height / 2 - 10);
        
        ctx.font = 'bold 26px serif';
        ctx.fillStyle = 'white';
        ctx.fillText('★ CHAMPION ★', canvas.width / 2, canvas.height / 2 + 35);
        break;
        
      case 'D': // The Pioneers - Flag/Exploration theme
        const gradientD = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradientD.addColorStop(0, '#581c87');
        gradientD.addColorStop(0.3, '#7c3aed');
        gradientD.addColorStop(0.7, '#a855f7');
        gradientD.addColorStop(1, '#581c87');
        
        ctx.fillStyle = gradientD;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Pioneer paths/trails
        ctx.strokeStyle = 'rgba(196, 181, 253, 0.3)';
        ctx.lineWidth = 4;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(0, (i * 70) + 50);
          ctx.bezierCurveTo(canvas.width / 3, (i * 70) + 20, canvas.width * 2/3, (i * 70) + 80, canvas.width, (i * 70) + 50);
          ctx.stroke();
        }
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(userName, canvas.width / 2, canvas.height / 2 - 10);
        
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = 'white';
        ctx.fillText('⚡ PIONEER EXPLORER ⚡', canvas.width / 2, canvas.height / 2 + 35);
        break;
        
      default:
        // Fallback to original design
        const defaultGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        defaultGradient.addColorStop(0, backgroundColor);
        defaultGradient.addColorStop(1, backgroundColor + '80');
        
        ctx.fillStyle = defaultGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
        ctx.fillText(userName, canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`Group ${groupName} Member`, canvas.width / 2, canvas.height / 2 + 40);
    }
    
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
    
    // Create theme-specific admission designs
    switch (groupName) {
      case 'A': // The Innovators - Epic/Fantasy theme
        // Epic cosmic background
        const gradientA = ctx.createRadialGradient(canvas.width / 2, 150, 50, canvas.width / 2, 150, 500);
        gradientA.addColorStop(0, '#fbbf24');
        gradientA.addColorStop(0.3, '#f59e0b');
        gradientA.addColorStop(0.6, '#dc2626');
        gradientA.addColorStop(1, '#450a0a');
        
        ctx.fillStyle = gradientA;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Epic light burst
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 6;
        for (let i = 0; i < 16; i++) {
          const angle = (i * Math.PI * 2) / 16;
          const startX = canvas.width / 2;
          const startY = 150;
          const endX = startX + Math.cos(angle) * 200;
          const endY = startY + Math.sin(angle) * 200;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        ctx.restore();
        
        // Epic title
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 3;
        ctx.font = 'bold 42px serif';
        ctx.textAlign = 'center';
        ctx.strokeText('⚡ DESTINY FULFILLED ⚡', canvas.width / 2, 100);
        ctx.fillText('⚡ DESTINY FULFILLED ⚡', canvas.width / 2, 100);
        
        ctx.font = 'bold 36px serif';
        ctx.fillStyle = 'white';
        ctx.strokeText(userName, canvas.width / 2, canvas.height / 2);
        ctx.fillText(userName, canvas.width / 2, canvas.height / 2);
        
        ctx.font = 'bold 24px serif';
        ctx.fillStyle = 'white';
        ctx.strokeText('You Are Now an INNOVATOR', canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText('You Are Now an INNOVATOR', canvas.width / 2, canvas.height / 2 + 50);
        
        ctx.font = '20px serif';
        ctx.fillStyle = 'white';
        ctx.fillText('Your epic journey begins now!', canvas.width / 2, canvas.height / 2 + 90);
        break;
        
      case 'B': // The Guardians - Shield/Protection theme
        const gradientB = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradientB.addColorStop(0, '#064e3b');
        gradientB.addColorStop(0.5, '#059669');
        gradientB.addColorStop(1, '#065f46');
        
        ctx.fillStyle = gradientB;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Protective shield emblems
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        for (let i = 0; i < 12; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const size = Math.random() * 30 + 20;
          
          // Draw shield shape
          ctx.beginPath();
          ctx.moveTo(x, y - size);
          ctx.bezierCurveTo(x + size * 0.8, y - size, x + size * 0.8, y + size * 0.3, x, y + size);
          ctx.bezierCurveTo(x - size * 0.8, y + size * 0.3, x - size * 0.8, y - size, x, y - size);
          ctx.fill();
        }
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️ GUARDIAN SWORN 🛡️', canvas.width / 2, 120);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText(userName, canvas.width / 2, canvas.height / 2);
        
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = 'white';
        ctx.fillText('Protector of the Realm', canvas.width / 2, canvas.height / 2 + 50);
        
        ctx.font = '18px sans-serif';
        ctx.fillStyle = 'white';
        ctx.fillText('Your watch begins - defend with honor', canvas.width / 2, canvas.height / 2 + 85);
        break;
        
      case 'C': // The Champions - Star/Excellence theme
        const gradientC = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 50, canvas.width / 2, canvas.height / 2, 400);
        gradientC.addColorStop(0, '#fff7ed');
        gradientC.addColorStop(0.3, '#fed7aa');
        gradientC.addColorStop(0.6, '#fb923c');
        gradientC.addColorStop(1, '#9a3412');
        
        ctx.fillStyle = gradientC;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Victory stars explosion
        ctx.fillStyle = 'rgba(251, 146, 60, 0.6)';
        for (let i = 0; i < 25; i++) {
          const x = canvas.width / 2 + (Math.random() - 0.5) * 400;
          const y = canvas.height / 2 + (Math.random() - 0.5) * 300;
          const size = Math.random() * 25 + 15;
          
          // Draw victory star
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.random() * Math.PI * 2);
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            const angle = (j * Math.PI * 2) / 5;
            const x1 = Math.cos(angle) * size;
            const y1 = Math.sin(angle) * size;
            const x2 = Math.cos(angle + Math.PI / 5) * size * 0.4;
            const y2 = Math.sin(angle + Math.PI / 5) * size * 0.4;
            
            if (j === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 38px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 CHAMPION CROWNED 🏆', canvas.width / 2, 120);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 34px serif';
        ctx.fillText(userName, canvas.width / 2, canvas.height / 2);
        
        ctx.font = 'bold 24px serif';
        ctx.fillStyle = 'white';
        ctx.fillText('Excellence Achieved', canvas.width / 2, canvas.height / 2 + 50);
        
        ctx.font = '20px serif';
        ctx.fillStyle = 'white';
        ctx.fillText('Victory is yours to claim!', canvas.width / 2, canvas.height / 2 + 85);
        break;
        
      case 'D': // The Pioneers - Flag/Exploration theme
        const gradientD = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradientD.addColorStop(0, '#2e1065');
        gradientD.addColorStop(0.3, '#581c87');
        gradientD.addColorStop(0.6, '#7c3aed');
        gradientD.addColorStop(1, '#2e1065');
        
        ctx.fillStyle = gradientD;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        // Explorer constellation
        ctx.fillStyle = 'rgba(196, 181, 253, 0.4)';
        const stars = [];
        for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
          const size = Math.random() * 6 + 3;
          stars.push({x, y, size});
          
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
        // Connect some stars with exploration paths
        ctx.strokeStyle = 'rgba(196, 181, 253, 0.2)';
        ctx.lineWidth = 2;
        for (let i = 0; i < stars.length - 1; i += 3) {
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[i + 1]?.x || stars[i].x, stars[i + 1]?.y || stars[i].y);
          ctx.stroke();
        }
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚀 PIONEER APPOINTED 🚀', canvas.width / 2, 120);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText(userName, canvas.width / 2, canvas.height / 2);
        
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = 'white';
        ctx.fillText('Explorer of New Frontiers', canvas.width / 2, canvas.height / 2 + 50);
        
        ctx.font = '18px sans-serif';
        ctx.fillStyle = 'white';
        ctx.fillText('Chart your course to the unknown!', canvas.width / 2, canvas.height / 2 + 85);
        break;
        
      default:
        // Fallback to original design
        const defaultGradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        defaultGradient.addColorStop(0, backgroundColor);
        defaultGradient.addColorStop(1, backgroundColor + '60');
        
        ctx.fillStyle = defaultGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 CONGRATULATIONS! 🎉', canvas.width / 2, canvas.height / 2 - 80);
    
    ctx.font = 'bold 28px Arial';
        ctx.fillText(userName, canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Welcome to Group ${groupName}!`, canvas.width / 2, canvas.height / 2 + 20);
    }
    
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

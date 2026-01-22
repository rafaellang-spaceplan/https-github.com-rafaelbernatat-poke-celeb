/**
 * Processes a base64 image to create a silhouette.
 * It assumes a white background from the generator and converts non-white pixels to black.
 */
export const createSilhouette = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
  
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
  
        // Draw original image
        ctx.drawImage(img, 0, 0);
  
        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
  
        // Threshold for "White". Since GenAI might not produce #FFFFFF perfectly.
        const threshold = 240;
  
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
  
          // Check if pixel is effectively white or transparent
          const isWhite = r > threshold && g > threshold && b > threshold;
          const isTransparent = a < 50;
  
          if (isWhite || isTransparent) {
            // Make transparent
            data[i + 3] = 0; 
          } else {
            // Make solid black (Silhouette)
            data[i] = 0;     // R
            data[i + 1] = 0; // G
            data[i + 2] = 0; // B
            data[i + 3] = 255; // Alpha
          }
        }
  
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (err) => reject(err);
      img.src = `data:image/png;base64,${base64Image}`;
    });
  };

/**
 * Removes white background using Flood Fill algorithm to preserve inner whites (eyes, teeth, etc).
 * Starts from corners.
 */
export const removeSmartBackground = (img: HTMLImageElement): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(canvas); return; }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        const visited = new Uint8Array(width * height);
        const queue: number[] = [];

        // Helper to get index
        const getIdx = (x: number, y: number) => (y * width + x) * 4;

        // Helper to check if pixel matches background color (White-ish)
        const isBackground = (idx: number) => {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            // Threshold slightly lower to catch shadows/artifacts
            return r > 230 && g > 230 && b > 230;
        };

        // Add corners to queue if they are white
        const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
        
        for (const [cx, cy] of corners) {
            const idx = getIdx(cx, cy);
            if (isBackground(idx)) {
                queue.push(cx, cy);
                visited[cy * width + cx] = 1;
            }
        }

        // BFS Flood Fill
        while (queue.length > 0) {
            const y = queue.pop()!;
            const x = queue.pop()!;
            const idx = getIdx(x, y);

            // Turn transparent
            data[idx + 3] = 0;

            // Check neighbors
            const neighbors = [
                [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
            ];

            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const nPos = ny * width + nx;
                    if (!visited[nPos]) {
                        const nIdx = getIdx(nx, ny);
                        if (isBackground(nIdx)) {
                            visited[nPos] = 1;
                            queue.push(nx, ny);
                        }
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas);
    });
};
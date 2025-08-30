const axios = require('axios');
const fs = require('fs');
const path = require('path');

// YOLO service to process images with the trained model
class YOLOService {
  constructor() {
    this.pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
  }

  async processImageWithYOLO(imagePath) {
    try {
      console.log('🔄 Calling Python YOLO service...');
      
      // Try to call the Python service first
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('image', fs.createReadStream(imagePath));

      const response = await axios.post(`${this.pythonServiceUrl}/process-waste`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000 // 30 seconds timeout
      });

      console.log('✅ Python service response:', response.data);

      if (response.data && response.data.totalWasteArea !== undefined) {
        // Transform Python service response to match our expected format
        const result = {
          detectedObjects: [], // Empty array since we simplified the response
          totalWasteArea: response.data.totalWasteArea,
          estimatedVolume: response.data.estimatedVolume,
          wasteTypes: response.data.wasteTypes || [], // Keep for backward compatibility but will be empty
          severityLevel: response.data.severityLevel,
          processedFilename: response.data.processedFilename,
          processedPath: response.data.processedPath,
          segmentedPath: response.data.segmentedPath
        };
        
        console.log('✅ Using real YOLO results:', result);
        return result;
      }
      
      console.log('❌ Invalid response format from Python service');
      throw new Error('Invalid response from Python service');
    } catch (error) {
      console.warn('❌ YOLO service error, using mock processing:', error.message);
      console.warn('Error details:', error);
      
      // Fallback to mock processing if service is unavailable
      return await this.mockYOLOProcessing(imagePath);
    }
  }

  async mockYOLOProcessing(imagePath) {
    // Mock YOLO processing for development/testing
    const filename = path.basename(imagePath);
    const processedFilename = `processed_${filename}`;
    const segmentedFilename = `segmented_${filename}`;
    
    const processedDir = path.dirname(imagePath);
    const processedPath = path.join(processedDir, processedFilename);
    const segmentedPath = path.join(processedDir, segmentedFilename);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock detection results - simplified without specific classes
    // Randomly decide if waste is detected or not for testing
    const shouldDetectWaste = Math.random() > 0.3; // 70% chance of detecting waste
    
    let mockDetectedObjects = [];
    let totalWasteArea = 0;
    
    if (shouldDetectWaste) {
      mockDetectedObjects = [
        {
          confidence: 0.85,
          boundingBox: {
            x: 100,
            y: 150,
            width: 80,
            height: 120
          }
        },
        {
          confidence: 0.72,
          boundingBox: {
            x: 200,
            y: 180,
            width: 60,
            height: 90
          }
        }
      ];

      // Calculate mock waste area and volume
      totalWasteArea = mockDetectedObjects.reduce((total, obj) => {
        return total + (obj.boundingBox.width * obj.boundingBox.height);
      }, 0);
    }

    // Estimate volume based on area (mock calculation)
    const estimatedVolume = Math.round((totalWasteArea / 10000) * 100) / 100; // Convert to cubic meters

    // Determine severity level
    let severityLevel = 'low';
    if (totalWasteArea === 0) {
      severityLevel = 'low';
    } else if (estimatedVolume > 5) {
      severityLevel = 'critical';
    } else if (estimatedVolume > 2) {
      severityLevel = 'high';
    } else if (estimatedVolume > 1) {
      severityLevel = 'medium';
    }

    // Copy original image as processed (for demo purposes)
    try {
      fs.copyFileSync(imagePath, processedPath);
      fs.copyFileSync(imagePath, segmentedPath);
    } catch (copyError) {
      console.warn('Could not copy processed images:', copyError);
    }

    return {
      detectedObjects: mockDetectedObjects,
      totalWasteArea,
      estimatedVolume,
      wasteTypes: totalWasteArea > 0 ? ['waste'] : [], // Generic type only
      severityLevel,
      processedFilename,
      processedPath,
      segmentedPath
    };
  }

  // Calculate waste volume from segmented image
  calculateVolumeFromSegmentation(segmentationData) {
    // This would implement actual volume calculation
    // based on segmentation masks and depth estimation
    
    const pixelArea = segmentationData.totalPixels;
    const realWorldScale = 0.001; // 1 pixel = 0.001 m² (adjust based on calibration)
    const averageDepth = 0.1; // 10cm average depth (could be estimated from image analysis)
    
    const volume = pixelArea * realWorldScale * averageDepth;
    return Math.round(volume * 1000) / 1000; // Round to 3 decimal places
  }
}

// Export singleton instance
const yoloService = new YOLOService();

// Export the main function for backward compatibility
const processImageWithYOLO = (imagePath) => {
  return yoloService.processImageWithYOLO(imagePath);
};

module.exports = {
  YOLOService,
  processImageWithYOLO,
  yoloService
};

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
from ultralytics import YOLO
import os
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load the YOLO model
MODEL_PATH = "../train5_11.pt"
model = None

def load_model():
    global model
    try:
        model = YOLO(MODEL_PATH)
        print("✅ YOLO model loaded successfully")
        return True
    except Exception as e:
        print(f"❌ Error loading YOLO model: {e}")
        return False

# Initialize model on startup
load_model()

# Configuration
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

def calculate_volume_from_area(pixel_area, image_shape, depth_estimate=0.1):
    """Calculate estimated volume from pixel area - using old server logic"""
    # Use the same scale as old server: pixel_area/10000 for reasonable values
    volume_m3 = pixel_area / 10000
    return round(volume_m3, 3)

def determine_severity(volume):
    """Determine severity level based on volume only"""
    if volume > 5:
        return 'critical'
    elif volume > 2:
        return 'high'
    elif volume > 1:
        return 'medium'
    else:
        return 'low'

def process_image_yolov8(input_path, output_folder, image_id):
    """Process image with YOLOv8 - EXACTLY like old server"""
    try:
        print(f"🔄 Starting YOLO processing for: {input_path}")
        
        # Check if input file exists
        if not os.path.exists(input_path):
            print(f"❌ Input file not found: {input_path}")
            return 0, None
        
        print(f"📁 Input file size: {os.path.getsize(input_path)} bytes")
        
        # Run inference
        print("🤖 Running YOLO inference...")
        results = model(input_path)
        res = results[0]
        
        print(f"🔍 YOLO results: {len(results)} detections")
        print(f"🔍 Masks available: {res.masks is not None}")
        
        # Calculate pixel area - EXACTLY like old server
        total_waste_area = 0
        if res.masks is not None and res.masks.data is not None:
            mask_data = res.masks.data.cpu().numpy()
            combined_mask = (mask_data.sum(axis=0) > 0).astype('uint8')
            total_waste_area = int(combined_mask.sum())
            print(f"📊 Waste area calculated: {total_waste_area} pixels")
        else:
            print("⚠️ No masks found in YOLO results")
        
        # Create annotated image - EXACTLY like old server
        print("🎨 Creating annotated image...")
        annotated_image = res.plot()
        
        # Save processed image - EXACTLY like old server
        processed_path = os.path.join(output_folder, f"{image_id}.jpg")
        print(f"💾 Saving processed image to: {processed_path}")
        
        success = cv2.imwrite(processed_path, annotated_image)
        if success:
            print(f"✅ Processed image saved successfully: {processed_path}")
            print(f"📁 Processed image size: {os.path.getsize(processed_path)} bytes")
        else:
            print(f"❌ Failed to save processed image to: {processed_path}")
            return total_waste_area, None
        
        return total_waste_area, processed_path
        
    except Exception as e:
        print(f"❌ Error in YOLO processing: {e}")
        import traceback
        traceback.print_exc()
        return 0, None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/process-waste', methods=['POST'])
def process_waste_image():
    """Process uploaded waste image - EXACTLY like old server"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not model:
            return jsonify({'error': 'YOLO model not loaded'}), 500
        
        # Get the original filename from the request to preserve naming convention
        original_uploaded_filename = file.filename
        print(f"📁 Original uploaded filename: {original_uploaded_filename}")
        
        # Generate unique filename for internal processing
        image_id = str(uuid.uuid4())
        internal_filename = f"{image_id}.jpg"
        
        print(f"🆔 Generated image ID: {image_id}")
        
        # Save original image with internal filename
        original_path = os.path.join(UPLOAD_FOLDER, internal_filename)
        file.save(original_path)
        print(f"💾 Saved original image to: {original_path}")
        
        # Process image with YOLO model
        total_waste_area, processed_path = process_image_yolov8(
            original_path, PROCESSED_FOLDER, image_id
        )
        
        print(f"🔍 YOLO processing complete. Waste area: {total_waste_area}, Processed path: {processed_path}")
        
        # Calculate estimated volume
        estimated_volume = calculate_volume_from_area(total_waste_area, (0, 0))
        
        # Determine severity level - if no waste detected, set to low
        severity_level = 'low' if total_waste_area == 0 else determine_severity(estimated_volume)
        
        # Create processed filename that matches backend naming convention
        if original_uploaded_filename:
            # Extract the base name without extension
            base_name = os.path.splitext(original_uploaded_filename)[0]
            # Create processed filename with "processed_" prefix
            processed_filename = f"processed_{base_name}.jpg"
            
            # Rename the processed file to match backend naming convention
            if processed_path and os.path.exists(processed_path):
                new_processed_path = os.path.join(PROCESSED_FOLDER, processed_filename)
                os.rename(processed_path, new_processed_path)
                processed_path = new_processed_path
                print(f"✅ Renamed processed image to: {processed_filename}")
            else:
                print(f"⚠️ Processed path not found or doesn't exist: {processed_path}")
                processed_filename = None
        else:
            print("⚠️ No original filename found, using UUID")
            processed_filename = os.path.basename(processed_path) if processed_path else None
        
        # Simple response - EXACTLY like old server
        response_data = {
            'totalWasteArea': float(total_waste_area),
            'estimatedVolume': estimated_volume,
            'wasteTypes': ['waste'] if total_waste_area > 0 else [],
            'severityLevel': severity_level,
            'processedFilename': processed_filename,
            'processedPath': processed_path
        }
        
        print(f"📤 Sending response: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Error processing image: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Image processing failed: {str(e)}'}), 500

@app.route('/model-info', methods=['GET'])
def get_model_info():
    """Get information about the loaded model"""
    if not model:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        return jsonify({
            'model_path': MODEL_PATH,
            'model_loaded': True,
            'supported_classes': {'waste': 'General waste detection'},
            'total_classes': 1
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/processed/<filename>', methods=['GET'])
def serve_processed_image(filename):
    """Serve processed images"""
    try:
        return send_from_directory(PROCESSED_FOLDER, filename)
    except Exception as e:
        return jsonify({'error': f'Image not found: {str(e)}'}), 404

@app.route('/uploads/<filename>', methods=['GET'])
def serve_uploaded_image(filename):
    """Serve uploaded images"""
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception as e:
        return jsonify({'error': f'Image not found: {str(e)}'}), 404

@app.route('/locations', methods=['GET'])
def get_locations():
    """Get locations for heatmap - like old server"""
    try:
        # This would normally read from a database
        # For now, return empty array - the backend will handle this
        return jsonify([])
    except Exception as e:
        return jsonify({'error': f'Failed to get locations: {str(e)}'}), 500

if __name__ == '__main__':
    print("🚀 Starting Waste Patrol Python Service...")
    print(f"📊 Model path: {MODEL_PATH}")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"📁 Processed folder: {PROCESSED_FOLDER}")
    
    if model:
        print("✅ YOLO model ready for inference")
    else:
        print("❌ YOLO model failed to load")
    
    # Disable debug mode and auto-reload to prevent interruptions during YOLO processing
    app.run(host='0.0.0.0', port=8000, debug=False, use_reloader=False)

from flask import Flask, request, jsonify, Response
from PIL import Image
from flask_cors import CORS
import torch
from transformers import GPT2Tokenizer, GPT2LMHeadModel, AutoImageProcessor, AutoModelForImageClassification
from inference_sdk import InferenceHTTPClient
import torchvision.transforms as transforms
from llama_cpp import Llama


app = Flask(__name__)
CORS(app)

# Initialize the Inference Client for ingredient detection
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="UAEhJTTEiYuSU7uPrBFN"
)

def load_model():
    global llm
    try:
        # Utilize GPU by setting n_gpu_layers to a positive number
        llm = Llama(model_path=r"../unsloth.Q8_0.gguf", n_ctx=512, n_batch=32, n_gpu_layers=20)
        print("Model loaded successfully with GPU acceleration.")
    except Exception as e:
        print(f"Error loading model: {e}")
        llm = None

load_model()



# Model paths for both image classification and recipe generation
image_model_path = "illusion002/food-image-classification"
recipe_model_path = "Shresthadev403/controlled-food-recipe-generation"

# Load image classification model
processor = AutoImageProcessor.from_pretrained(image_model_path)
image_model = AutoModelForImageClassification.from_pretrained(image_model_path)




@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get("message", "").strip()
    if not user_input:
        return Response("Please enter a message.", mimetype='text/plain')

    # Adjust the system prompt based on the input format (dish name or ingredients)
    system_prompt = "You are a cooking assistant. If the user provides a dish name, give the detailed recipe beginning. If the user provides ingredients, suggest possible recipes using those ingredients."
    full_prompt = f"{system_prompt}\nUser: {user_input}\nAssistant:"

    def generate_response():
        try:
            max_tokens = 256 - len(full_prompt.split())  # Adjust max tokens dynamically
            for chunk in llm(
                full_prompt,
                stop=["User:", "Assistant:"],  # Define clear stop sequences
                stream=True,
                max_tokens=max_tokens,
                temperature=0.9,   # Control randomness
                top_p=0.9,         # Control diversity
                repeat_penalty=1.2 # Discourage repetition
            ):
                yield chunk['choices'][0]['text']
        except Exception as e:
            yield f"Error generating response: {str(e)}"

    return Response(generate_response(), mimetype='text/plain')


@app.route('/classify', methods=['POST'])
def classify_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    image_file = request.files['image']
    try:
        image = Image.open(image_file).convert('RGB').resize((224, 224))
        inputs = processor(images=image, return_tensors="pt")
        
        with torch.no_grad():
            outputs = image_model(**inputs)
        
        predicted_index = torch.argmax(outputs.logits, dim=-1).item()
        confidence = torch.softmax(outputs.logits, dim=-1)[0][predicted_index].item()

        if confidence < 0.1:
            return jsonify({'error': 'Low confidence in classification result'}), 400

        class_labels = image_model.config.id2label
        predicted_label = class_labels.get(predicted_index, "Unknown Dish")

        return jsonify({'dishName': predicted_label, 'confidence': confidence})
    
    except Exception as e:
        return jsonify({'error': f'Failed to process image: {str(e)}'}), 500

def preprocess_image(image):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return transform(image)

@app.route('/detect_ingredients', methods=['POST'])
def detect_ingredients():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    image_file = request.files['image']
    try:
        image = Image.open(image_file).convert('RGB')
        processed_image = preprocess_image(image)
    except Exception as e:
        return jsonify({'error': 'Failed to preprocess image'}), 400
    
    try:
        result = CLIENT.infer(image, model_id="food-ingredients-detection-6ce7j/1")
        return jsonify({'ingredients': result})
    except Exception as e:
        return jsonify({'error': f'Ingredient detection failed: {str(e)}'}), 500




if __name__ == '__main__':
    app.run(debug=True)

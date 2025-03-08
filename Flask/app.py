from flask import Flask, request, jsonify
from PIL import Image
from flask_cors import CORS
import torch
from transformers import GPT2Tokenizer, GPT2LMHeadModel, AutoImageProcessor, AutoModelForImageClassification
from inference_sdk import InferenceHTTPClient
import torchvision.transforms as transforms

app = Flask(__name__)
CORS(app)

# Initialize the Inference Client for ingredient detection
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="UAEhJTTEiYuSU7uPrBFN"
)

# Model paths for both image classification and recipe generation
image_model_path = "illusion002/food-image-classification"
recipe_model_path = "Shresthadev403/controlled-food-recipe-generation"

# Load image classification model
processor = AutoImageProcessor.from_pretrained(image_model_path)
image_model = AutoModelForImageClassification.from_pretrained(image_model_path)

# Load pre-trained GPT-2 model for recipe generation
recipe_tokenizer = GPT2Tokenizer.from_pretrained(recipe_model_path)
recipe_model = GPT2LMHeadModel.from_pretrained(recipe_model_path)

# Add special tokens
special_tokens = ['<RECIPE_END>', '<INPUT_START>', '<INSTR_START>', '<NEXT_INPUT>', '<INGR_START>', '<NEXT_INGR>', '<NEXT_INSTR>', '<TITLE_START>']
recipe_tokenizer.add_special_tokens({'additional_special_tokens': special_tokens})
recipe_model.resize_token_embeddings(len(recipe_tokenizer))

# Define End-of-Sequence token
custom_eos_token_id = recipe_tokenizer.encode('<RECIPE_END>', add_special_tokens=False)[0]
recipe_model.config.eos_token_id = custom_eos_token_id


def convert_tokens_to_string(tokens):
    if not tokens:
        return ""
    cleaned_tokens = [token for token in tokens if token is not None and token not in recipe_tokenizer.all_special_ids]
    return recipe_tokenizer.decode(cleaned_tokens, skip_special_tokens=True) if cleaned_tokens else ""


def generate_text(prompt):
    recipe_model.eval()
    input_ids = recipe_tokenizer.encode(prompt, return_tensors='pt')
    attention_mask = torch.ones_like(input_ids)
    
    output = recipe_model.generate(
        input_ids=input_ids,
        attention_mask=attention_mask,
        max_length=500,
        num_return_sequences=1,
        eos_token_id=custom_eos_token_id
    )
    
    generated_text = recipe_tokenizer.decode(output[0], skip_special_tokens=True)
    for token in special_tokens:
        generated_text = generated_text.replace(token, '\n')
    
    return generated_text.strip()


@app.route('/generate_recipe', methods=['POST'])
def generate_recipe():
    data = request.json
    prompt = data.get('dishName', '').strip()
    if not prompt:
        return jsonify({'error': 'Dish name is required'}), 400
    
    print(f"Generating recipe for: {prompt}")
    generated_text = generate_text(prompt)
    return jsonify({'generated_text': generated_text})


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

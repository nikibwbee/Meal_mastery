from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from PIL import Image
import torch
import json
import difflib
import re
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TextIteratorStreamer,
    AutoImageProcessor,
    AutoModelForImageClassification,
)
import threading
from ultralytics import YOLO  # for your local YOLOv8 model
import os
import tempfile

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Load your recipes.json file and create lookup dict
with open("file.json", "r") as f:
    recipes_list = json.load(f)

local_recipes = {
    (r.get("dishName") or r.get("name", "")).lower(): r
    for r in recipes_list
    if r.get("dishName") or r.get("name")
}

def find_recipe_from_json(query, ingredients=None):
    query = query.lower().strip()
    if query in local_recipes:
        return local_recipes[query]

    match = difflib.get_close_matches(query, local_recipes.keys(), n=1, cutoff=0.75)
    if match:
        return local_recipes[match[0]]

    if ingredients:
        scored = []
        for name, data in local_recipes.items():
            recipe_ingredients = set(map(str.lower, data.get("ingredients", [])))
            match_count = len(set(ingredients) & recipe_ingredients)
            scored.append((match_count, name))
        scored.sort(reverse=True)
        if scored and scored[0][0] > 0:
            return local_recipes[scored[0][1]]

    return None

def parse_recipe_text(text):
    def extract_field(field_name):
        pattern = re.compile(rf"{field_name}:\s*(.*)", re.IGNORECASE)
        match = pattern.search(text)
        return match.group(1).strip() if match else None

    cuisine = extract_field("Cuisine")
    prep_time = extract_field("Prep Time")
    cook_time = extract_field("Cook Time")
    servings_raw = extract_field("Servings")
    servings = None
    if servings_raw:
        try:
            servings = int(servings_raw)
        except:
            servings = servings_raw

    ingredients_match = re.search(r"Ingredients:\n(.*?)\n\n", text, re.DOTALL | re.IGNORECASE)
    ingredients_text = ingredients_match.group(1) if ingredients_match else ""
    ingredients = [line.strip("- ").strip() for line in ingredients_text.strip().splitlines() if line.strip()]

    steps_match = re.search(r"Steps:\n(.*)", text, re.DOTALL | re.IGNORECASE)
    steps_text = steps_match.group(1) if steps_match else ""
    steps = []
    for line in steps_text.strip().splitlines():
        line = line.strip()
        if re.match(r"^\d+\.", line):
            step_text = re.sub(r"^\d+\.\s*", "", line)
            steps.append(step_text)
    if not steps and steps_text:
        steps = [line.strip() for line in steps_text.strip().splitlines() if line.strip()]

    dishname_match = re.search(r"Recipe:\s*(.*)", text, re.IGNORECASE)
    dish_name = dishname_match.group(1).strip() if dishname_match else None

    return {
        "dishName": dish_name,
        "cuisine": cuisine,
        "prep_time": prep_time,
        "cook_time": cook_time,
        "servings": servings,
        "ingredients": ingredients,
        "steps": steps,
    }

def format_recipe_response(json_recipe):
    dish_name = json_recipe.get("dishName") or json_recipe.get("name") or "Unknown"
    recipe_data = json_recipe.get("recipe")

    if isinstance(recipe_data, dict):
        combined = {**json_recipe, **recipe_data}
        combined["dishName"] = dish_name
        combined["source"] = "local"
        return combined

    elif isinstance(recipe_data, str):
        parsed = parse_recipe_text(recipe_data)
        if not parsed.get("dishName"):
            parsed["dishName"] = dish_name
        parsed["source"] = "local"
        return parsed

    else:
        result = json_recipe.copy()
        result["dishName"] = dish_name
        result["source"] = "local"
        return result

def format_recipe_as_text(recipe):
    lines = [f"Dish Name: {recipe.get('dishName', 'Unknown')}"]

    if recipe.get("cuisine"):
        lines.append(f"Cuisine: {recipe['cuisine']}")
    if recipe.get("prep_time"):
        lines.append(f"Prep Time: {recipe['prep_time']}")
    if recipe.get("cook_time"):
        lines.append(f"Cook Time: {recipe['cook_time']}")
    if recipe.get("servings"):
        lines.append(f"Servings: {recipe['servings']}")
    lines.append("")

    ingredients = recipe.get("ingredients", [])
    if ingredients:
        lines.append("Ingredients:")
        for ingredient in ingredients:
            lines.append(f"- {ingredient}")
        lines.append("")
    else:
        lines.append("Ingredients: Not available\n")

    steps = recipe.get("steps", [])
    if steps:
        lines.append("Steps:")
        for idx, step in enumerate(steps, 1):
            lines.append(f"{idx}. {step}")
    else:
        lines.append("Steps: Not available")

    return "\n".join(lines)

# Load GPT model for recipe generation
model_path = "simonneupane/gpt-finetuned-recipes"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto"
)
model.eval()

# Load image classification model (optional, if you want to keep it)
image_model_path = "Utsav201247/food_recognition"
processor = AutoImageProcessor.from_pretrained(image_model_path)
image_model = AutoModelForImageClassification.from_pretrained(image_model_path)
image_model.eval()

# Load your local YOLOv8 model once globally
yolo_model = YOLO("best.pt")

@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return Response(status=200)

    user_input = request.json.get("message", "").strip()
    if not user_input:
        return Response("Please enter a message.", mimetype='text/plain')

    json_recipe = find_recipe_from_json(user_input)
    if json_recipe:
        clean_recipe = format_recipe_response(json_recipe)
        text_output = format_recipe_as_text(clean_recipe)
        return Response(text_output, mimetype='text/plain')

    prompt = f"You are a cooking assistant.\nUser: {user_input}\nAssistant:"
    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    generation_args = {
        "inputs": inputs["input_ids"],
        "attention_mask": inputs["attention_mask"],
        "max_new_tokens": 256,
        "temperature": 0.9,
        "top_p": 0.9,
        "repetition_penalty": 1.2,
        "do_sample": True,
        "streamer": streamer,
        "pad_token_id": tokenizer.pad_token_id or tokenizer.eos_token_id,
        "eos_token_id": tokenizer.eos_token_id
    }

    def generate():
        model.generate(**generation_args)

    threading.Thread(target=generate).start()
    return Response(streamer, mimetype="text/plain")

@app.route('/classify', methods=['POST', 'OPTIONS'])
def classify():
    if request.method == 'OPTIONS':
        return Response(status=200)

    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    try:
        image = Image.open(request.files['image']).convert('RGB')
        inputs = processor(images=image, return_tensors="pt")

        with torch.no_grad():
            outputs = image_model(**inputs)

        predicted_index = torch.argmax(outputs.logits, dim=-1).item()
        confidence = torch.softmax(outputs.logits, dim=-1)[0][predicted_index].item()
        class_labels = image_model.config.id2label
        predicted_label = class_labels.get(predicted_index, "Unknown Dish")

        if confidence < 0.1:
            return jsonify({"error": "Low confidence in classification"}), 400

        json_recipe = find_recipe_from_json(predicted_label)
        if json_recipe:
            clean_recipe = format_recipe_response(json_recipe)
            text_output = format_recipe_as_text(clean_recipe)
            return Response(text_output, mimetype='text/plain')

        return jsonify({
            "dishName": predicted_label,
            "confidence": confidence,
            "source": "gpt"
        })

    except Exception as e:
        return jsonify({"error": f"Image classification failed: {str(e)}"}), 500

@app.route('/detect_ingredients', methods=['POST', 'OPTIONS'])
def detect_ingredients():
    if request.method == 'OPTIONS':
        return Response(status=200)

    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    image_file = request.files['image']
    try:
        # Save uploaded image to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            temp_filename = tmp.name
            image_file.save(temp_filename)

        # Run YOLO detection on the temporary file path
        results = yolo_model.predict(source=temp_filename, save=False)

        detected = []
        for r in results:
            classes = r.boxes.cls.cpu().numpy()
            for c in classes:
                class_name = yolo_model.names[int(c)]
                detected.append(class_name)

        detected = list(set(detected))  # unique detected classes

        # Delete the temp file after detection
        os.remove(temp_filename)

        # Find recipe matching detected ingredients if any
        json_recipe = find_recipe_from_json("", ingredients=detected)
        if json_recipe:
            response = format_recipe_response(json_recipe)
            response["ingredients_detected"] = detected
            return jsonify(response)

        return jsonify({
            "source": "gpt",
            "ingredients": detected
        })

    except Exception as e:
        return jsonify({'error': f'Ingredient detection failed: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5050, debug=True)

'use client';
import React, { useState, useEffect, useRef } from 'react';

export const IngredientChatbot = () => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSubmit = async () => {
    if (message.trim()) {
      const userMessage = message;
      setChat([...chat, { type: 'user', text: userMessage }]);
      setMessage('');
      setIsLoading(true);  // Set loading true before starting the request
  
      setTimeout(() => {
        const analyzingReply = 'Analyzing your food item...';
        setChat((prevChat) => [...prevChat, { type: 'bot', text: analyzingReply }]);
        generateRecipeFromFlask(userMessage);  // Call the function after showing analyzing message
      }, 1000);
    }
  };
  
  const generateRecipeFromFlask = async (dishName) => {
    try {
      const response = await fetch('http://localhost:5000/generate_recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishName }),
      });
  
      if (!response.ok) throw new Error('Failed to generate recipe');
  
      const data = await response.json();
      console.log("Raw Text from Flask:", data.generated_text);
  
      if (data.generated_text) {
        const rawText = data.generated_text;
  
        const titleMatch = rawText.match(/\s*(.*?)\s*<TITLE_END>/);
        const inputMatch = rawText.match(/<TITLE_END>\s*([\s\S]*?)\s*<INPUT_END>/);
        const ingredientsMatch = rawText.match(/<INPUT_END>\s*([\s\S]*?)\s*<INGR_END>/);
        const instructionsMatch = rawText.match(/<INGR_END>\s*([\s\S]*?)\s*<INSTR_END>/);
  
        const title = titleMatch ? titleMatch[1].trim() : 'Recipe Title';
        const input = inputMatch
          ? inputMatch[1].split('\n').map((item) => item.trim()).filter(Boolean)
          : ['No input available.'];
        const ingredients = ingredientsMatch
          ? ingredientsMatch[1].split('\n').map((ing) => ing.trim()).filter(Boolean)
          : ['No ingredients available.'];
        const instructions = instructionsMatch
          ? instructionsMatch[1].split('\n').map((step) => step.trim()).filter(Boolean)
          : ['No instructions available.'];
  
        setChat((prev) => [
          ...prev,
          {
            type: 'bot',
            text: (
              <div className="recipe-container bg-white text-black p-6 rounded-lg shadow-md text-xs">
                <h2 className="text-xl font-bold text-red-600">Recipe: {title}</h2>
                <h3 className="text-md font-semibold mt-4">📝 Input</h3>
                <ul className="pl-5 text-sm">
                  {input.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <h3 className="text-md font-semibold mt-4">👩‍🍳 Ingredients</h3>
                <ul className="pl-5 text-sm">
                  {ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
                <h3 className="text-md font-semibold mt-4">👨‍🍳 Instructions</h3>
                <ol className="pl-5 text-sm">
                  {instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            ),
          },
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
      setChat((prev) => [...prev, { type: 'bot', text: '🚨 Error generating recipe. Try again!' }]);
    } finally {
      setIsLoading(false);  // Ensure loading is set to false only after recipe generation is done
    }
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setChat([...chat, { type: 'user', text: <img src={reader.result} alt="uploaded" className="max-w-[300px] h-auto rounded-lg shadow-md" /> }]);
        setIsLoading(true);
  
        const formData = new FormData();
        formData.append('image', file);
  
        try {
          const response = await fetch('http://localhost:5000/detect_ingredients', {
            method: 'POST',
            body: formData,
          });
  
          if (response.ok) {
            const result = await response.json();
            console.log(result);
            console.log("Ingredients detected:", result.ingredients.predictions);
  
            if (result.ingredients.predictions && result.ingredients.predictions.length > 0) {
              const detectedIngredients = result.ingredients.predictions
                .map(item => item.class)
                .join(", ");
  
              if (detectedIngredients) {
                setMessage(detectedIngredients);
  
                const botReply = `I found the following ingredient(s): ${detectedIngredients}`;
                setChat((prevChat) => [...prevChat, { type: 'bot', text: botReply }]);
              } else {
                setChat((prevChat) => [...prevChat, { type: 'bot', text: "No ingredients detected in the image." }]);
              }
            } else {
              setChat((prevChat) => [...prevChat, { type: 'bot', text: "No ingredients detected in the image." }]);
            }
          } else {
            setChat((prevChat) => [...prevChat, { type: 'bot', text: "Sorry, something went wrong while detecting ingredients." }]);
          }
          setIsLoading(false);
        } catch (err) {
          console.log("Error during ingredient detection:", err.message);
          setChat((prevChat) => [...prevChat, { type: 'bot', text: "There was an error processing the image for ingredient detection." }]);
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className='flex flex-col items-center mt-[40px] mb-[100px] mx-[10px] h-dvh'>
      <div className='border rounded-[12px] p-[10px] w-[80vw] max-w-[100vw] h-auto flex flex-col justify-between min-h-[440px] bg-neutral-800 text-neutral-100'>
        <div className='flex flex-col gap-[10px] max-h-[400px] overflow-y-auto scrollbar-hidden'>
          {chat.map((entry, index) => (
            <div
              key={index}
              className={`mb-[10px] p-[10px] rounded-[10px] max-w-[70%] ${entry.type === 'user' ? 'self-end bg-blue-500 text-white' : 'self-start bg-gray-200 text-black'}`}
            >
              {entry.text}
            </div>
          ))}
          {isLoading && (
            <div className="self-start text-black p-2 rounded-md flex items-center">
              <div className="animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-black rounded-full"></div>
                <div className="h-2 w-2 bg-black rounded-full"></div>
                <div className="h-2 w-2 bg-black rounded-full"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className='flex justify-center items-center gap-[20px] mt-[20px]'>
          <input
            type='text'
            placeholder='Enter the ingredients or the food'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className='border rounded-[10px] p-[10px] text-[14px] lg:w-[200px] outline-none text-black'
          />
          <div className='flex gap-[10px]'>
            <button
              onClick={handleSubmit}
              className='border rounded-[10px] p-[10px] text-[14px] cursor-pointer bg-blue-500'
            >
              Submit
            </button>
            <label className='border rounded-[10px] p-[10px] text-[14px] cursor-pointer'>
              Image
              <input type="file" onChange={handleImageUpload} className='hidden' />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientChatbot;

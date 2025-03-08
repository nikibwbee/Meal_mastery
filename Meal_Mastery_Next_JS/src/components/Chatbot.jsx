'use client';
import React, { useState, useEffect, useRef } from 'react';

export const Chatbot = () => {
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
      setIsLoading(true);

      setTimeout(() => {
        setChat((prevChat) => [...prevChat, { type: 'bot', text: 'Analyzing your food item...' }]);
        generateRecipeFromFlask(userMessage);
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
                <h2 className="text-2xl font-bold text-red-600">Recipe: {title}</h2>
                <h3 className="text-lg font-semibold mt-4">📝 Input</h3>
                <ul className="pl-5">
                  {input.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <h3 className="text-lg font-semibold mt-4">👩‍🍳 Ingredients</h3>
                <ul className="pl-5">
                  {ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
                <h3 className="text-lg font-semibold mt-4">👨‍🍳 Instructions</h3>
                <ol className="pl-5">
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
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setChat([...chat, { 
          type: 'user', 
          text: <img src={reader.result} alt="uploaded" className="max-w-[150px] h-auto rounded-lg" /> 
        }]);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('image', file);

        try {
          const response = await fetch('http://localhost:5000/classify', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            const botReply = `Ohhh! I see you sent me a picture of ${result.dishName}`;
            setChat((prevChat) => [...prevChat, { type: 'bot', text: botReply }]);
            await generateRecipeFromFlask(result.dishName);
          } else {
            setChat((prevChat) => [...prevChat, { type: 'bot', text: "Sorry, something went wrong while analyzing the image." }]);
          }
        } catch (err) {
          console.log("Error in fetch request", err.message);
          setChat((prevChat) => [...prevChat, { type: 'bot', text: "Error processing the image." }]);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className='flex flex-col items-center mt-[40px] mb-[20px] mx-[10px] h-dvh'>
      <div className='border rounded-[12px] p-[10px] w-[80vw] max-w-[100vw] h-auto flex flex-col justify-between min-h-[440px] bg-neutral-800 text-neutral-100'>
        <div className='flex flex-col gap-[10px] max-h-[400px] overflow-y-auto scrollbar-hidden'>
          {chat.map((entry, index) => (
            <div
              key={index}
              className={`mb-[10px] p-[10px] rounded-[10px] max-w-[70%] text-xs ${
                entry.type === 'user' ? 'self-end bg-blue-500 text-white' : 'self-start bg-gray-200 text-black'
              }`}
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
            placeholder='Enter the food name'
            value={message}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} 
            onChange={(e) => setMessage(e.target.value)}
            className='border rounded-[10px] p-[10px] text-xs lg:w-[200px] outline-none text-black'
          />
          <div className='flex gap-[10px]'>
            <button
              onClick={handleSubmit}
              className='border rounded-[10px] p-[10px] text-xs cursor-pointer bg-blue-500'
            >
              Submit
            </button>
            <label className='border rounded-[10px] p-[10px] text-xs cursor-pointer'>
              Image
              <input type="file" onChange={handleImageUpload} className='hidden' />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
